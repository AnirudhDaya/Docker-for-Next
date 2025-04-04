import { writeContentToFile, ensureDir } from '../utils/file.js';
import { DeployConfig, EnvVariables } from '../types.js';
import { generateTemplates } from './template.js';
import { loadEnvFile, generateEnvFileContent } from './env.js';
import { uploadEnvToGitHubSecrets } from '../utils/github.js';
import { log, logStep, logSuccess, logInfo } from '../utils/logger.js';
import { join } from 'path';

/**
 * Setup the deployment configuration
 */
export async function setupDeployment(config: DeployConfig): Promise<void> {
  // Step 1: Initialize and validate
  logStep(1, 'Initializing deployment setup');
  
  let envVariables: EnvVariables = {};
  
  // Load environment variables from .env file
  envVariables = await loadEnvFile(config.envFilePath || '.env');
  
  // Verify that required SSH variables exist
  const requiredVars = ['SERVER_HOST', 'SERVER_USER', 'SSH_PRIVATE_KEY'];
  const missingVars = requiredVars.filter(key => !envVariables[key]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Step 2: Generate deployment files from templates
  logStep(2, 'Generating deployment files');
  const templates = generateTemplates(config.projectType, envVariables, config.domainName);
  
  // Step 3: Write files
  logStep(3, 'Creating project files');
  for (const template of templates) {
    await writeContentToFile(template.fileName, template.content);
  }
  
  // Step 4: Verify SSH configuration
  logStep(4, 'Verifying SSH configuration');
  logInfo('Using SSH configuration from .env file');
  logInfo(`SERVER_HOST: ${envVariables.SERVER_HOST}`);
  logInfo(`SERVER_USER: ${envVariables.SERVER_USER}`);
  logInfo('SSH_PRIVATE_KEY: [Key content hidden]');
  
  // Step 5: Upload environment variables to GitHub
  logStep(5, 'Uploading environment variables to GitHub secrets');
  await uploadEnvToGitHubSecrets(
    config.repoName,
    config.githubPAT,
    config.envFilePath
  );
  
  // Step 6: Provide final instructions
  logStep(6, 'Deployment setup completed');
  
  logSuccess('All deployment files have been created:');
  console.log('- Dockerfile');
  console.log('- docker-compose.yml');
  console.log('- .github/workflows/deploy.yml');

  
  logInfo('Next steps:');
  console.log('1. Commit and push these files to your GitHub repository');
  console.log('2. GitHub Actions will automatically deploy your application');
  console.log('   when you push to the main branch');
  
  console.log('\nNote: The following secrets have been added to your GitHub repository:');
  console.log('- SERVER_HOST');
  console.log('- SERVER_USER');
  console.log('- SSH_PRIVATE_KEY');
  
  if (config.projectType === 'env') {
    console.log('- NEXT_PUBLIC_DATABASE_URL');
  } else if (config.projectType === 'prisma') {
    console.log('- DATABASE_URL');
  }
}