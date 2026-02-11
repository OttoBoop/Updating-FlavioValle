/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { validateEmail, validateCredentials } from './credential-validator.js';

describe('Credential Validator', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('admin@gabineteonline.com.br')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no-at-sign.com')).toBe(false);
      expect(validateEmail('@no-local-part.com')).toBe(false);
      expect(validateEmail('no-domain@')).toBe(false);
      expect(validateEmail('spaces in@email.com')).toBe(false);
    });

    it('should reject empty or null email', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });

    it('should reject email without domain extension', () => {
      expect(validateEmail('user@domain')).toBe(false);
    });
  });

  describe('validateCredentials', () => {
    it('should validate complete credential object', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        wixPassword: 'password123',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'securepass456'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing wixEmail', () => {
      const credentials = {
        wixPassword: 'password123',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'securepass456'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('wixEmail is required');
    });

    it('should detect missing wixPassword', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'securepass456'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('wixPassword is required');
    });

    it('should detect missing gabineteUsername', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        wixPassword: 'password123',
        gabinetePassword: 'securepass456'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('gabineteUsername is required');
    });

    it('should detect missing gabinetePassword', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        wixPassword: 'password123',
        gabineteUsername: 'admin@gabineteonline.com'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('gabinetePassword is required');
    });

    it('should detect invalid email format for wixEmail', () => {
      const credentials = {
        wixEmail: 'invalid-email',
        wixPassword: 'password123',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'securepass456'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('wixEmail must be a valid email address');
    });

    it('should accept any string as gabineteUsername', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        wixPassword: 'password123',
        gabineteUsername: 'admin_user123',  // Username, not email
        gabinetePassword: 'securepass456'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect multiple validation errors', () => {
      const credentials = {
        wixEmail: 'invalid',  // Invalid email format
        wixPassword: '',      // Empty password
        gabineteUsername: '', // Empty username
        gabinetePassword: ''  // Empty password
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });

    it('should accept passwords with minimum length', () => {
      const credentials = {
        wixEmail: 'user@example.com',
        wixPassword: '123',
        gabineteUsername: 'admin@gabineteonline.com',
        gabinetePassword: 'abc'
      };

      const result = validateCredentials(credentials);

      expect(result.valid).toBe(true);
    });

    it('should reject null or undefined credentials', () => {
      expect(validateCredentials(null).valid).toBe(false);
      expect(validateCredentials(undefined).valid).toBe(false);
      expect(validateCredentials({}).valid).toBe(false);
    });
  });
});
