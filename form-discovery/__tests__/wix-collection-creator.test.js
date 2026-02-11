import { describe, it, expect, beforeEach } from '@jest/globals';
import { createWixFetchMock } from '../utils/wix-mocks.js';

// This module does NOT exist yet - tests will fail on import
import { buildRegistrosSchema, createRegistrosCollection } from '../utils/wix-collection-creator.js';

describe('Wix Collection Creator - buildRegistrosSchema', () => {
  it('should return an object with id "Registros"', () => {
    const schema = buildRegistrosSchema();

    expect(schema).toBeDefined();
    expect(schema.id).toBe('Registros');
  });

  it('should contain all required constituent data fields with correct types', () => {
    const schema = buildRegistrosSchema();

    expect(schema.fields).toBeDefined();
    expect(Array.isArray(schema.fields)).toBe(true);

    const fieldNames = schema.fields.map(f => f.key);

    // Required fields from field-mapper.js
    expect(fieldNames).toContain('nome');
    expect(fieldNames).toContain('celular');
    expect(fieldNames).toContain('email');
    expect(fieldNames).toContain('cpf');
    expect(fieldNames).toContain('apelido');
    expect(fieldNames).toContain('sexo');
    expect(fieldNames).toContain('dataNascimento');
    expect(fieldNames).toContain('telefone');
    expect(fieldNames).toContain('cep');
    expect(fieldNames).toContain('endereco');
    expect(fieldNames).toContain('numero');
    expect(fieldNames).toContain('complemento');
    expect(fieldNames).toContain('uf');
    expect(fieldNames).toContain('cidade');
    expect(fieldNames).toContain('bairro');
  });

  it('should mark nome and celular as required fields', () => {
    const schema = buildRegistrosSchema();

    const nomeField = schema.fields.find(f => f.key === 'nome');
    const celularField = schema.fields.find(f => f.key === 'celular');

    expect(nomeField).toBeDefined();
    expect(nomeField.required).toBe(true);

    expect(celularField).toBeDefined();
    expect(celularField.required).toBe(true);
  });

  it('should have syncStatus, syncError, and gabineteId system fields', () => {
    const schema = buildRegistrosSchema();

    const fieldNames = schema.fields.map(f => f.key);

    expect(fieldNames).toContain('syncStatus');
    expect(fieldNames).toContain('syncError');
    expect(fieldNames).toContain('gabineteId');
  });

  it('should configure celular field with index for lookup', () => {
    const schema = buildRegistrosSchema();

    const celularField = schema.fields.find(f => f.key === 'celular');

    expect(celularField).toBeDefined();
    expect(celularField.indexed).toBe(true);
  });

  it('should have correct permissions structure', () => {
    const schema = buildRegistrosSchema();

    expect(schema.permissions).toBeDefined();
    expect(schema.permissions.insert).toBeDefined();
    expect(schema.permissions.read).toBeDefined();
    expect(schema.permissions.update).toBeDefined();
    expect(schema.permissions.delete).toBeDefined();
  });

  it('should allow site members to insert records', () => {
    const schema = buildRegistrosSchema();

    // Site members should be able to register themselves
    expect(schema.permissions.insert).toContain('site-member');
  });

  it('should allow admin to read, update, and delete records', () => {
    const schema = buildRegistrosSchema();

    // Admin should have full management access
    expect(schema.permissions.read).toContain('admin');
    expect(schema.permissions.update).toContain('admin');
    expect(schema.permissions.delete).toContain('admin');
  });

  it('should not allow site visitors to access records', () => {
    const schema = buildRegistrosSchema();

    // Site visitors should have no access (security requirement)
    expect(schema.permissions.read).not.toContain('anyone');
    expect(schema.permissions.insert).not.toContain('anyone');
    expect(schema.permissions.update).not.toContain('anyone');
    expect(schema.permissions.delete).not.toContain('anyone');
  });

  it('should define all fields as text type', () => {
    const schema = buildRegistrosSchema();

    // All fields should be text (Wix Data type)
    schema.fields.forEach(field => {
      expect(field.type).toBe('text');
    });
  });
});

describe('Wix Collection Creator - createRegistrosCollection', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = createWixFetchMock([
      {
        urlPattern: 'wixapis.com/wix-data/v2/collections',
        status: 200,
        body: {
          collection: {
            id: 'Registros',
            displayName: 'Registros',
            fields: []
          }
        }
      }
    ]);
  });

  it('should call the correct Wix REST API endpoint with POST method', async () => {
    const apiToken = 'test-token-12345';

    await createRegistrosCollection(apiToken, fetchMock.fetch);

    const calls = fetchMock.getCalls();

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://www.wixapis.com/wix-data/v2/collections');
    expect(calls[0].options.method).toBe('POST');
  });

  it('should send correct Authorization header with Bearer token', async () => {
    const apiToken = 'test-token-12345';

    await createRegistrosCollection(apiToken, fetchMock.fetch);

    const calls = fetchMock.getCalls();

    expect(calls[0].options.headers).toBeDefined();
    expect(calls[0].options.headers.Authorization).toBe('Bearer test-token-12345');
  });

  it('should send the schema from buildRegistrosSchema in the request body', async () => {
    const apiToken = 'test-token-12345';

    await createRegistrosCollection(apiToken, fetchMock.fetch);

    const calls = fetchMock.getCalls();

    expect(calls[0].options.body).toBeDefined();

    const bodyObject = JSON.parse(calls[0].options.body);

    expect(bodyObject.collection).toBeDefined();
    expect(bodyObject.collection.id).toBe('Registros');
    expect(bodyObject.collection.fields).toBeDefined();
    expect(Array.isArray(bodyObject.collection.fields)).toBe(true);
  });

  it('should return success result when API responds 200', async () => {
    const apiToken = 'test-token-12345';

    const result = await createRegistrosCollection(apiToken, fetchMock.fetch);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.collection).toBeDefined();
    expect(result.collection.id).toBe('Registros');
  });

  it('should return failure result when API responds with error', async () => {
    const errorFetchMock = createWixFetchMock([
      {
        urlPattern: 'wixapis.com/wix-data/v2/collections',
        status: 400,
        body: {
          message: 'Collection already exists'
        }
      }
    ]);

    const apiToken = 'test-token-12345';

    const result = await createRegistrosCollection(apiToken, errorFetchMock.fetch);

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should include Content-Type application/json header', async () => {
    const apiToken = 'test-token-12345';

    await createRegistrosCollection(apiToken, fetchMock.fetch);

    const calls = fetchMock.getCalls();

    expect(calls[0].options.headers['Content-Type']).toBe('application/json');
  });
});
