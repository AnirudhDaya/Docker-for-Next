#!/usr/bin/env node


// Banner text will be displayed when CLI starts
import figlet from 'figlet';
import chalk from 'chalk';
import { startCLI } from './cli';

console.log(
  chalk.cyan(
    figlet.textSync('Next.js Deploy CLI', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })
  )
);

// Start the CLI
startCLI();