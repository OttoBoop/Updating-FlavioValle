/**
 * F5-T3: Form Submission Handler Tests (RED Phase)
 *
 * Tests for the form submission handler that:
 * - Validates form data (required fields, email, phone, suspicious data)
 * - Maps raw form data to Registros schema
 * - Saves to Wix DB with syncStatus: "pending"
 * - Redirects to WhatsApp
 * - Returns error state with preserved form data on validation failure
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createWixDataMock, createWixLocationMock } from '../utils/wix-mocks.js';
import { validateEmail } from '../utils/email-validation.js';
import { getFormConfig, mapFormDataToRegistros, getRequiredFields } from '../utils/participe-form-config.js';

// Import the module under test (does not exist yet - tests should fail)
import {
  submitRegistration,
  validateFormData
} from '../utils/form-submission-handler.js';

// Valid form data fixture (use in tests)
const validFormData = {
  nomeCompleto: 'João da Silva',
  apelido: 'João',
  celular: '(21) 99999-8888',
  email: 'joao@example.com',
  bairro: 'Copacabana',
};

describe('Form Submission Handler - Validation', () => {
  describe('validateFormData', () => {
    it('should accept valid form data with all required fields', () => {
      const result = validateFormData(validFormData);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should accept valid form data with optional fields included', () => {
      const dataWithOptionals = {
        ...validFormData,
        cpf: '123.456.789-00',
        telefone: '(21) 2222-3333',
        observacao: 'Test observation',
      };

      const result = validateFormData(dataWithOptionals);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject submission when nomeCompleto is missing', () => {
      const invalidData = {
        apelido: 'João',
        celular: '(21) 99999-8888',
        email: 'joao@example.com',
        bairro: 'Copacabana',
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('nomeCompleto is required');
    });

    it('should reject submission when apelido is missing', () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        celular: '(21) 99999-8888',
        email: 'joao@example.com',
        bairro: 'Copacabana',
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('apelido is required');
    });

    it('should reject submission when celular is missing', () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        apelido: 'João',
        email: 'joao@example.com',
        bairro: 'Copacabana',
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('celular is required');
    });

    it('should reject submission when email is missing', () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        apelido: 'João',
        celular: '(21) 99999-8888',
        bairro: 'Copacabana',
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('email is required');
    });

    it('should reject submission when bairro is missing', () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        apelido: 'João',
        celular: '(21) 99999-8888',
        email: 'joao@example.com',
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('bairro is required');
    });

    it('should return ALL validation errors at once (not one at a time)', () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        // Missing: apelido, celular, email, bairro
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors).toContain('apelido is required');
      expect(result.errors).toContain('celular is required');
      expect(result.errors).toContain('email is required');
      expect(result.errors).toContain('bairro is required');
    });

    it('should reject when email is invalid format', () => {
      const invalidData = {
        ...validFormData,
        email: 'not-an-email',
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.some(err => err.includes('email'))).toBe(true);
    });

    it('should reject when phone/celular is invalid format', () => {
      const invalidData = {
        ...validFormData,
        celular: '123', // too short
      };

      const result = validateFormData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.some(err => err.includes('celular'))).toBe(true);
    });

    it('should detect suspicious data (CPF validation) but flag only, not block', () => {
      const suspiciousData = {
        ...validFormData,
        cpf: '111.111.111-11', // invalid CPF
      };

      const result = validateFormData(suspiciousData);

      // Should still be valid (suspicious data flags but doesn't block)
      expect(result.valid).toBe(true);
      // But should have a warning or flag
      expect(result.suspicious).toBe(true);
      expect(result.suspiciousReasons).toContain('cpf');
    });
  });
});

describe('Form Submission Handler - Submission', () => {
  let wixData;
  let wixLocation;

  beforeEach(() => {
    wixData = createWixDataMock();
    wixLocation = createWixLocationMock();
  });

  describe('submitRegistration', () => {
    it('should save valid form data to Wix DB', async () => {
      const result = await submitRegistration(validFormData, wixData, wixLocation);

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record._id).toBeDefined();
      expect(result.record.nomeCompleto).toBe('João da Silva');
      expect(result.record.apelido).toBe('João');
    });

    it('should save record with syncStatus: "pending"', async () => {
      const result = await submitRegistration(validFormData, wixData, wixLocation);

      expect(result.success).toBe(true);
      expect(result.record.syncStatus).toBe('pending');
    });

    it('should save record with syncAttempts: 0', async () => {
      const result = await submitRegistration(validFormData, wixData, wixLocation);

      expect(result.success).toBe(true);
      expect(result.record.syncAttempts).toBe(0);
    });

    it('should map form data to Registros schema before saving', async () => {
      const formDataWithOldKeys = {
        nome: 'João da Silva', // old key (should map to nomeCompleto)
        apelido: 'João',
        phone: '(21) 99999-8888', // old key (should map to celular)
        email: 'joao@example.com',
        bairro: 'Copacabana',
      };

      const result = await submitRegistration(formDataWithOldKeys, wixData, wixLocation);

      expect(result.success).toBe(true);
      expect(result.record.nomeCompleto).toBeDefined(); // mapped correctly
      expect(result.record.celular).toBeDefined(); // mapped correctly
    });

    it('should return the saved record with _id on success', async () => {
      const result = await submitRegistration(validFormData, wixData, wixLocation);

      expect(result.success).toBe(true);
      expect(result.record).toBeDefined();
      expect(result.record._id).toBeDefined();
      expect(typeof result.record._id).toBe('string');
    });

    it('should call wixLocation.to() with WhatsApp URL after successful save', async () => {
      await submitRegistration(validFormData, wixData, wixLocation);

      const navigations = wixLocation.getNavigations();
      expect(navigations.length).toBe(1);
      expect(navigations[0]).toBe('https://wa.me/5521978919938');
    });

    it('should NOT redirect on validation failure', async () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        // Missing required fields
      };

      await submitRegistration(invalidData, wixData, wixLocation);

      const navigations = wixLocation.getNavigations();
      expect(navigations.length).toBe(0);
    });

    it('should return { success: false } with errors on validation failure', async () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        // Missing required fields
      };

      const result = await submitRegistration(invalidData, wixData, wixLocation);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.record).toBeUndefined();
    });

    it('should return preserved formData in error response for retry', async () => {
      const invalidData = {
        nomeCompleto: 'João da Silva',
        apelido: 'João',
        // Missing required fields
      };

      const result = await submitRegistration(invalidData, wixData, wixLocation);

      expect(result.success).toBe(false);
      expect(result.formData).toBeDefined();
      expect(result.formData.nomeCompleto).toBe('João da Silva');
      expect(result.formData.apelido).toBe('João');
    });

    it('should return { success: false } when DB insert fails (throws)', async () => {
      // Mock wixData.insert to throw error
      wixData.insert = () => {
        throw new Error('Database connection failed');
      };

      const result = await submitRegistration(validFormData, wixData, wixLocation);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.some(err => err.includes('failed'))).toBe(true);
    });

    it('should NOT redirect when DB insert fails', async () => {
      // Mock wixData.insert to throw error
      wixData.insert = () => {
        throw new Error('Database connection failed');
      };

      await submitRegistration(validFormData, wixData, wixLocation);

      const navigations = wixLocation.getNavigations();
      expect(navigations.length).toBe(0);
    });
  });
});
