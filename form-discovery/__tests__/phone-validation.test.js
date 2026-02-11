import { describe, it, expect } from '@jest/globals';
import { validatePhone, normalizePhone } from '../utils/phone-validation.js';

describe('phone-validation', () => {
  describe('validatePhone', () => {
    describe('valid Brazilian phones', () => {
      it('should accept mobile with parentheses and dash', () => {
        const result = validatePhone('(11)98765-4321');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('11987654321');
        expect(result.error).toBeUndefined();
      });

      it('should accept mobile with digits only', () => {
        const result = validatePhone('11987654321');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('11987654321');
        expect(result.error).toBeUndefined();
      });

      it('should accept mobile with country code and strip it', () => {
        const result = validatePhone('+5511987654321');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('11987654321');
        expect(result.error).toBeUndefined();
      });

      it('should accept landline with parentheses and dash', () => {
        const result = validatePhone('(21) 3456-7890');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('2134567890');
        expect(result.error).toBeUndefined();
      });

      it('should accept landline with digits only', () => {
        const result = validatePhone('21 34567890');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('2134567890');
        expect(result.error).toBeUndefined();
      });

      it('should accept landline with country code', () => {
        const result = validatePhone('+55 21 3456-7890');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('2134567890');
        expect(result.error).toBeUndefined();
      });

      it('should accept mobile with spaces', () => {
        const result = validatePhone('11 98765-4321');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('11987654321');
        expect(result.error).toBeUndefined();
      });
    });

    describe('invalid phones', () => {
      it('should reject phone that is too short', () => {
        const result = validatePhone('12345');
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it('should reject phone with non-numeric characters', () => {
        const result = validatePhone('abcdefghijk');
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it('should reject empty string', () => {
        const result = validatePhone('');
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it('should reject null input', () => {
        const result = validatePhone(null);
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it('should reject undefined input', () => {
        const result = validatePhone(undefined);
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it('should reject phone that is too long', () => {
        const result = validatePhone('123456789012345');
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeUndefined();
        expect(result.error).toBeDefined();
      });

      it('should reject phone with only special characters', () => {
        const result = validatePhone('()- +');
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeUndefined();
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('normalizePhone', () => {
    it('should strip parentheses and dashes', () => {
      const result = normalizePhone('(11)98765-4321');
      expect(result).toBe('11987654321');
    });

    it('should strip country code prefix', () => {
      const result = normalizePhone('+5511987654321');
      expect(result).toBe('11987654321');
    });

    it('should strip spaces', () => {
      const result = normalizePhone('11 98765-4321');
      expect(result).toBe('11987654321');
    });

    it('should strip all formatting from landline', () => {
      const result = normalizePhone('+55 (21) 3456-7890');
      expect(result).toBe('2134567890');
    });

    it('should return digits only from already normalized phone', () => {
      const result = normalizePhone('11987654321');
      expect(result).toBe('11987654321');
    });

    it('should handle empty string', () => {
      const result = normalizePhone('');
      expect(result).toBe('');
    });

    it('should handle string with no digits', () => {
      const result = normalizePhone('abc-def');
      expect(result).toBe('');
    });
  });
});
