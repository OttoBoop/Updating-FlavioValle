/**
 * Normalizes a Brazilian phone number to digits only
 * Strips +55, parentheses, dashes, and spaces
 * @param {string} phone - The phone number to normalize
 * @returns {string} - Digits only
 */
export function normalizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove +55, parentheses, dashes, and spaces, then keep only digits
  const cleaned = phone.replace(/\+55|\(|\)|-|\s/g, '');
  const digitsOnly = cleaned.replace(/\D/g, '');

  return digitsOnly;
}

/**
 * Validates a Brazilian phone number
 * @param {string} phone - The phone number to validate
 * @returns {{valid: boolean, normalized?: string, error?: string}}
 */
export function validatePhone(phone) {
  // Check if input is a string
  if (typeof phone !== 'string') {
    return {
      valid: false,
      error: 'Phone must be a string'
    };
  }

  // Check for empty string
  if (phone === '') {
    return {
      valid: false,
      error: 'Phone cannot be empty'
    };
  }

  // Normalize the phone
  const normalized = normalizePhone(phone);

  // Check if normalized has any digits
  if (normalized === '') {
    return {
      valid: false,
      error: 'Phone must contain digits'
    };
  }

  // Check digit count: 10 (landline) or 11 (mobile)
  const digitCount = normalized.length;

  if (digitCount === 10 || digitCount === 11) {
    return {
      valid: true,
      normalized: normalized
    };
  }

  return {
    valid: false,
    error: 'Invalid phone number length'
  };
}
