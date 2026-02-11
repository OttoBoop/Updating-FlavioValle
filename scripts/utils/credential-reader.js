import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { decryptCredentials } from './credential-crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and decrypt credentials from .env file
 * @returns {Object} Decrypted credentials
 * @throws {Error} If .env file not found or decryption fails
 */
export function loadCredentials() {
  // Load .env file from project root
  const projectRoot = path.resolve(__dirname, '..', '..');
  const envPath = path.join(projectRoot, '.env');

  // Load environment variables (override=true to force reload)
  const result = dotenv.config({ path: envPath, override: true });

  if (result.error) {
    throw new Error(`Failed to load .env file: ${result.error.message}\n\nRun 'node scripts/setup-credentials.js' first to set up credentials.`);
  }

  // Extract encryption keys and encrypted data from parsed result (not process.env)
  const parsed = result.parsed || {};
  const encryptionKey = parsed.ENCRYPTION_KEY;
  const encryptionIV = parsed.ENCRYPTION_IV;
  const encryptedCredentials = parsed.ENCRYPTED_CREDENTIALS;

  if (!encryptionKey || !encryptionIV || !encryptedCredentials) {
    throw new Error('Missing encryption keys or encrypted credentials in .env file.\n\nRun \'node scripts/setup-credentials.js\' to set up credentials.');
  }

  // Decrypt credentials
  try {
    const credentials = decryptCredentials(encryptedCredentials, encryptionKey, encryptionIV);
    return credentials;
  } catch (error) {
    throw new Error(`Failed to decrypt credentials: ${error.message}\n\nCredentials may be corrupted. Run \'node scripts/setup-credentials.js\' to re-create.`);
  }
}

/**
 * Check if credentials are configured
 * @returns {boolean} True if .env exists and contains credentials
 */
export function hasCredentials() {
  try {
    loadCredentials();
    return true;
  } catch (error) {
    return false;
  }
}
