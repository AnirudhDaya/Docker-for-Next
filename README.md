# Next.js Deploy CLI

A command-line tool for setting up Next.js deployment configurations with Docker and GitHub Actions.

## Features

- Quick setup for three types of Next.js projects:
  - Plain Next.js
  - Next.js with environment variables
  - Next.js with Prisma
- Automatic generation of:
  - Dockerfile
  - docker-compose.yml
  - GitHub Actions workflow for auto-deployment
- Dynamic environment variable handling:
  - Automatically adds your environment variables to deployment files
  - Updates build arguments and runtime environment in Docker
  - Configures GitHub Actions with your environment variables
- GitHub secrets setup via API
- Domain configuration for deployment

## Installation

### Global Installation

```bash
# Using npm
npm install -g nextjs-deploy-cli

# Using Bun
bun install -g nextjs-deploy-cli
```

### Local Usage

```bash
# Using npx
npx nextjs-deploy-cli

# Using Bun
bunx nextjs-deploy-cli
```

## Usage

1. Run the CLI:

```bash
nextjs-deploy
```

2. Prepare your `.env` file with the following required variables plus any additional variables your application needs:
   ```
   SERVER_HOST=your.server.com
   SERVER_USER=username
   SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\n...
   
   # Application-specific variables (examples)
   DATABASE_URL=postgresql://user:password@localhost:5432/mydb
   API_KEY=your_api_key
   ```

3. Follow the interactive prompts to configure your deployment:
   - Choose your Next.js project type
   - Enter your GitHub repository name
   - Provide your GitHub Personal Access Token (PAT)
   - Enter your domain name
   - Specify the path to your .env file

4. The CLI will:
   - Upload your environment variables as GitHub secrets
   - Generate Dockerfile and docker-compose.yml with your environment variables
   - Create GitHub workflow for auto-deployment with your environment variables
   - Configure your domain in the deployment files

## Configuration Options

### 1. Plain Next.js

Basic Next.js project without special environment requirements.

### 2. Next.js with Environment Variables

For projects that require environment variables:
- Automatically adds your environment variables to build and runtime environments
- Configures docker-compose with your environment variables
- Sets up GitHub Actions to securely pass your environment variables during deployment

### 3. Next.js with Prisma

For projects using Prisma ORM:
- Includes all environment variable handling from option 2
- Adds Prisma-specific configuration in Dockerfile
- Sets up proper DATABASE_URL handling for Prisma

## Requirements

- Node.js 18+ or Bun runtime
- Git
- GitHub repository
- SSH access to your deployment server
- Docker and docker-compose on your server

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/nextjs-deploy-cli.git
cd nextjs-deploy-cli

# Install dependencies
bun install

# Run in development mode
bun dev

# Build for production
bun run build
```

## License

MIT