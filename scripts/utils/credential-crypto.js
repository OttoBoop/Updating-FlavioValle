import crypto from 'crypto';

/**
 * Generate encryption keys for AES-256 encryption
 * @returns {{encryptionKey: string, encryptionIV: string}}
 */
export function generateEncryptionKeys() {
  const encryptionKey = crypto.randomBytes(32).toString('hex'); // 256 bits
  const encryptionIV = crypto.randomBytes(16).toString('hex');  // 128 bits (AES block size)

  return {
    encryptionKey,
    encryptionIV
  };
}

/**
 * Encrypt credentials using AES-256-CBC
 * @param {Object} credentials - The credentials object to encrypt
 * @param {string} encryptionKey - Hex-encoded 32-byte encryption key
 * @param {string} encryptionIV - Hex-encoded 16-byte initialization vector
 * @returns {string} Hex-encoded encrypted data
 */
export function encryptCredentials(credentials, encryptionKey, encryptionIV) {
  // Validate credentials object
  if (!credentials || typeof credentials !== 'object') {
    throw new Error('Credentials must be a valid object');
  }

  // Check for required fields
  const requiredFields = ['wixEmail', 'wixPassword', 'gabineteUsername', 'gabinetePassword'];
  const missingFields = requiredFields.filter(field => !credentials[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Convert hex strings to buffers
  const key = Buffer.from(encryptionKey, 'hex');
  const iv = Buffer.from(encryptionIV, 'hex');

  // Create cipher
  const algorithm = 'aes-256-cbc';
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Encrypt the credentials JSON
  const credentialsJSON = JSON.stringify(credentials);
  let encrypted = cipher.update(credentialsJSON, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

/**
 * Decrypt credentials encrypted with AES-256-CBC
 * @param {string} encryptedData - Hex-encoded encrypted data
 * @param {string} encryptionKey - Hex-encoded 32-byte encryption key
 * @param {string} encryptionIV - Hex-encoded 16-byte initialization vector
 * @returns {Object} Decrypted credentials object
 */
export function decryptCredentials(encryptedData, encryptionKey, encryptionIV) {
  try {
    // Convert hex strings to buffers
    const key = Buffer.from(encryptionKey, 'hex');
    const iv = Buffer.from(encryptionIV, 'hex');

    // Create decipher
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse JSON and return
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}
