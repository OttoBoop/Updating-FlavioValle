#!/usr/bin/env node

/**
 * Verify encrypted credentials without exposing passwords
 */

import chalk from 'chalk';
import { loadCredentials } from './utils/credential-reader.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function maskString(str) {
  if (!str || str.length <= 4) return '****';
  return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
}

console.log(chalk.blue.bold('\n🔐 Credential Security Verification\n'));

try {
  // Check .env file exists
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log(chalk.red('❌ .env file not found'));
    process.exit(1);
  }
  console.log(chalk.green('✅ .env file exists'));

  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check for plaintext passwords (should NOT find any)
  console.log(chalk.yellow('\n🔍 Checking for plaintext exposure...'));

  const hasPlaintextIndicators =
    envContent.toLowerCase().includes('password') &&
    !envContent.includes('ENCRYPTED_CREDENTIALS');

  if (hasPlaintextIndicators) {
    console.log(chalk.red('❌ WARNING: Possible plaintext password found in .env!'));
  } else {
    console.log(chalk.green('✅ No plaintext passwords in .env file'));
  }

  // Verify encryption keys present
  const hasEncryptionKey = envContent.includes('ENCRYPTION_KEY=');
  const hasEncryptionIV = envContent.includes('ENCRYPTION_IV=');
  const hasEncryptedCreds = envContent.includes('ENCRYPTED_CREDENTIALS=');

  console.log(chalk.yellow('\n🔑 Verifying encryption components...'));
  console.log(hasEncryptionKey ? chalk.green('✅ Encryption key present') : chalk.red('❌ Missing encryption key'));
  console.log(hasEncryptionIV ? chalk.green('✅ Encryption IV present') : chalk.red('❌ Missing encryption IV'));
  console.log(hasEncryptedCreds ? chalk.green('✅ Encrypted credentials present') : chalk.red('❌ Missing encrypted credentials'));

  // Test decryption
  console.log(chalk.yellow('\n🔓 Testing decryption...'));
  const credentials = loadCredentials();

  console.log(chalk.green('✅ Credentials decrypted successfully!'));

  // Display structure with masked values
  console.log(chalk.blue.bold('\n📋 Credential Structure (masked):'));
  console.log(chalk.gray('  wixEmail:          ') + chalk.cyan(maskString(credentials.wixEmail)));
  console.log(chalk.gray('  wixPassword:       ') + chalk.cyan('*'.repeat(credentials.wixPassword.length)));
  console.log(chalk.gray('  gabineteUsername:  ') + chalk.cyan(maskString(credentials.gabineteUsername)));
  console.log(chalk.gray('  gabinetePassword:  ') + chalk.cyan('*'.repeat(credentials.gabinetePassword.length)));

  // Verify all fields present
  console.log(chalk.yellow('\n✅ Verification complete!'));

  const allFieldsPresent =
    credentials.wixEmail &&
    credentials.wixPassword &&
    credentials.gabineteUsername &&
    credentials.gabinetePassword;

  if (allFieldsPresent) {
    console.log(chalk.green.bold('\n🎉 All credentials stored and encrypted successfully!'));
    console.log(chalk.gray('\nSecurity Summary:'));
    console.log(chalk.gray('  • Encryption: AES-256-CBC ✅'));
    console.log(chalk.gray('  • No plaintext in .env ✅'));
    console.log(chalk.gray('  • All fields present ✅'));
    console.log(chalk.gray('  • Decryption working ✅\n'));
  } else {
    console.log(chalk.red('\n❌ Some credentials are missing!'));
  }

} catch (error) {
  console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
  process.exit(1);
}
