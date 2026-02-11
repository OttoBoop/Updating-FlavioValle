#!/usr/bin/env node
/**
 * Wix Authentication Setup Script
 *
 * This script guides you through authenticating with Wix CLI.
 * It runs `wix login` which opens a browser for OAuth authentication.
 *
 * Prerequisites:
 *   - @wix/cli installed globally (npm install -g @wix/cli)
 *   - A Wix account with access to flaviovalle.com
 *
 * Usage:
 *   node setup-wix-auth.js
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue('\n=== Wix Authentication Setup ===\n'));

// Step 1: Check if already authenticated
console.log(chalk.yellow('Checking current authentication status...'));
try {
  const whoami = execSync('wix whoami', { encoding: 'utf8' }).trim();
  if (whoami && !whoami.includes('not authenticated')) {
    console.log(chalk.green(`✓ Already authenticated as: ${whoami}`));
    console.log(chalk.green('\nNo action needed. Authentication is complete!\n'));
    process.exit(0);
  }
} catch (error) {
  // Not authenticated, continue to login
}

console.log(chalk.yellow('Not currently authenticated with Wix.'));
console.log(chalk.blue('\nStarting Wix login process...'));
console.log(chalk.gray('This will open a browser window for OAuth authentication.'));
console.log(chalk.gray('Please complete the login in the browser.\n'));

// Step 2: Run wix login (interactive)
try {
  execSync('wix login', { stdio: 'inherit' });

  // Step 3: Verify authentication succeeded
  const whoami = execSync('wix whoami', { encoding: 'utf8' }).trim();
  if (whoami && !whoami.includes('not authenticated')) {
    console.log(chalk.green(`\n✓ Authentication successful!`));
    console.log(chalk.green(`  Logged in as: ${whoami}`));
  } else {
    console.log(chalk.red('\n✗ Authentication may have failed. Please try again.'));
    process.exit(1);
  }
} catch (error) {
  console.log(chalk.red('\n✗ Authentication failed.'));
  console.log(chalk.red(`  Error: ${error.message}`));
  process.exit(1);
}

// Step 4: List available sites
console.log(chalk.blue('\nChecking available sites...'));
try {
  execSync('wix list', { stdio: 'inherit' });
} catch (error) {
  console.log(chalk.yellow('  Could not list sites. You may need to select a site manually.'));
}

console.log(chalk.green('\n=== Setup Complete ==='));
console.log(chalk.gray('\nNext steps:'));
console.log(chalk.gray('  1. Go to https://manage.wix.com'));
console.log(chalk.gray('  2. Open flaviovalle.com site'));
console.log(chalk.gray('  3. Click "Edit Site" to open the Wix Editor'));
console.log(chalk.gray('  4. Enable "Dev Mode" in the editor'));
console.log(chalk.gray('  5. Start building Velo code!\n'));
