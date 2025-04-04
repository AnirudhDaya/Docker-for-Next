import chalk from 'chalk';

/**
 * Log a standard message to the console
 */
export function log(message: string): void {
  console.log(message);
}

/**
 * Log a success message to the console
 */
export function logSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Log an error message to the console
 */
export function logError(message: string): void {
  console.error(chalk.red(`✗ ${message}`));
}

/**
 * Log a warning message to the console
 */
export function logWarning(message: string): void {
  console.warn(chalk.yellow(`⚠ ${message}`));
}

/**
 * Log an info message to the console
 */
export function logInfo(message: string): void {
  console.info(chalk.blue(`ℹ ${message}`));
}

/**
 * Log a step in the process
 */
export function logStep(stepNumber: number, message: string): void {
  console.log(chalk.cyan(`[${stepNumber}] ${message}`));
}