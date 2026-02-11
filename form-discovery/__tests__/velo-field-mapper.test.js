import { describe, it, expect } from '@jest/globals';
import { mapWixToGabinete } from '../utils/velo-field-mapper.js';

describe('Velo Field Mapper (F4-T5)', () => {
  it('should export mapWixToGabinete function', () => {
    expect(mapWixToGabinete).toBeDefined();
    expect(typeof mapWixToGabinete).toBe('function');
  });

  describe('Name concatenation (nomeCompleto + sobrenome → nome)', () => {
    it('should concatenate nomeCompleto + sobrenome when both provided', () => {
      const wixData = {
        nomeCompleto: 'João',
        sobrenome: 'Silva',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10'
      };

      const result = mapWixToGabinete(wixData);

      expect(result.nome).toBe('João Silva');
    });

    it('should use nomeCompleto alone when sobrenome is missing', () => {
      const wixData = {
        nomeCompleto: 'João',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10'
      };

      const result = mapWixToGabinete(wixData);

      expect(result.nome).toBe('João');
    });

    it('should use nomeCompleto alone when sobrenome is empty string', () => {
      const wixData = {
        nomeCompleto: 'João',
        sobrenome: '',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10'
      };

      const result = mapWixToGabinete(wixData);

      expect(result.nome).toBe('João');
    });

    it('should use nomeCompleto alone when sobrenome is whitespace only', () => {
      const wixData = {
        nomeCompleto: 'João',
        sobrenome: '   ',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10'
      };

      const result = mapWixToGabinete(wixData);

      expect(result.nome).toBe('João');
    });

    it('should trim spaces when concatenating names', () => {
      const wixData = {
        nomeCompleto: '  João  ',
        sobrenome: '  Silva  ',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10'
      };

      const result = mapWixToGabinete(wixData);

      expect(result.nome).toBe('João Silva');
    });

    it('should truncate concatenated name to 200 chars if needed', () => {
      const wixData = {
        nomeCompleto: 'A'.repeat(150),
        sobrenome: 'B'.repeat(100),
        apelido: 'Test',
        celular: '(21)98765-4321',
        email: 'test@test.com',
        bairro: '10'
      };

      const result = mapWixToGabinete(wixData);

      // 150 + 1 (space) + 100 = 251, should be truncated to 200
      expect(result.nome).toHaveLength(200);
    });
  });

  describe('ALL gabineteonline fields mapping', () => {
    it('should map ALL required fields correctly', () => {
      const wixData = {
        nomeCompleto: 'João',
        sobrenome: 'Silva',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10'
      };

      const result = mapWixToGabinete(wixData);

      expect(result).toHaveProperty('nome', 'João Silva');
      expect(result).toHaveProperty('apelido', 'Joãozinho');
      expect(result).toHaveProperty('celular', '(21)98765-4321');
      expect(result).toHaveProperty('email', 'joao@test.com');
      expect(result).toHaveProperty('id_bairro', '10');
    });

    it('should map ALL optional fields when provided', () => {
      const wixData = {
        nomeCompleto: 'João',
        sobrenome: 'Silva',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10',
        cpf: '123.456.789-00',
        sexo: '1',
        dataNascimento: '01/01/1990',
        telefone: '(21)3456-7890',
        cep: '12345-678',
        endereco: 'Rua Exemplo',
        numero: '123',
        complemento: 'Apto 45',
        uf: 'RJ',
        observacao: 'Observação teste',
        titulo: '1234567890',
        sessao: '0001'
      };

      const result = mapWixToGabinete(wixData);

      // Required fields
      expect(result.nome).toBe('João Silva');
      expect(result.apelido).toBe('Joãozinho');
      expect(result.celular).toBe('(21)98765-4321');
      expect(result.email).toBe('joao@test.com');
      expect(result.id_bairro).toBe('10');

      // Optional fields
      expect(result.cpf).toBe('123.456.789-00');
      expect(result.sexo).toBe('1');
      expect(result.datanascimento).toBe('01/01/1990');
      expect(result.telefone).toBe('(21)3456-7890');
      expect(result.cep).toBe('12345-678');
      expect(result.endereco).toBe('Rua Exemplo');
      expect(result.numero).toBe('123');
      expect(result.complemento).toBe('Apto 45');
      expect(result.uf).toBe('RJ');
      expect(result.observacao).toBe('Observação teste');
      expect(result.titulo).toBe('1234567890');
      expect(result.sessao).toBe('0001');
    });

    it('should exclude empty/null optional fields from output', () => {
      const wixData = {
        nomeCompleto: 'João Silva',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10',
        cpf: '',
        sexo: null,
        dataNascimento: undefined,
        telefone: '   ',
        observacao: null
      };

      const result = mapWixToGabinete(wixData);

      // Required fields should be present
      expect(result.nome).toBe('João Silva');
      expect(result.apelido).toBe('Joãozinho');
      expect(result.celular).toBe('(21)98765-4321');
      expect(result.email).toBe('joao@test.com');
      expect(result.id_bairro).toBe('10');

      // Empty optional fields should NOT be in output
      expect(result).not.toHaveProperty('cpf');
      expect(result).not.toHaveProperty('sexo');
      expect(result).not.toHaveProperty('datanascimento');
      expect(result).not.toHaveProperty('telefone');
      expect(result).not.toHaveProperty('observacao');
    });
  });

  describe('Field validation', () => {
    it('should throw error if nomeCompleto is missing', () => {
      const wixData = {
        apelido: 'Test',
        celular: '(21)98765-4321',
        email: 'test@test.com',
        bairro: '10'
      };

      expect(() => mapWixToGabinete(wixData)).toThrow('Required field');
      expect(() => mapWixToGabinete(wixData)).toThrow('nome');
    });

    it('should throw error if apelido is missing', () => {
      const wixData = {
        nomeCompleto: 'João Silva',
        celular: '(21)98765-4321',
        email: 'test@test.com',
        bairro: '10'
      };

      expect(() => mapWixToGabinete(wixData)).toThrow('Required field');
      expect(() => mapWixToGabinete(wixData)).toThrow('apelido');
    });

    it('should throw error if celular is missing', () => {
      const wixData = {
        nomeCompleto: 'João Silva',
        apelido: 'Joãozinho',
        email: 'test@test.com',
        bairro: '10'
      };

      expect(() => mapWixToGabinete(wixData)).toThrow('Required field');
      expect(() => mapWixToGabinete(wixData)).toThrow('celular');
    });

    it('should throw error if email is missing', () => {
      const wixData = {
        nomeCompleto: 'João Silva',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        bairro: '10'
      };

      expect(() => mapWixToGabinete(wixData)).toThrow('Required field');
      expect(() => mapWixToGabinete(wixData)).toThrow('email');
    });

    it('should throw error if bairro is missing', () => {
      const wixData = {
        nomeCompleto: 'João Silva',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'test@test.com'
      };

      expect(() => mapWixToGabinete(wixData)).toThrow('Required field');
      expect(() => mapWixToGabinete(wixData)).toThrow('id_bairro');
    });
  });

  describe('Max length truncation', () => {
    it('should truncate all fields to max lengths', () => {
      const wixData = {
        nomeCompleto: 'A'.repeat(150),
        sobrenome: 'B'.repeat(100),  // 251 total → 200
        apelido: 'C'.repeat(50),     // Max 30
        celular: '1'.repeat(20),     // Max 14
        email: 'x'.repeat(6000),     // Max 5000
        bairro: '10',
        cpf: '2'.repeat(20),         // Max 14
        dataNascimento: '3'.repeat(15), // Max 10
        telefone: '4'.repeat(20),    // Max 13
        cep: '5'.repeat(15),         // Max 9
        endereco: 'D'.repeat(300),   // Max 200
        numero: 'E'.repeat(150),     // Max 100
        complemento: 'F'.repeat(250), // Max 200
        observacao: 'G'.repeat(600), // Max 500
        titulo: 'H'.repeat(60),      // Max 50
        sessao: 'I'.repeat(40)       // Max 30
      };

      const result = mapWixToGabinete(wixData);

      expect(result.nome).toHaveLength(200);
      expect(result.apelido).toHaveLength(30);
      expect(result.celular).toHaveLength(14);
      expect(result.email).toHaveLength(5000);
      expect(result.cpf).toHaveLength(14);
      expect(result.datanascimento).toHaveLength(10);
      expect(result.telefone).toHaveLength(13);
      expect(result.cep).toHaveLength(9);
      expect(result.endereco).toHaveLength(200);
      expect(result.numero).toHaveLength(100);
      expect(result.complemento).toHaveLength(200);
      expect(result.observacao).toHaveLength(500);
      expect(result.titulo).toHaveLength(50);
      expect(result.sessao).toHaveLength(30);
    });
  });

  describe('Field mapping compatibility with Wix form fields', () => {
    it('should ignore unknown Wix fields not in schema', () => {
      const wixData = {
        nomeCompleto: 'João Silva',
        apelido: 'Joãozinho',
        celular: '(21)98765-4321',
        email: 'joao@test.com',
        bairro: '10',
        unknownField: 'should be ignored',
        anotherUnknown: 'also ignored'
      };

      const result = mapWixToGabinete(wixData);

      expect(result).not.toHaveProperty('unknownField');
      expect(result).not.toHaveProperty('anotherUnknown');

      // Should have only valid mapped fields
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['nome', 'apelido', 'celular', 'email', 'id_bairro'])
      );
    });
  });
});
