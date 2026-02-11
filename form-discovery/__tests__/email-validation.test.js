import { describe, it, expect } from '@jest/globals';
import { validateEmail } from '../utils/email-validation.js';

describe('Email Validation', () => {
  describe('validateEmail', () => {
    describe('Valid Email Addresses', () => {
      it('should accept basic valid email', () => {
        const result = validateEmail('user@example.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com');
        expect(result.error).toBeUndefined();
      });

      it('should accept email with uppercase letters and normalize to lowercase', () => {
        const result = validateEmail('USER@Example.COM');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com');
        expect(result.error).toBeUndefined();
      });

      it('should accept email with dot in local part', () => {
        const result = validateEmail('user.name@domain.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user.name@domain.com');
        expect(result.error).toBeUndefined();
      });

      it('should accept email with plus sign (plus addressing)', () => {
        const result = validateEmail('user+tag@domain.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user+tag@domain.com');
        expect(result.error).toBeUndefined();
      });

      it('should accept email with subdomain', () => {
        const result = validateEmail('user@sub.domain.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@sub.domain.com');
        expect(result.error).toBeUndefined();
      });

      it('should accept email with numbers in local part', () => {
        const result = validateEmail('user123@example.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user123@example.com');
        expect(result.error).toBeUndefined();
      });

      it('should accept email with hyphen in domain', () => {
        const result = validateEmail('user@my-domain.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@my-domain.com');
        expect(result.error).toBeUndefined();
      });
    });

    describe('Invalid Email Addresses', () => {
      it('should reject email without @ symbol', () => {
        const result = validateEmail('not-email');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with only domain (no local part)', () => {
        const result = validateEmail('@domain.com');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email without domain', () => {
        const result = validateEmail('user@');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with dot at start of domain', () => {
        const result = validateEmail('user@.com');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject empty string', () => {
        const result = validateEmail('');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject null value', () => {
        const result = validateEmail(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject undefined value', () => {
        const result = validateEmail(undefined);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with space in local part', () => {
        const result = validateEmail('user @domain.com');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with space in domain', () => {
        const result = validateEmail('user@domain .com');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with multiple @ symbols', () => {
        const result = validateEmail('user@@domain.com');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with consecutive dots in local part', () => {
        const result = validateEmail('user..name@domain.com');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with consecutive dots in domain', () => {
        const result = validateEmail('user@domain..com');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email without TLD', () => {
        const result = validateEmail('user@domain');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });

      it('should reject email with invalid TLD (too short)', () => {
        const result = validateEmail('user@domain.a');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.normalized).toBeUndefined();
      });
    });

    describe('Normalization', () => {
      it('should trim leading whitespace', () => {
        const result = validateEmail('  user@example.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com');
      });

      it('should trim trailing whitespace', () => {
        const result = validateEmail('user@example.com  ');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com');
      });

      it('should trim both leading and trailing whitespace', () => {
        const result = validateEmail('  user@example.com  ');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com');
      });

      it('should convert to lowercase', () => {
        const result = validateEmail('User@Example.COM');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com');
      });

      it('should both trim and convert to lowercase', () => {
        const result = validateEmail('  User@Example.COM  ');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com');
      });
    });

    describe('Disposable Email Detection (Optional)', () => {
      it('should flag disposable email providers', () => {
        const result = validateEmail('user@tempmail.com', { checkDisposable: true });
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@tempmail.com');
        expect(result.disposable).toBe(true);
      });

      it('should flag another disposable email provider', () => {
        const result = validateEmail('user@guerrillamail.com', { checkDisposable: true });
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@guerrillamail.com');
        expect(result.disposable).toBe(true);
      });

      it('should NOT flag legitimate email providers', () => {
        const result = validateEmail('user@gmail.com', { checkDisposable: true });
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@gmail.com');
        expect(result.disposable).toBe(false);
      });

      it('should NOT flag corporate email addresses', () => {
        const result = validateEmail('user@company.com.br', { checkDisposable: true });
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@company.com.br');
        expect(result.disposable).toBe(false);
      });

      it('should not check disposable by default', () => {
        const result = validateEmail('user@tempmail.com');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@tempmail.com');
        expect(result.disposable).toBeUndefined();
      });
    });

    describe('Brazilian Email Patterns', () => {
      it('should accept Brazilian TLDs (.br)', () => {
        const result = validateEmail('user@example.com.br');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@example.com.br');
      });

      it('should accept gov.br domains', () => {
        const result = validateEmail('user@governo.gov.br');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@governo.gov.br');
      });

      it('should accept edu.br domains', () => {
        const result = validateEmail('user@university.edu.br');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('user@university.edu.br');
      });

      it('should accept common Brazilian email providers', () => {
        const providers = ['user@uol.com.br', 'user@terra.com.br', 'user@bol.com.br'];

        providers.forEach(email => {
          const result = validateEmail(email);
          expect(result.valid).toBe(true);
          expect(result.normalized).toBe(email);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long but valid email', () => {
        const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.com';
        const result = validateEmail(longEmail);
        expect(result.valid).toBe(true);
      });

      it('should reject email with local part exceeding 64 characters', () => {
        const longEmail = 'a'.repeat(65) + '@example.com';
        const result = validateEmail(longEmail);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject email with domain exceeding 255 characters', () => {
        const longEmail = 'user@' + 'a'.repeat(250) + '.com';
        const result = validateEmail(longEmail);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should handle non-string input gracefully', () => {
        const result = validateEmail(12345);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should handle object input gracefully', () => {
        const result = validateEmail({ email: 'user@example.com' });
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should handle array input gracefully', () => {
        const result = validateEmail(['user@example.com']);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });
});
