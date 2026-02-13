// Workaround for Jest toContain + expect.stringContaining issue with ES modules
// Override toContain to handle string matchers properly

import { expect, jest } from '@jest/globals';

expect.extend({
  toContain(received, expected) {
    // If expected is an asymmetric matcher (like expect.stringContaining())
    if (expected && typeof expected.asymmetricMatch === 'function') {
      // Check if any element in the array matches the asymmetric matcher
      if (Array.isArray(received)) {
        const hasMatch = received.some(item => expected.asymmetricMatch(item));
        return {
          message: () =>
            hasMatch
              ? `expected array not to contain element matching ${this.utils.printExpected(expected)}`
              : `expected array to contain element matching ${this.utils.printExpected(expected)}`,
          pass: hasMatch,
        };
      }
    }

    // Fall back to default toContain behavior
    // Check if array/string/iterable contains the expected value
    if (Array.isArray(received) || typeof received === 'string') {
      const pass = received.includes(expected);
      return {
        message: () =>
          pass
            ? `expected ${this.utils.printReceived(received)} not to contain ${this.utils.printExpected(expected)}`
            : `expected ${this.utils.printReceived(received)} to contain ${this.utils.printExpected(expected)}`,
        pass: pass,
      };
    }

    return {
      message: () => `expected value to be an array or string`,
      pass: false,
    };
  },
});
