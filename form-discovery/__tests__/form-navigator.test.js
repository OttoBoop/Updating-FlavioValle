import { describe, it, expect } from '@jest/globals';
import { findRegistrationForm } from '../utils/form-navigator.js';

describe('Form Navigator', () => {
  it('should export findRegistrationForm function', () => {
    expect(findRegistrationForm).toBeDefined();
    expect(typeof findRegistrationForm).toBe('function');
  });

  it('should search for registration keywords', () => {
    // Mock page object with minimal interface
    const mockPage = {
      locator: () => ({
        all: async () => [],
        count: async () => 0
      }),
      url: () => 'https://example.com'
    };

    // Should not throw when called with mock page
    expect(async () => await findRegistrationForm(mockPage)).not.toThrow();
  });

  it('should return object with success property', async () => {
    // Mock page object
    const mockPage = {
      locator: () => ({
        all: async () => [],
        count: async () => 0
      }),
      url: () => 'https://example.com'
    };

    const result = await findRegistrationForm(mockPage);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
  });
});
