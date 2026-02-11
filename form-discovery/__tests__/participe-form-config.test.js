/**
 * F5-T1: /participe Form Configuration Tests
 *
 * Tests for the form configuration module that defines:
 * - All form fields with metadata (label, type, validation, visibility)
 * - Mapping between Wix form fields and gabineteonline fields
 * - Required vs optional field groups
 * - Form data transformation utilities
 */

import { expect, describe, it } from '@jest/globals';
import {
  getFormConfig,
  getRequiredFields,
  getOptionalFields,
  getFieldByWixName,
  getVisibleFields,
  mapFormDataToRegistros,
} from '../utils/participe-form-config.js';

describe('Form Configuration Structure', () => {
  it('should return object with formId and fields array', () => {
    const config = getFormConfig();

    expect(config).toBeDefined();
    expect(config.formId).toBeDefined();
    expect(Array.isArray(config.fields)).toBe(true);
  });

  it('should have exactly 17 form fields (5 required + 12 optional)', () => {
    const config = getFormConfig();

    expect(config.fields.length).toBe(17);
  });

  it('should have all required fields with required: true and visible: true', () => {
    const config = getFormConfig();
    const requiredFields = config.fields.filter(f => f.required === true);

    expect(requiredFields.length).toBe(5);
    requiredFields.forEach(field => {
      expect(field.visible).toBe(true);
    });
  });

  it('should have all optional fields with required: false and visible: false', () => {
    const config = getFormConfig();
    const optionalFields = config.fields.filter(f => f.required === false);

    expect(optionalFields.length).toBe(12);
    optionalFields.forEach(field => {
      expect(field.visible).toBe(false);
    });
  });

  it('should have "Nome Completo" field with correct label and gabineteField "nome"', () => {
    const config = getFormConfig();
    const nomeCompleto = config.fields.find(f => f.wixField === 'nomeCompleto');

    expect(nomeCompleto).toBeDefined();
    expect(nomeCompleto.label).toBe('Nome Completo');
    expect(nomeCompleto.gabineteField).toBe('nome');
    expect(nomeCompleto.required).toBe(true);
    expect(nomeCompleto.visible).toBe(true);
  });

  it('should have "Como gostaria de ser chamado?" field (apelido) as required', () => {
    const config = getFormConfig();
    const apelido = config.fields.find(f => f.wixField === 'apelido');

    expect(apelido).toBeDefined();
    expect(apelido.label).toBe('Como gostaria de ser chamado?');
    expect(apelido.gabineteField).toBe('apelido');
    expect(apelido.required).toBe(true);
    expect(apelido.visible).toBe(true);
  });

  it('should have all required properties on each field', () => {
    const config = getFormConfig();

    config.fields.forEach(field => {
      expect(field.wixField).toBeDefined();
      expect(field.label).toBeDefined();
      expect(field.type).toBeDefined();
      expect(field.required).toBeDefined();
      expect(field.visible).toBeDefined();
      expect(field.gabineteField).toBeDefined();
    });
  });
});

describe('Field Group Accessors', () => {
  it('should return exactly 5 required fields', () => {
    const requiredFields = getRequiredFields();

    expect(requiredFields.length).toBe(5);
    requiredFields.forEach(field => {
      expect(field.required).toBe(true);
      expect(field.visible).toBe(true);
    });
  });

  it('should return exactly 12 optional fields', () => {
    const optionalFields = getOptionalFields();

    expect(optionalFields.length).toBe(12);
    optionalFields.forEach(field => {
      expect(field.required).toBe(false);
      expect(field.visible).toBe(false);
    });
  });
});

describe('Field Lookup', () => {
  it('should return celular field config by name', () => {
    const celular = getFieldByWixName('celular');

    expect(celular).toBeDefined();
    expect(celular.wixField).toBe('celular');
    expect(celular.gabineteField).toBe('celular');
  });

  it('should return null/undefined for nonexistent field', () => {
    const nonexistent = getFieldByWixName('nonexistent');

    expect(nonexistent).toBeUndefined();
  });
});

