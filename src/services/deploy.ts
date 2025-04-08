import { writeContentToFile } from '../utils/file.js';
import { DeployConfig, EnvVariables } from '../types.js';

import { loadEnvFile } from './env.js';
import { uploadEnvToGitHubSecrets } from '../utils/github.js';
import { logStep, logSuccess, logInfo } from '../utils/logger.js';
import { generateTemplates } from './template.js';


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
  
  // Step 2: Generate placeholder deployment files (will be updated after uploading to GitHub)
  
  // We'll write files in Step 6 after getting the dynamic env variables
  
  // Step 4: Verify SSH configuration
  logStep(4, 'Verifying SSH configuration');
  logInfo('Using SSH configuration from .env file');
  logInfo(`SERVER_HOST: ${envVariables.SERVER_HOST}`);
  logInfo(`SERVER_USER: ${envVariables.SERVER_USER}`);
  logInfo('SSH_PRIVATE_KEY: [Key content hidden]');
  
  // Step 5: Upload environment variables to GitHub
  logStep(5, 'Uploading environment variables to GitHub secrets');
  const { response, envVars } = await uploadEnvToGitHubSecrets(
    config.repoName,
    config.githubPAT,
    config.envFilePath
  );
  
  // Step 6: Generate templates with dynamic environment variables and write files
  logStep(6, 'Generating and writing deployment files with dynamic environment variables');
  const templates = generateTemplates(
    config.setupProdBranch,
    config.projectType, 
    envVariables, 
    config.domainName,
    config.prodDomainName,
    config.prodPort,
    envVars
  );
  
  // Write the files
  for (const template of templates) {
    await writeContentToFile(template.fileName, template.content);
  }
  
  // Step 7: Provide final instructions
  logStep(7, 'Deployment setup completed');
  
  logSuccess('All deployment files have been created:');
  console.log('- Dockerfile');
  console.log('- docker-compose.yml');
  console.log('- .github/workflows/deploy.yml');
  
  if (config.setupProdBranch) {
    console.log('- .github/workflows/deploy-prod.yml');
  }
  
  logInfo('Next steps:');
  console.log('1. Commit and push these files to your GitHub repository');
  console.log('2. GitHub Actions will automatically deploy your application');
  console.log('   when you push to the main branch');
  
  if (config.setupProdBranch) {
    console.log('3. For production deployment, merge changes to the prod branch or manually trigger the deploy-prod workflow');
  }
  
  console.log('\nNote: The following secrets have been added to your GitHub repository:');
  envVars.forEach(varName => {
    console.log(`- ${varName}`);
  });
  
  if (config.setupProdBranch && config.prodDomainName) {
    console.log('\nProduction deployment information:');
    console.log(`- Domain: ${config.prodDomainName}`);
    if (config.prodPort) {
      console.log(`- Port: ${config.prodPort}`);
    }
  }
}