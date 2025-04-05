import { GitHubSecretsResponse } from '../types.js';
import { log, logSuccess, logError } from './logger.js';
import { resolvePath } from './file.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

/**
 * Upload environment variables to GitHub secrets using curl
 */
export async function uploadEnvToGitHubSecrets(
  repo: string,
  pat: string,
  envFilePath: string
): Promise<{response: GitHubSecretsResponse, envVars: string[]}>  {
  try {
    // Resolve env file path
    const resolvedEnvPath = resolvePath(envFilePath);
    
    log('Uploading environment variables to GitHub secrets...');
    
    // Use curl directly as it handles multipart/form-data properly
    const curlCommand = `curl -X POST 'https://github-secrets.vercel.app/api/github-secrets' \
      -F 'repo=${repo}' \
      -F 'pat=${pat}' \
      -F 'env=@${resolvedEnvPath}'`;
    
    const { stdout, stderr } = await execPromise(curlCommand);
    
    if (stderr) {
      logError(`Error from curl: ${stderr}`);
    }
    
    // Parse the response
    const result = JSON.parse(stdout) as GitHubSecretsResponse;
    
    if (result.success) {
      logSuccess('Successfully uploaded environment variables to GitHub secrets');
    } else {
      logError('Failed to upload some environment variables to GitHub secrets');
      if (result.variables && result.variables.length > 0) {
        logError(`Failed variables: ${result.variables.join(', ')}`);
      }
    }
    return {
      response: result,
      envVars: result.variables || []
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Failed to upload environment variables: ${errorMessage}`);
    
    throw new Error(`Failed to upload environment variables: ${(error as Error).message}`);
  }
}