describe('Visible Fields with Overrides', () => {
  it('should return only required fields with no overrides', () => {
    const visibleFields = getVisibleFields();

    expect(visibleFields.length).toBe(5);
    visibleFields.forEach(field => {
      expect(field.required).toBe(true);
    });
  });

  it('should include cpf in visible fields when overridden', () => {
    const visibleFields = getVisibleFields({ cpf: true });

    const cpfField = visibleFields.find(f => f.wixField === 'cpf');
    expect(cpfField).toBeDefined();
    expect(visibleFields.length).toBe(6); // 5 required + 1 optional
  });

  it('should include both cpf and sexo when both overridden', () => {
    const visibleFields = getVisibleFields({ cpf: true, sexo: true });

    const cpfField = visibleFields.find(f => f.wixField === 'cpf');
    const sexoField = visibleFields.find(f => f.wixField === 'sexo');

    expect(cpfField).toBeDefined();
    expect(sexoField).toBeDefined();
    expect(visibleFields.length).toBe(7); // 5 required + 2 optional
  });
});

describe('Form Data Transformation', () => {
  it('should map "nome" to "nomeCompleto"', () => {
    const formData = {
      nome: 'João Silva',
      apelido: 'Joãozinho',
      phone: '21987654321',
      email: 'joao@example.com',
      collection_comp_m6z7d0i3: 'Copacabana',
    };

    const registros = mapFormDataToRegistros(formData);

    expect(registros.nomeCompleto).toBe('João Silva');
    expect(registros.nome).toBeUndefined();
  });

  it('should map "phone" to "celular"', () => {
    const formData = {
      nome: 'João Silva',
      apelido: 'Joãozinho',
      phone: '21987654321',
      email: 'joao@example.com',
      collection_comp_m6z7d0i3: 'Copacabana',
    };

    const registros = mapFormDataToRegistros(formData);

    expect(registros.celular).toBe('21987654321');
    expect(registros.phone).toBeUndefined();
  });

  it('should map "collection_comp_m6z7d0i3" to "bairro"', () => {
    const formData = {
      nome: 'João Silva',
      apelido: 'Joãozinho',
      phone: '21987654321',
      email: 'joao@example.com',
      collection_comp_m6z7d0i3: 'Copacabana',
    };

    const registros = mapFormDataToRegistros(formData);

    expect(registros.bairro).toBe('Copacabana');
    expect(registros.collection_comp_m6z7d0i3).toBeUndefined();
  });

  it('should map "textarea_comp_m4wplove4" to "observacao"', () => {
    const formData = {
      nome: 'João Silva',
      apelido: 'Joãozinho',
      phone: '21987654321',
      email: 'joao@example.com',
      collection_comp_m6z7d0i3: 'Copacabana',
      textarea_comp_m4wplove4: 'Test observation',
    };

    const registros = mapFormDataToRegistros(formData);

    expect(registros.observacao).toBe('Test observation');
    expect(registros.textarea_comp_m4wplove4).toBeUndefined();
  });

  it('should pass through fields already using wixField names', () => {
    const formData = {
      nome: 'João Silva',
      apelido: 'Joãozinho',
      phone: '21987654321',
      email: 'joao@example.com',
      collection_comp_m6z7d0i3: 'Copacabana',
      cpf: '123.456.789-00',
      sexo: '1',
    };

    const registros = mapFormDataToRegistros(formData);

    expect(registros.cpf).toBe('123.456.789-00');
    expect(registros.sexo).toBe('1');
    expect(registros.email).toBe('joao@example.com');
    expect(registros.apelido).toBe('Joãozinho');
  });
});

describe('Form Metadata', () => {
  it('should include whatsappRedirect URL and submitButtonLabel', () => {
    const config = getFormConfig();

    expect(config.whatsappRedirect).toBeDefined();
    expect(typeof config.whatsappRedirect).toBe('string');
    expect(config.whatsappRedirect).toContain('wa.me');

    expect(config.submitButtonLabel).toBeDefined();
    expect(typeof config.submitButtonLabel).toBe('string');
  });
});
