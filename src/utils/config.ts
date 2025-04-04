import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DeployConfig } from '../types.js';
import { logInfo } from './logger.js';

interface ConfigFile {
  lastUsed?: DeployConfig;
  savedConfigurations?: Record<string, DeployConfig>;
}

/**
 * Path to the config file in the user's home directory
 */
const CONFIG_PATH = join(homedir(), '.nextjs-deploy-cli.json');

/**
 * Save the configuration to a config file for future use
 */
export async function saveConfig(config: DeployConfig, name?: string): Promise<void> {
  try {
    // Read existing config or create a new one
    let configFile: ConfigFile;
    try {
      const fileContent = await readFile(CONFIG_PATH, 'utf-8');
      configFile = JSON.parse(fileContent);
    } catch (error) {
      configFile = {};
    }

    // Update the last used config
    configFile.lastUsed = config;

    // If a name is provided, save it as a named configuration
    if (name) {
      if (!configFile.savedConfigurations) {
        configFile.savedConfigurations = {};
      }
      configFile.savedConfigurations[name] = config;
      logInfo(`Configuration saved as "${name}"`);
    }

    // Write the updated config back to file
    await writeFile(CONFIG_PATH, JSON.stringify(configFile, null, 2), 'utf-8');
  } catch (error) {
    // If saving fails, don't crash but log a warning
    console.warn(`Failed to save configuration: ${(error as Error).message}`);
  }
}

/**
 * Load the configuration from the config file
 */
export async function loadConfig(name?: string): Promise<DeployConfig | null> {
  try {
    const fileContent = await readFile(CONFIG_PATH, 'utf-8');
    const configFile = JSON.parse(fileContent) as ConfigFile;

    if (name && configFile.savedConfigurations && configFile.savedConfigurations[name]) {
      return configFile.savedConfigurations[name];
    }

    return configFile.lastUsed || null;
  } catch (error) {
    // If loading fails, return null
    return null;
  }
}

/**
 * Get a list of saved configuration names
 */
export async function getSavedConfigNames(): Promise<string[]> {
  try {
    const fileContent = await readFile(CONFIG_PATH, 'utf-8');
    const configFile = JSON.parse(fileContent) as ConfigFile;

    if (configFile.savedConfigurations) {
      return Object.keys(configFile.savedConfigurations);
    }

    return [];
  } catch (error) {
    return [];
  }
}