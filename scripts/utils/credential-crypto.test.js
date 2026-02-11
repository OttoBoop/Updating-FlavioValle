/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { encryptCredentials, decryptCredentials, generateEncryptionKeys } from './credential-crypto.js';

describe('Credential Crypto Utilities', () => {
  describe('generateEncryptionKeys', () => {
    it('should generate encryption key and IV', () => {
      const keys = generateEncryptionKeys();

      expect(keys).toBeDefined();
      expect(keys.encryptionKey).toBeDefined();
      expect(keys.encryptionIV).toBeDefined();
    });

    it('should generate 32-byte key (AES-256)', () => {
      const keys = generateEncryptionKeys();
      const keyBuffer = Buffer.from(keys.encryptionKey, 'hex');

      expect(keyBuffer.length).toBe(32); // 256 bits = 32 bytes
    });

    it('should generate 16-byte IV', () => {
      const keys = generateEncryptionKeys();
      const ivBuffer = Buffer.from(keys.encryptionIV, 'hex');

      expect(ivBuffer.length).toBe(16); // AES block size
    });

    it('should generate unique keys on each call', () => {
      const keys1 = generateEncryptionKeys();
      const keys2 = generateEncryptionKeys();

      expect(keys1.encryptionKey).not.toBe(keys2.encryptionKey);
      expect(keys1.encryptionIV).not.toBe(keys2.encryptionIV);
    });
  });

  describe('encryptCredentials', () => {
    let keys;

    beforeEach(() => {
      keys = generateEncryptionKeys();
    });

    it('should encrypt credentials object', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        wixPassword: 'password123',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'securepass456'
      };

      const encrypted = encryptCredentials(credentials, keys.encryptionKey, keys.encryptionIV);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for same input with different keys', () => {
      const credentials = {
        wixEmail: 'test@test.com',
        wixPassword: 'test123',
        gabineteUsername: 'test@gabinete.com',
        gabinetePassword: 'test456'
      };

      const keys1 = generateEncryptionKeys();
      const keys2 = generateEncryptionKeys();

      const encrypted1 = encryptCredentials(credentials, keys1.encryptionKey, keys1.encryptionIV);
      const encrypted2 = encryptCredentials(credentials, keys2.encryptionKey, keys2.encryptionIV);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should not contain plaintext passwords in output', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        wixPassword: 'supersecret',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'topsecret'
      };

      const encrypted = encryptCredentials(credentials, keys.encryptionKey, keys.encryptionIV);

      expect(encrypted).not.toContain('supersecret');
      expect(encrypted).not.toContain('topsecret');
      expect(encrypted).not.toContain('user@example.com');
    });

    it('should throw error for invalid credentials object', () => {
      expect(() => {
        encryptCredentials(null, keys.encryptionKey, keys.encryptionIV);
      }).toThrow();

      expect(() => {
        encryptCredentials({}, keys.encryptionKey, keys.encryptionIV);
      }).toThrow();
    });

    it('should throw error for missing required fields', () => {
      const incompleteCredentials = {
        wixEmail: 'user@example.com'
        // Missing other required fields
      };

      expect(() => {
        encryptCredentials(incompleteCredentials, keys.encryptionKey, keys.encryptionIV);
      }).toThrow(/required fields/i);
    });
  });

  describe('decryptCredentials', () => {
    let keys;
    let originalCredentials;

    beforeEach(() => {
      keys = generateEncryptionKeys();
      originalCredentials = {
        wixEmail: 'user@example.com',
        wixPassword: 'password123',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'securepass456'
      };
    });

    it('should decrypt encrypted credentials', () => {
      const encrypted = encryptCredentials(originalCredentials, keys.encryptionKey, keys.encryptionIV);
      const decrypted = decryptCredentials(encrypted, keys.encryptionKey, keys.encryptionIV);

      expect(decrypted).toEqual(originalCredentials);
    });

    it('should return correct credential fields', () => {
      const encrypted = encryptCredentials(originalCredentials, keys.encryptionKey, keys.encryptionIV);
      const decrypted = decryptCredentials(encrypted, keys.encryptionKey, keys.encryptionIV);

      expect(decrypted.wixEmail).toBe('user@example.com');
      expect(decrypted.wixPassword).toBe('password123');
      expect(decrypted.gabineteUsername).toBe('admin@gabineteonline.com');
      expect(decrypted.gabinetePassword).toBe('securepass456');
    });

    it('should throw error with wrong encryption key', () => {
      const encrypted = encryptCredentials(originalCredentials, keys.encryptionKey, keys.encryptionIV);
      const wrongKeys = generateEncryptionKeys();

      expect(() => {
        decryptCredentials(encrypted, wrongKeys.encryptionKey, keys.encryptionIV);
      }).toThrow();
    });

    it('should throw error with wrong IV', () => {
      const encrypted = encryptCredentials(originalCredentials, keys.encryptionKey, keys.encryptionIV);
      const wrongKeys = generateEncryptionKeys();

      expect(() => {
        decryptCredentials(encrypted, keys.encryptionKey, wrongKeys.encryptionIV);
      }).toThrow();
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => {
        decryptCredentials('invalid-data', keys.encryptionKey, keys.encryptionIV);
      }).toThrow();
    });

    it('should handle special characters in passwords', () => {
      const credentialsWithSpecialChars = {
        wixEmail: 'user@example.com',
        wixPassword: 'p@$$w0rd!#%^&*()',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'sëcürê-p@ss123!'
      };

      const encrypted = encryptCredentials(credentialsWithSpecialChars, keys.encryptionKey, keys.encryptionIV);
      const decrypted = decryptCredentials(encrypted, keys.encryptionKey, keys.encryptionIV);

      expect(decrypted).toEqual(credentialsWithSpecialChars);
    });
  });
});
