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
- Server deployment configuration
- GitHub secrets setup via API

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

2. Prepare your `.env` file with the following variables:
   ```
   SERVER_HOST=your.server.com
   SERVER_USER=username
   SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----\n...
   ```

3. Follow the interactive prompts to configure your deployment:
   - Choose your Next.js project type
   - Enter your GitHub repository name
   - Provide your GitHub Personal Access Token (PAT)
   - Enter your domain name
   - Specify the path to your .env file

4. The CLI will:
   - Generate Dockerfile and docker-compose.yml
   - Create GitHub workflow for auto-deployment
   - Upload your environment variables as GitHub secrets

## Configuration Options

### 1. Plain Next.js

Basic Next.js project without special environment requirements.

### 2. Next.js with Environment Variables

For projects that require environment variables, with proper handling in the Docker build process.

### 3. Next.js with Prisma

For projects using Prisma ORM, with specialized Docker setup for database connections.

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