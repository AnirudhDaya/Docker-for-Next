import inquirer from 'inquirer';
import chalk from 'chalk';
import { ProjectType, DeployConfig } from './types.js';
import { setupDeployment } from './services/deploy.js';
import { loadEnvFile } from './services/env.js';
import { log, logSuccess, logError, logInfo } from './utils/logger.js';

/**
 * Start the CLI application
 */
export async function startCLI(): Promise<void> {
  try {
    const config = await promptForConfig();
    
    log(chalk.blue('Starting deployment setup...'));
    
    // If the user selected ENV or PRISMA type, load environment variables
    if (config.projectType !== ProjectType.PLAIN && config.envFilePath) {
      await loadEnvFile(config.envFilePath);
    }
    
    // Setup deployment
    await setupDeployment(config);
    
    logSuccess('Deployment setup completed successfully!');
    process.exit(0);
  } catch (error) {
    logError('Failed to setup deployment');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * Prompt the user for configuration options
 */
async function promptForConfig(): Promise<DeployConfig> {
  // First, prompt for project type
  const { projectType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'projectType',
      message: 'Select the type of Next.js project:',
      choices: [
        { name: 'Plain Next.js', value: ProjectType.PLAIN },
        { name: 'Next.js with .env', value: ProjectType.ENV },
        { name: 'Next.js with Prisma', value: ProjectType.PRISMA },
      ],
    },
  ]);

  // Ask for common information
  const commonQuestions = await inquirer.prompt([
    {
      type: 'input',
      name: 'repoName',
      message: 'Enter the GitHub repository name (e.g., username/repo):',
      validate: (input: string) => {
        return input.includes('/') ? true : 'Please enter in the format username/repo';
      },
    },
    {
      type: 'input',
      name: 'domainName',
      message: 'Enter the domain name for deployment (e.g., example.com):',
    },
    {
      type: 'password',
      name: 'githubPAT',
      message: 'Enter your GitHub Personal Access Token (for setting secrets):',
      validate: (input: string) => (input.trim() ? true : 'GitHub PAT is required'),
    },
  ]);

  // Show notice about required env variables
  logInfo('Important: Your .env file should include the following variables:');
  console.log('- SERVER_HOST (SSH host for deployment)');
  console.log('- SERVER_USER (SSH username for deployment)');
  console.log('- SSH_PRIVATE_KEY (SSH private key for deployment)');
  console.log('');

  // Ask for env file path
  const { envFilePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'envFilePath',
      message: 'Enter the path to your .env file:',
      validate: (input: string) => (input.trim() ? true : '.env file path is required'),
    },
  ]);

  const productionQuestions = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupProdBranch',
      message: 'Do you want to setup a production branch with separate workflow?',
      default: true,
    }
  ]);


  // If user wants production branch setup
  let prodConfig = {};
  if (productionQuestions.setupProdBranch) {
    prodConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'prodDomainName',
        message: 'Enter the domain name for production deployment:',
        validate: (input: string) => (input.trim() ? true : 'Production domain name is required'),
      },
      {
        type: 'input',
        name: 'prodPort',
        message: 'Enter the port for production deployment:',
        default: '3000',
        validate: (input: string) => {
          const port = parseInt(input);
          return (!isNaN(port) && port > 0 && port < 65536) ? true : 'Please enter a valid port number';
        },
      },
    ]);
  }

  return {
    projectType,
    ...commonQuestions,
    envFilePath,
    ...productionQuestions,
    ...prodConfig
  };
}
