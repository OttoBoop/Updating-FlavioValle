import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

export function decryptCredentials() {
  const encryptedData = process.env.ENCRYPTED_CREDENTIALS;
  const key = process.env.ENCRYPTION_KEY;
  const iv = process.env.ENCRYPTION_IV;

  if (!key || !iv || !encryptedData) {
    throw new Error('Missing encryption credentials in .env file');
  }

  const algorithm = 'aes-256-cbc';
  const keyBuffer = Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  const credentials = JSON.parse(decrypted);

  return {
    wixEmail: credentials.wixEmail,
    wixPassword: credentials.wixPassword,
    gabineteUsername: credentials.gabineteUsername,
    gabinetePassword: credentials.gabinetePassword
  };
}
