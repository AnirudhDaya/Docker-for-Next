/**
 * Get the GitHub workflow template for a plain Next.js project
 */
export function getPlainNextWorkflow(): string {
  return `name: Deploy to Server

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Allow manual triggering

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Fetch all history for proper exclusion
      
      - name: Get repository name
        id: repo-name
        run: echo "REPO_NAME=\${GITHUB_REPOSITORY#*/}" >> $GITHUB_ENV
      
      - name: Prepare files for deployment
        run: |
          # Create a clean directory for deployment
          mkdir -p deploy
          # Copy files to the clean directory, excluding unwanted files
          rsync -av --exclude='.git/' --exclude='node_modules/' --exclude='.env' . deploy/
      
      - name: Create project directory on server
        uses: appleboy/ssh-action@master
        with:
          host: \${{ secrets.SERVER_HOST }}
          username: \${{ secrets.SERVER_USER }}
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            mkdir -p /home/ssw/\${{ env.REPO_NAME }}
      
      - name: Copy project files to server
        uses: appleboy/scp-action@master
        with:
          host: \${{ secrets.SERVER_HOST }}
          username: \${{ secrets.SERVER_USER }}
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          source: "deploy/*"
          target: "/home/ssw/\${{ env.REPO_NAME }}"
          rm: true  # Remove old files in the target directory
          strip_components: 1  # Remove the 'deploy' directory prefix
      
      - name: Build and deploy on server with secure env handling
        uses: appleboy/ssh-action@master
        with:
          host: \${{ secrets.SERVER_HOST }}
          username: \${{ secrets.SERVER_USER }}
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/ssw/\${{ env.REPO_NAME }}
            
            # Force removal of any existing containers for this project
            docker compose down
            
            # Clean up any old containers/images that might be causing conflicts
            docker container prune -f
            
            # Build and start containers
            docker compose build --no-cache
            docker compose up -d
            
            # Clean up old images
            docker image prune -f
            
            # Verify the container has the correct labels
            docker inspect $(docker compose ps -q web) | grep -A 30 "Labels"`
}