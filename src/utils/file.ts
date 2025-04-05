import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { logSuccess } from './logger.js';

/**
 * Create a directory if it doesn't exist
 */
export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    // If directory already exists, ignore the error
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Write content to a file, creating directories if needed
 */
export async function writeContentToFile(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  await ensureDir(dir);
  await writeFile(filePath, content, 'utf-8');
  logSuccess(`File created: ${filePath}`);
}

/**
 * Read the content of a file
 */
export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
  }
}

/**
 * Get the absolute path
 */
export function resolvePath(path: string): string {
  if (path.startsWith('~/')) {
    return join(process.env.HOME || process.env.USERPROFILE || '', path.slice(2));
  }
  return path.startsWith('/') ? path : join(process.cwd(), path);
}