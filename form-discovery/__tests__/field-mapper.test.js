import { describe, it, expect } from '@jest/globals';
import { mapWixToGabinete } from '../utils/field-mapper.js';

describe('Field Mapper', () => {
  it('should export mapWixToGabinete function', () => {
    expect(mapWixToGabinete).toBeDefined();
    expect(typeof mapWixToGabinete).toBe('function');
  });

  it('should correctly map all Wix field names to gabineteonline names', () => {
    const wixData = {
      fullName: 'João Silva',
      nickname: 'Joãozinho',
      cpf: '123.456.789-00',
      gender: '1',
      voterTitle: '1234567890',
      voterSection: '0001',
      votingLocation: '10',
      birthDate: '01/01/1990',
      nationality: '1',
      profession: '5',
      phone: '(11)3456-7890',
      cellphone: '(11)98765-4321',
      email: 'joao@example.com',
      zipCode: '12345-678',
      address: 'Rua Exemplo',
      streetNumber: '123',
      addressComplement: 'Apto 45',
      state: 'SP',
      city: '100',
      neighborhood: '200',
      region: '300',
      notes: 'Observação teste',
      confidential: '1',
      category: '5',
      serviceType: '1',
      carrier: '2',
      hasWhatsApp: true,
      disability: '0'
    };

    const result = mapWixToGabinete(wixData);

    // Verify all fields are mapped correctly
    expect(result).toHaveProperty('nome', 'João Silva');
    expect(result).toHaveProperty('apelido', 'Joãozinho');
    expect(result).toHaveProperty('cpf', '123.456.789-00');
    expect(result).toHaveProperty('sexo', '1');
    expect(result).toHaveProperty('titulo', '1234567890');
    expect(result).toHaveProperty('sessao', '0001');
    expect(result).toHaveProperty('id_localvoto', '10');
    expect(result).toHaveProperty('datanascimento', '01/01/1990');
    expect(result).toHaveProperty('nacionalidade', '1');
    expect(result).toHaveProperty('profissao', '5');
    expect(result).toHaveProperty('telefone', '(11)3456-7890');
    expect(result).toHaveProperty('celular', '(11)98765-4321');
    expect(result).toHaveProperty('email', 'joao@example.com');
    expect(result).toHaveProperty('cep', '12345-678');
    expect(result).toHaveProperty('endereco', 'Rua Exemplo');
    expect(result).toHaveProperty('numero', '123');
    expect(result).toHaveProperty('complemento', 'Apto 45');
    expect(result).toHaveProperty('uf', 'SP');
    expect(result).toHaveProperty('id_cidade', '100');
    expect(result).toHaveProperty('id_bairro', '200');
    expect(result).toHaveProperty('id_regiao', '300');
    expect(result).toHaveProperty('observacao', 'Observação teste');
    expect(result).toHaveProperty('ddsigilo', '1');
    expect(result).toHaveProperty('id_categoria', '5');
    expect(result).toHaveProperty('atendimento', '1');
    expect(result).toHaveProperty('operadora', '2');
    expect(result).toHaveProperty('whatsapp', true);
    expect(result).toHaveProperty('portador', '0');
  });

  it('should ignore unknown Wix fields not in mapping', () => {
    const wixData = {
      fullName: 'João Silva',
      cellphone: '(11)98765-4321',
      unknownField1: 'should be ignored',
      unknownField2: 'also ignored'
    };

    const result = mapWixToGabinete(wixData);

    // Should have mapped fields
    expect(result).toHaveProperty('nome', 'João Silva');
    expect(result).toHaveProperty('celular', '(11)98765-4321');

    // Should NOT have unknown fields
    expect(result).not.toHaveProperty('unknownField1');
    expect(result).not.toHaveProperty('unknownField2');
  });

  it('should throw validation error if required field "nome" is missing', () => {
    const wixData = {
      // Missing fullName (maps to nome)
      cellphone: '(11)98765-4321'
    };

    expect(() => mapWixToGabinete(wixData)).toThrow('Required field');
    expect(() => mapWixToGabinete(wixData)).toThrow('nome');
  });

  it('should throw validation error if required field "celular" is missing', () => {
    const wixData = {
      fullName: 'João Silva'
      // Missing cellphone (maps to celular)
    };

    expect(() => mapWixToGabinete(wixData)).toThrow('Required field');
    expect(() => mapWixToGabinete(wixData)).toThrow('celular');
  });

  it('should exclude empty/null values for optional fields from output', () => {
    const wixData = {
      fullName: 'João Silva',
      cellphone: '(11)98765-4321',
      nickname: '',
      email: null,
      notes: undefined,
      addressComplement: '   ' // whitespace only
    };

    const result = mapWixToGabinete(wixData);

    // Required fields should be present
    expect(result).toHaveProperty('nome', 'João Silva');
    expect(result).toHaveProperty('celular', '(11)98765-4321');

    // Empty/null optional fields should NOT be in output
    expect(result).not.toHaveProperty('apelido');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('observacao');
    expect(result).not.toHaveProperty('complemento');
  });

  it('should truncate field values that exceed maxLength constraints', () => {
    const wixData = {
      fullName: 'A'.repeat(250), // Max 200
      nickname: 'B'.repeat(50),   // Max 30
      cellphone: '(11)98765-4321',
      cpf: '1'.repeat(20),         // Max 14
      voterTitle: '2'.repeat(60),  // Max 50
      voterSection: '3'.repeat(40), // Max 30
      phone: '4'.repeat(20),       // Max 13
      email: 'x'.repeat(6000),     // Max 5000
      zipCode: '5'.repeat(15),     // Max 9
      address: 'C'.repeat(300),    // Max 200
      streetNumber: 'D'.repeat(150), // Max 100
      addressComplement: 'E'.repeat(250), // Max 200
      notes: 'F'.repeat(600)       // Max 500
    };

    const result = mapWixToGabinete(wixData);

    // Verify truncation
    expect(result.nome).toHaveLength(200);
    expect(result.apelido).toHaveLength(30);
    expect(result.cpf).toHaveLength(14);
    expect(result.titulo).toHaveLength(50);
    expect(result.sessao).toHaveLength(30);
    expect(result.telefone).toHaveLength(13);
    expect(result.celular).toHaveLength(14);
    expect(result.email).toHaveLength(5000);
    expect(result.cep).toHaveLength(9);
    expect(result.endereco).toHaveLength(200);
    expect(result.numero).toHaveLength(100);
    expect(result.complemento).toHaveLength(200);
    expect(result.observacao).toHaveLength(500);
  });
});
