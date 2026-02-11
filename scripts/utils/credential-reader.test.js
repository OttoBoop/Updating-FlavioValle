/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCredentials, hasCredentials } from './credential-reader.js';
import { generateEncryptionKeys, encryptCredentials } from './credential-crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_ENV_PATH = path.resolve(__dirname, '..', '..', '.env.test');
const ORIGINAL_ENV_PATH = path.resolve(__dirname, '..', '..', '.env');

describe('Credential Reader', () => {
  let testCredentials;
  let testKeys;
  let testEnvContent;

  beforeEach(() => {
    // Prepare test credentials
    testCredentials = {
      wixEmail: 'test@example.com',
      wixPassword: 'testpass123',
      gabineteUsername: 'admin@gabinete.com',
      gabinetePassword: 'adminpass456'
    };

    testKeys = generateEncryptionKeys();
    const encrypted = encryptCredentials(testCredentials, testKeys.encryptionKey, testKeys.encryptionIV);

    testEnvContent = `ENCRYPTION_KEY=${testKeys.encryptionKey}
ENCRYPTION_IV=${testKeys.encryptionIV}
ENCRYPTED_CREDENTIALS=${encrypted}
`;
  });

  afterEach(() => {
    // Clean up test .env file
    if (fs.existsSync(TEST_ENV_PATH)) {
      fs.unlinkSync(TEST_ENV_PATH);
    }
    // Restore original .env if it was backed up
    if (fs.existsSync(ORIGINAL_ENV_PATH + '.backup')) {
      fs.renameSync(ORIGINAL_ENV_PATH + '.backup', ORIGINAL_ENV_PATH);
    }
  });

  describe('hasCredentials', () => {
    it('should return false when .env file does not exist', () => {
      // Ensure no .env file exists
      if (fs.existsSync(ORIGINAL_ENV_PATH)) {
        fs.renameSync(ORIGINAL_ENV_PATH, ORIGINAL_ENV_PATH + '.backup');
      }

      expect(hasCredentials()).toBe(false);
    });

    it('should return true when valid .env file exists', () => {
      // Create valid .env file
      fs.writeFileSync(ORIGINAL_ENV_PATH, testEnvContent, 'utf8');

      expect(hasCredentials()).toBe(true);

      // Clean up
      fs.unlinkSync(ORIGINAL_ENV_PATH);
    });

    it('should return false when .env file is missing required fields', () => {
      // Create incomplete .env file
      const incompleteEnv = `ENCRYPTION_KEY=${testKeys.encryptionKey}
# Missing ENCRYPTION_IV and ENCRYPTED_CREDENTIALS
`;
      fs.writeFileSync(ORIGINAL_ENV_PATH, incompleteEnv, 'utf8');

      expect(hasCredentials()).toBe(false);

      // Clean up
      fs.unlinkSync(ORIGINAL_ENV_PATH);
    });
  });

  describe('loadCredentials', () => {
    it('should load and decrypt credentials from .env file', () => {
      // Create valid .env file
      fs.writeFileSync(ORIGINAL_ENV_PATH, testEnvContent, 'utf8');

      const credentials = loadCredentials();

      expect(credentials).toEqual(testCredentials);

      // Clean up
      fs.unlinkSync(ORIGINAL_ENV_PATH);
    });

    it('should throw error when .env file does not exist', () => {
      // Ensure no .env file exists
      if (fs.existsSync(ORIGINAL_ENV_PATH)) {
        fs.renameSync(ORIGINAL_ENV_PATH, ORIGINAL_ENV_PATH + '.backup');
      }

      expect(() => {
        loadCredentials();
      }).toThrow(/Failed to load .env file/);
    });

    it('should throw error when encryption keys are missing', () => {
      const invalidEnv = `# Missing encryption keys
ENCRYPTED_CREDENTIALS=some-encrypted-data
`;
      fs.writeFileSync(ORIGINAL_ENV_PATH, invalidEnv, 'utf8');

      expect(() => {
        loadCredentials();
      }).toThrow(/Missing encryption keys/);

      // Clean up
      fs.unlinkSync(ORIGINAL_ENV_PATH);
    });

    it('should throw error when encrypted credentials are corrupted', () => {
      const corruptedEnv = `ENCRYPTION_KEY=${testKeys.encryptionKey}
ENCRYPTION_IV=${testKeys.encryptionIV}
ENCRYPTED_CREDENTIALS=corrupted-data-not-valid-hex
`;
      fs.writeFileSync(ORIGINAL_ENV_PATH, corruptedEnv, 'utf8');

      expect(() => {
        loadCredentials();
      }).toThrow(/Failed to decrypt credentials/);

      // Clean up
      fs.unlinkSync(ORIGINAL_ENV_PATH);
    });

    it('should preserve all credential fields', () => {
      fs.writeFileSync(ORIGINAL_ENV_PATH, testEnvContent, 'utf8');

      const credentials = loadCredentials();

      expect(credentials).toHaveProperty('wixEmail');
      expect(credentials).toHaveProperty('wixPassword');
      expect(credentials).toHaveProperty('gabineteUsername');
      expect(credentials).toHaveProperty('gabinetePassword');

      // Clean up
      fs.unlinkSync(ORIGINAL_ENV_PATH);
    });
  });
});
