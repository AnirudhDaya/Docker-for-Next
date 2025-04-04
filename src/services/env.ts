import { readFileContent, resolvePath } from '../utils/file.js';
import { EnvVariables } from '../types.js';
import { logInfo } from '../utils/logger.js';

/**
 * Parse environment variables from a .env file
 * @param content - The content of the .env file
 * @returns Object with key-value pairs of environment variables
 */
export function parseEnvFile(content: string): EnvVariables {
  const env: EnvVariables = {};
  
  // Split by new lines and process each line
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  
  for (const line of lines) {
    // Find the first equals sign (ignoring those in the value)
    const equalsIndex = line.indexOf('=');
    if (equalsIndex > 0) {
      const key = line.substring(0, equalsIndex).trim();
      let value = line.substring(equalsIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      env[key] = value;
    }
  }
  
  return env;
}

/**
 * Load environment variables from a .env file
 * @param filePath - Path to the .env file
 */
export async function loadEnvFile(filePath: string): Promise<EnvVariables> {
  try {
    const resolvedPath = resolvePath(filePath);
    const content = await readFileContent(resolvedPath);
    const envVars = parseEnvFile(content);
    
    logInfo(`Loaded ${Object.keys(envVars).length} environment variables from ${filePath}`);
    return envVars;
  } catch (error) {
    throw new Error(`Failed to load .env file: ${(error as Error).message}`);
  }
}

/**
 * Replace environment variable placeholders in a template
 * @param template - The template string with placeholders
 * @param variables - The environment variables to inject
 * @returns The template with variables replaced
 */
export function injectEnvVariables(template: string, variables: EnvVariables): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    // Replace ${VAR_NAME} format
    const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(placeholder, value);
    
    // Replace $VAR_NAME format
    const placeholder2 = new RegExp(`\\$${key}\\b`, 'g');
    result = result.replace(placeholder2, value);
  }
  
  return result;
}

/**
 * Generate a .env file content from variables
 * @param variables - The environment variables to include
 * @returns String content of the .env file
 */
export function generateEnvFileContent(variables: EnvVariables): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}