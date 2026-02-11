export function validateEmail(email, options = {}) {
  // Handle non-string input
  if (typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email must be a string'
    };
  }

  // Trim and lowercase
  const normalized = email.trim().toLowerCase();

  // Check for empty string
  if (normalized === '') {
    return {
      valid: false,
      error: 'Email cannot be empty'
    };
  }

  // Check for @ symbol
  if (!normalized.includes('@')) {
    return {
      valid: false,
      error: 'Email must contain @ symbol'
    };
  }

  // Check for multiple @ symbols
  if (normalized.split('@').length > 2) {
    return {
      valid: false,
      error: 'Email cannot contain multiple @ symbols'
    };
  }

  // Check for spaces
  if (normalized.includes(' ')) {
    return {
      valid: false,
      error: 'Email cannot contain spaces'
    };
  }

  const [localPart, domain] = normalized.split('@');

  // Check for empty local part
  if (!localPart) {
    return {
      valid: false,
      error: 'Email must have a local part before @'
    };
  }

  // Check for empty domain
  if (!domain) {
    return {
      valid: false,
      error: 'Email must have a domain after @'
    };
  }

  // Check for consecutive dots in local part
  if (localPart.includes('..')) {
    return {
      valid: false,
      error: 'Email cannot have consecutive dots in local part'
    };
  }

  // Check for consecutive dots in domain
  if (domain.includes('..')) {
    return {
      valid: false,
      error: 'Email cannot have consecutive dots in domain'
    };
  }

  // Check for leading dot in domain
  if (domain.startsWith('.')) {
    return {
      valid: false,
      error: 'Domain cannot start with a dot'
    };
  }

  // Check local part length (RFC 5321)
  if (localPart.length > 64) {
    return {
      valid: false,
      error: 'Local part cannot exceed 64 characters'
    };
  }

  // Check domain length (RFC 5321)
  if (domain.length > 253) {
    return {
      valid: false,
      error: 'Domain cannot exceed 253 characters'
    };
  }

  // Check for TLD
  if (!domain.includes('.')) {
    return {
      valid: false,
      error: 'Email must have a valid TLD'
    };
  }

  // Check TLD length (must be at least 2 characters)
  const tldParts = domain.split('.');
  const tld = tldParts[tldParts.length - 1];
  if (tld.length < 2) {
    return {
      valid: false,
      error: 'TLD must be at least 2 characters'
    };
  }

  // Build result
  const result = {
    valid: true,
    normalized
  };

  // Check for disposable email if requested
  if (options.checkDisposable) {
    const disposableDomains = [
      'tempmail.com',
      'guerrillamail.com',
      'throwaway.email',
      'mailinator.com',
      'yopmail.com'
    ];

    result.disposable = disposableDomains.includes(domain);
  }

  return result;
}
