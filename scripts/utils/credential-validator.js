/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate credentials object
 * @param {Object} credentials - Credentials object to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateCredentials(credentials) {
  const errors = [];

  // Check if credentials object exists
  if (!credentials || typeof credentials !== 'object') {
    return {
      valid: false,
      errors: ['Credentials must be a valid object']
    };
  }

  // Check required fields
  const requiredFields = ['wixEmail', 'wixPassword', 'gabineteUsername', 'gabinetePassword'];

  for (const field of requiredFields) {
    if (!credentials[field] || credentials[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  }

  // Validate email format for Wix (only Wix uses email)
  if (credentials.wixEmail && !validateEmail(credentials.wixEmail)) {
    errors.push('wixEmail must be a valid email address');
  }

  // gabineteUsername is just a string, no specific format validation needed

  return {
    valid: errors.length === 0,
    errors
  };
}
