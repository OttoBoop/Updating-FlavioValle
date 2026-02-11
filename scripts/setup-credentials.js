#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { generateEncryptionKeys, encryptCredentials } from './utils/credential-crypto.js';
import { validateCredentials } from './utils/credential-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Interactive CLI to collect and securely store credentials
 */
async function collectCredentials() {
  console.log(chalk.blue.bold('\n🔐 Wix Registration System - Credential Setup\n'));
  console.log(chalk.gray('This tool will securely encrypt and store your credentials.\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'wixEmail',
      message: 'Wix account email:',
      validate: (input) => {
        if (!input || !input.includes('@')) {
          return 'Please enter a valid email address';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'wixPassword',
      message: 'Wix account password:',
      mask: '*',
      validate: (input) => {
        if (!input || input.length === 0) {
          return 'Password cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'gabineteUsername',
      message: 'gabineteonline username:',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'Username cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'gabinetePassword',
      message: 'gabineteonline password:',
      mask: '*',
      validate: (input) => {
        if (!input || input.length === 0) {
          return 'Password cannot be empty';
        }
        return true;
      }
    }
  ]);

  return answers;
}

/**
 * Encrypt and store credentials in .env file
 */
async function encryptAndStore(credentials) {
  try {
    // Validate credentials
    const validation = validateCredentials(credentials);
    if (!validation.valid) {
      console.error(chalk.red('\n❌ Validation failed:'));
      validation.errors.forEach(error => console.error(chalk.red(`   - ${error}`)));
      process.exit(1);
    }

    // Generate encryption keys
    console.log(chalk.yellow('\n🔑 Generating encryption keys...'));
    const keys = generateEncryptionKeys();

    // Encrypt credentials
    console.log(chalk.yellow('🔐 Encrypting credentials...'));
    const encrypted = encryptCredentials(credentials, keys.encryptionKey, keys.encryptionIV);

    // Create .env content
    const envContent = `# Wix Registration System - Encrypted Credentials
# Generated: ${new Date().toISOString()}
# DO NOT commit this file to version control

ENCRYPTION_KEY=${keys.encryptionKey}
ENCRYPTION_IV=${keys.encryptionIV}
ENCRYPTED_CREDENTIALS=${encrypted}
`;

    // Write to .env file in project root
    const projectRoot = path.resolve(__dirname, '..');
    const envPath = path.join(projectRoot, '.env');

    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log(chalk.green('\n✅ Credentials stored securely!'));
    console.log(chalk.gray(`   Location: ${envPath}`));
    console.log(chalk.gray('   Encryption: AES-256-CBC\n'));

    // Security reminder
    console.log(chalk.yellow.bold('⚠️  Security Reminders:'));
    console.log(chalk.yellow('   1. Never commit .env file to git'));
    console.log(chalk.yellow('   2. Keep .env file permissions restricted'));
    console.log(chalk.yellow('   3. Back up .env file in a secure location\n'));

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const credentials = await collectCredentials();
    await encryptAndStore(credentials);
  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('\n❌ Prompt could not be rendered in this environment\n'));
    } else {
      console.error(chalk.red(`\n❌ Unexpected error: ${error.message}\n`));
    }
    process.exit(1);
  }
}

main();
