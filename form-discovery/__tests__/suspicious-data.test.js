import { describe, it, expect } from '@jest/globals';
import { detectSuspicious, validateCPF } from '../utils/suspicious-data.js';

describe('suspicious-data', () => {
  describe('detectSuspicious', () => {
    describe('suspicious phone patterns', () => {
      it('should flag all-same-digit phone numbers as suspicious', () => {
        const result = detectSuspicious({ celular: '11111111111' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.data).toEqual({ celular: '11111111111' });
      });

      it('should flag all-zeros phone number as suspicious', () => {
        const result = detectSuspicious({ celular: '00000000000' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.data).toEqual({ celular: '00000000000' });
      });

      it('should flag sequential digit phone numbers as suspicious', () => {
        const result = detectSuspicious({ celular: '12345678901' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.data).toEqual({ celular: '12345678901' });
      });

      it('should flag all-nines phone number as suspicious', () => {
        const result = detectSuspicious({ celular: '99999999999' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.data).toEqual({ celular: '99999999999' });
      });

      it('should flag all-twos phone number as suspicious', () => {
        const result = detectSuspicious({ celular: '22222222222' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.data).toEqual({ celular: '22222222222' });
      });
    });

    describe('suspicious email patterns', () => {
      it('should flag teste@teste.com as suspicious', () => {
        const result = detectSuspicious({ email: 'teste@teste.com' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('email'));
        expect(result.data).toEqual({ email: 'teste@teste.com' });
      });

      it('should flag test@test.com as suspicious', () => {
        const result = detectSuspicious({ email: 'test@test.com' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('email'));
        expect(result.data).toEqual({ email: 'test@test.com' });
      });

      it('should flag aaa@aaa.com as suspicious', () => {
        const result = detectSuspicious({ email: 'aaa@aaa.com' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('email'));
        expect(result.data).toEqual({ email: 'aaa@aaa.com' });
      });

      it('should flag asdf@asdf.com as suspicious (keyboard pattern)', () => {
        const result = detectSuspicious({ email: 'asdf@asdf.com' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('email'));
        expect(result.data).toEqual({ email: 'asdf@asdf.com' });
      });

      it('should flag qwerty@qwerty.com as suspicious (keyboard pattern)', () => {
        const result = detectSuspicious({ email: 'qwerty@qwerty.com' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('email'));
        expect(result.data).toEqual({ email: 'qwerty@qwerty.com' });
      });
    });

    describe('suspicious name patterns', () => {
      it('should flag "Teste" as suspicious', () => {
        const result = detectSuspicious({ nome: 'Teste' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.data).toEqual({ nome: 'Teste' });
      });

      it('should flag "aaa" as suspicious', () => {
        const result = detectSuspicious({ nome: 'aaa' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.data).toEqual({ nome: 'aaa' });
      });

      it('should flag "xxx" as suspicious', () => {
        const result = detectSuspicious({ nome: 'xxx' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.data).toEqual({ nome: 'xxx' });
      });

      it('should flag "asdf" as suspicious (keyboard mash)', () => {
        const result = detectSuspicious({ nome: 'asdf' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.data).toEqual({ nome: 'asdf' });
      });

      it('should flag "test" as suspicious', () => {
        const result = detectSuspicious({ nome: 'test' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.data).toEqual({ nome: 'test' });
      });

      it('should flag "qwerty" as suspicious (keyboard pattern)', () => {
        const result = detectSuspicious({ nome: 'qwerty' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.data).toEqual({ nome: 'qwerty' });
      });
    });

    describe('suspicious CPF patterns', () => {
      it('should flag all-zeros CPF as suspicious', () => {
        const result = detectSuspicious({ cpf: '00000000000' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('cpf'));
        expect(result.data).toEqual({ cpf: '00000000000' });
      });

      it('should flag all-ones CPF as suspicious', () => {
        const result = detectSuspicious({ cpf: '11111111111' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('cpf'));
        expect(result.data).toEqual({ cpf: '11111111111' });
      });

      it('should flag all same-digit CPFs (0-9)', () => {
        for (let d = 0; d <= 9; d++) {
          const cpf = String(d).repeat(11);
          const result = detectSuspicious({ cpf });
          expect(result.suspicious).toBe(true);
        }
      });

      it('should flag CPF with invalid check digits', () => {
        // 123.456.789-01 has wrong check digits (correct would be -09)
        const result = detectSuspicious({ cpf: '12345678901' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('cpf'));
      });

      it('should flag CPF with wrong length', () => {
        const result = detectSuspicious({ cpf: '1234567' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('cpf'));
      });

      it('should accept valid CPF 529.982.247-25', () => {
        const result = detectSuspicious({ cpf: '52998224725' });
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
      });

      it('should accept valid CPF with formatting (dots and dash)', () => {
        const result = detectSuspicious({ cpf: '529.982.247-25' });
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
      });

      it('should accept valid CPF 347.066.120-98', () => {
        const result = detectSuspicious({ cpf: '34706612098' });
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
      });
    });

    describe('valid/normal data', () => {
      it('should pass normal data with real name, phone, and email', () => {
        const data = {
          nome: 'Maria Silva',
          celular: '11987654321',
          email: 'maria@gmail.com'
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toEqual(data);
      });

      it('should pass normal data with different real name, phone, and email', () => {
        const data = {
          nome: 'João Santos',
          celular: '21976543210',
          email: 'joao@hotmail.com'
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toEqual(data);
      });

      it('should pass normal data with compound name', () => {
        const data = {
          nome: 'Ana Paula Ferreira',
          celular: '85912345678',
          email: 'ana.paula@outlook.com'
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toEqual(data);
      });

      it('should pass valid CPF with real check digits', () => {
        const data = {
          cpf: '52998224725'
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toEqual(data);
      });
    });

    describe('multiple suspicious fields', () => {
      it('should return all reasons when multiple fields are suspicious', () => {
        const data = {
          nome: 'Teste',
          celular: '11111111111',
          email: 'teste@teste.com'
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toHaveLength(3);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.reasons).toContain(expect.stringContaining('email'));
        expect(result.data).toEqual(data);
      });

      it('should detect suspicious CPF and phone together', () => {
        const data = {
          cpf: '00000000000',
          celular: '99999999999'
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toHaveLength(2);
        expect(result.reasons).toContain(expect.stringContaining('cpf'));
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.data).toEqual(data);
      });

      it('should detect all four suspicious fields', () => {
        const data = {
          nome: 'xxx',
          celular: '00000000000',
          email: 'test@test.com',
          cpf: '11111111111'
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toHaveLength(4);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.reasons).toContain(expect.stringContaining('email'));
        expect(result.reasons).toContain(expect.stringContaining('cpf'));
        expect(result.data).toEqual(data);
      });
    });

    describe('edge cases - missing/partial data', () => {
      it('should handle data with only name (not suspicious)', () => {
        const data = { nome: 'Maria' };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toEqual(data);
      });

      it('should handle empty object (not suspicious)', () => {
        const data = {};
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toEqual(data);
      });

      it('should handle null input gracefully', () => {
        const result = detectSuspicious(null);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toBe(null);
      });

      it('should handle undefined input gracefully', () => {
        const result = detectSuspicious(undefined);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toBeUndefined();
      });

      it('should ignore empty string fields', () => {
        const data = {
          nome: '',
          celular: '',
          email: ''
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(false);
        expect(result.reasons).toEqual([]);
        expect(result.data).toEqual(data);
      });

      it('should detect suspicious in mixed empty and valid fields', () => {
        const data = {
          nome: 'João Silva',
          celular: '11111111111',
          email: ''
        };
        const result = detectSuspicious(data);
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toHaveLength(1);
        expect(result.reasons).toContain(expect.stringContaining('celular'));
        expect(result.data).toEqual(data);
      });
    });

    describe('case insensitivity', () => {
      it('should flag "TESTE" (uppercase) as suspicious', () => {
        const result = detectSuspicious({ nome: 'TESTE' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
      });

      it('should flag "Test" (mixed case) as suspicious', () => {
        const result = detectSuspicious({ nome: 'Test' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('nome'));
      });

      it('should flag "TESTE@TESTE.COM" (uppercase) as suspicious', () => {
        const result = detectSuspicious({ email: 'TESTE@TESTE.COM' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('email'));
      });

      it('should flag "Test@Test.COM" (mixed case) as suspicious', () => {
        const result = detectSuspicious({ email: 'Test@Test.COM' });
        expect(result.suspicious).toBe(true);
        expect(result.reasons).toContain(expect.stringContaining('email'));
      });
    });
  });

  describe('validateCPF', () => {
    it('should return true for valid CPF 529.982.247-25', () => {
      expect(validateCPF('52998224725')).toBe(true);
    });

    it('should return true for valid CPF with formatting', () => {
      expect(validateCPF('529.982.247-25')).toBe(true);
    });

    it('should return true for valid CPF 347.066.120-98', () => {
      expect(validateCPF('34706612098')).toBe(true);
    });

    it('should return false for all-same-digit CPFs (0 through 9)', () => {
      for (let d = 0; d <= 9; d++) {
        expect(validateCPF(String(d).repeat(11))).toBe(false);
      }
    });

    it('should return false for CPF with wrong check digits', () => {
      // 123.456.789-01 — correct check digits are -09
      expect(validateCPF('12345678901')).toBe(false);
    });

    it('should return false for CPF with wrong length', () => {
      expect(validateCPF('1234567')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateCPF('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(validateCPF(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validateCPF(undefined)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(validateCPF(12345678901)).toBe(false);
    });
  });
});
