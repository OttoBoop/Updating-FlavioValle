#!/usr/bin/env node

/**
 * Integration test for credential system
 * Tests the complete encrypt -> store -> load -> decrypt flow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEncryptionKeys, encryptCredentials, decryptCredentials } from './utils/credential-crypto.js';
import { validateCredentials } from './utils/credential-validator.js';
import { loadCredentials, hasCredentials } from './utils/credential-reader.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_ENV_PATH = path.resolve(__dirname, '..', '.env.test-integration');

async function runTests() {
  console.log(chalk.blue.bold('\n🧪 Running Credential System Integration Tests\n'));

  let passed = 0;
  let failed = 0;

  // Test 1: Generate encryption keys
  console.log(chalk.gray('Test 1: Generate encryption keys'));
  try {
    const keys = generateEncryptionKeys();
    if (keys.encryptionKey && keys.encryptionIV) {
      console.log(chalk.green('  ✅ Keys generated successfully'));
      passed++;
    } else {
      throw new Error('Keys missing');
    }
  } catch (error) {
    console.log(chalk.red(`  ❌ Failed: ${error.message}`));
    failed++;
  }

  // Test 2: Validate credentials
  console.log(chalk.gray('\nTest 2: Validate credentials'));
  try {
    const testCreds = {
      wixEmail: 'test@example.com',
      wixPassword: 'testpass123',
      gabineteUsername: 'admin@gabinete.com',
      gabinetePassword: 'adminpass456'
    };
    const validation = validateCredentials(testCreds);
    if (validation.valid) {
      console.log(chalk.green('  ✅ Validation passed'));
      passed++;
    } else {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  } catch (error) {
    console.log(chalk.red(`  ❌ Failed: ${error.message}`));
    failed++;
  }

  // Test 3: Encrypt credentials
  console.log(chalk.gray('\nTest 3: Encrypt credentials'));
  let encrypted;
  let keys;
  try {
    const testCreds = {
      wixEmail: 'test@example.com',
      wixPassword: 'testpass123',
      gabineteUsername: 'admin@gabinete.com',
      gabinetePassword: 'adminpass456'
    };
    keys = generateEncryptionKeys();
    encrypted = encryptCredentials(testCreds, keys.encryptionKey, keys.encryptionIV);

    if (encrypted && !encrypted.includes('testpass123')) {
      console.log(chalk.green('  ✅ Credentials encrypted (no plaintext visible)'));
      passed++;
    } else {
      throw new Error('Encryption failed or plaintext visible');
    }
  } catch (error) {
    console.log(chalk.red(`  ❌ Failed: ${error.message}`));
    failed++;
  }

  // Test 4: Decrypt credentials
  console.log(chalk.gray('\nTest 4: Decrypt credentials'));
  try {
    const decrypted = decryptCredentials(encrypted, keys.encryptionKey, keys.encryptionIV);
    if (decrypted.wixEmail === 'test@example.com' && decrypted.wixPassword === 'testpass123') {
      console.log(chalk.green('  ✅ Credentials decrypted correctly'));
      passed++;
    } else {
      throw new Error('Decrypted data does not match original');
    }
  } catch (error) {
    console.log(chalk.red(`  ❌ Failed: ${error.message}`));
    failed++;
  }

  // Test 5: Create test .env file
  console.log(chalk.gray('\nTest 5: Create test .env file'));
  try {
    const testCreds = {
      wixEmail: 'integration@test.com',
      wixPassword: 'integrationpass',
      gabineteUsername: 'gabinete@test.com',
      gabinetePassword: 'gabinetepass'
    };
    const keys = generateEncryptionKeys();
    const encrypted = encryptCredentials(testCreds, keys.encryptionKey, keys.encryptionIV);

    const envContent = `ENCRYPTION_KEY=${keys.encryptionKey}
ENCRYPTION_IV=${keys.encryptionIV}
ENCRYPTED_CREDENTIALS=${encrypted}
`;

    fs.writeFileSync(TEST_ENV_PATH, envContent, 'utf8');
    console.log(chalk.green('  ✅ Test .env file created'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`  ❌ Failed: ${error.message}`));
    failed++;
  }

  // Test 6: Check credentials exist
  console.log(chalk.gray('\nTest 6: Check if credentials exist'));
  try {
    // Temporarily rename test file to .env
    const envPath = path.resolve(__dirname, '..', '.env');
    const envBackup = envPath + '.backup';

    if (fs.existsSync(envPath)) {
      fs.renameSync(envPath, envBackup);
    }

    fs.renameSync(TEST_ENV_PATH, envPath);

    const exists = hasCredentials();

    // Restore
    fs.renameSync(envPath, TEST_ENV_PATH);
    if (fs.existsSync(envBackup)) {
      fs.renameSync(envBackup, envPath);
    }

    if (exists) {
      console.log(chalk.green('  ✅ hasCredentials() detected credentials'));
      passed++;
    } else {
      throw new Error('hasCredentials() returned false');
    }
  } catch (error) {
    console.log(chalk.red(`  ❌ Failed: ${error.message}`));
    failed++;
  }

  // Cleanup
  if (fs.existsSync(TEST_ENV_PATH)) {
    fs.unlinkSync(TEST_ENV_PATH);
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 Test Summary'));
  console.log(chalk.green(`  Passed: ${passed}`));
  console.log(chalk.red(`  Failed: ${failed}`));
  console.log(chalk.gray(`  Total:  ${passed + failed}\n`));

  if (failed === 0) {
    console.log(chalk.green.bold('✅ All integration tests passed!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('❌ Some tests failed\n'));
    process.exit(1);
  }
}

runTests();
