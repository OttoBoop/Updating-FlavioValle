/**
 * F3-T2: Registros DB Collection Operations Tests
 *
 * Tests for creating and managing the Registros collection with:
 * - Schema with ALL 22 fields (5 required + 12 optional + 5 system)
 * - CRUD operations
 * - syncStatus management
 * - Index on celular for phone lookups
 */

import { expect, describe, it, beforeEach } from '@jest/globals';
import { createWixDataMock } from '../utils/wix-mocks.js';
import {
  getRegistrosSchema,
  insertRegistration,
  queryByCelular,
  updateSyncStatus,
  incrementSyncAttempts,
} from '../utils/wix-db-operations.js';

describe('Registros DB Schema', () => {
  it('should define all 22 fields (5 required + 12 optional + 5 system)', () => {
    const schema = getRegistrosSchema();

    // Required fields (5)
    expect(schema.required).toContain('nomeCompleto');
    expect(schema.required).toContain('apelido');
    expect(schema.required).toContain('celular');
    expect(schema.required).toContain('email');
    expect(schema.required).toContain('bairro');
    expect(schema.required.length).toBe(5);

    // Optional fields (12)
    expect(schema.optional).toContain('cpf');
    expect(schema.optional).toContain('sexo');
    expect(schema.optional).toContain('dataNascimento');
    expect(schema.optional).toContain('telefone');
    expect(schema.optional).toContain('cep');
    expect(schema.optional).toContain('endereco');
    expect(schema.optional).toContain('numero');
    expect(schema.optional).toContain('complemento');
    expect(schema.optional).toContain('uf');
    expect(schema.optional).toContain('observacao');
    expect(schema.optional).toContain('titulo');
    expect(schema.optional).toContain('sessao');
    expect(schema.optional.length).toBe(12);

    // System fields (5)
    expect(schema.system).toContain('syncStatus');
    expect(schema.system).toContain('syncError');
    expect(schema.system).toContain('syncAttempts');
    expect(schema.system).toContain('gabineteId');
    expect(schema.system).toContain('lastSyncAt');
    expect(schema.system.length).toBe(5);

    // Total = 22 fields
    const allFields = [...schema.required, ...schema.optional, ...schema.system];
    expect(allFields.length).toBe(22);
  });

  it('should specify correct field types', () => {
    const schema = getRegistrosSchema();

    expect(schema.types.nomeCompleto).toBe('text');
    expect(schema.types.apelido).toBe('text');
    expect(schema.types.celular).toBe('text');
    expect(schema.types.email).toBe('text');
    expect(schema.types.bairro).toBe('text');
    expect(schema.types.cpf).toBe('text');
    expect(schema.types.sexo).toBe('text');
    expect(schema.types.dataNascimento).toBe('text');
    expect(schema.types.syncStatus).toBe('text');
    expect(schema.types.syncAttempts).toBe('number');
  });

  it('should specify indexes', () => {
    const schema = getRegistrosSchema();

    expect(schema.indexes).toContain('celular');
  });
});

describe('Insert Registration', () => {
  let wixData;

  beforeEach(() => {
    wixData = createWixDataMock();
  });

  it('should insert registration with syncStatus="pending" by default', async () => {
    const registration = {
      nomeCompleto: 'João Silva',
      apelido: 'Joãozinho',
      celular: '21987654321',
      email: 'joao@example.com',
      bairro: 'Copacabana',
    };

    const result = await insertRegistration(wixData, registration);

    expect(result._id).toBeDefined();
    expect(result.nomeCompleto).toBe('João Silva');
    expect(result.apelido).toBe('Joãozinho');
    expect(result.celular).toBe('21987654321');
    expect(result.syncStatus).toBe('pending');
    expect(result.syncAttempts).toBe(0);
    expect(result.syncError).toBe(null);
    expect(result.gabineteId).toBe(null);
    expect(result.lastSyncAt).toBe(null);
  });

  it('should insert registration with optional fields', async () => {
    const registration = {
      nomeCompleto: 'Maria Santos',
      apelido: 'Mari',
      celular: '21912345678',
      email: 'maria@example.com',
      bairro: 'Ipanema',
      cpf: '123.456.789-00',
      sexo: '2',
      dataNascimento: '1990-01-15',
      telefone: '2122334455',
      cep: '22050-030',
      endereco: 'Rua Example',
      numero: '123',
      complemento: 'Apt 101',
      uf: 'RJ',
      observacao: 'Test observation',
      titulo: '1234567890',
      sessao: '0123',
    };

    const result = await insertRegistration(wixData, registration);

    expect(result._id).toBeDefined();
    expect(result.cpf).toBe('123.456.789-00');
    expect(result.sexo).toBe('2');
    expect(result.dataNascimento).toBe('1990-01-15');
    expect(result.syncStatus).toBe('pending');
  });

  it('should validate required fields are present', async () => {
    const invalidRegistration = {
      nomeCompleto: 'João Silva',
      // Missing: apelido, celular, email, bairro
    };

    await expect(insertRegistration(wixData, invalidRegistration))
      .rejects.toThrow('Missing required fields');
  });
});

describe('Query by Celular', () => {
  let wixData;

  beforeEach(() => {
    wixData = createWixDataMock();
  });

  it('should return matching record when celular exists', async () => {
    // Insert a test registration
    await insertRegistration(wixData, {
      nomeCompleto: 'João Silva',
      apelido: 'Joãozinho',
      celular: '21987654321',
      email: 'joao@example.com',
      bairro: 'Copacabana',
    });

    const result = await queryByCelular(wixData, '21987654321');

    expect(result).not.toBe(null);
    expect(result.celular).toBe('21987654321');
    expect(result.apelido).toBe('Joãozinho');
  });

  it('should return null when celular does not exist', async () => {
    const result = await queryByCelular(wixData, '21999999999');

    expect(result).toBe(null);
  });

  it('should return most recent record if multiple exist with same celular', async () => {
    // Insert two registrations with same phone
    await insertRegistration(wixData, {
      nomeCompleto: 'João Silva v1',
      apelido: 'João',
      celular: '21987654321',
      email: 'joao@example.com',
      bairro: 'Copacabana',
    });

    await insertRegistration(wixData, {
      nomeCompleto: 'João Silva v2',
      apelido: 'Joãozinho',
      celular: '21987654321',
      email: 'joao2@example.com',
      bairro: 'Ipanema',
    });

    const result = await queryByCelular(wixData, '21987654321');

    // Should return most recent (v2)
    expect(result.nomeCompleto).toBe('João Silva v2');
    expect(result.apelido).toBe('Joãozinho');
  });
});

describe('Update Sync Status', () => {
  let wixData;
  let registrationId;

  beforeEach(async () => {
    wixData = createWixDataMock();
    const registration = await insertRegistration(wixData, {
      nomeCompleto: 'João Silva',
      apelido: 'Joãozinho',
      celular: '21987654321',
      email: 'joao@example.com',
      bairro: 'Copacabana',
    });
    registrationId = registration._id;
  });

  it('should update syncStatus from "pending" to "synced"', async () => {
    const result = await updateSyncStatus(wixData, registrationId, 'synced', 'GAB123');

    expect(result.syncStatus).toBe('synced');
    expect(result.gabineteId).toBe('GAB123');
    expect(result.syncError).toBe(null);
    expect(result.lastSyncAt).toBeDefined();
  });

  it('should update syncStatus from "pending" to "failed" with error message', async () => {
    const errorMessage = 'Connection timeout';

    const result = await updateSyncStatus(wixData, registrationId, 'failed', null, errorMessage);

    expect(result.syncStatus).toBe('failed');
    expect(result.syncError).toBe('Connection timeout');
    expect(result.gabineteId).toBe(null);
    expect(result.lastSyncAt).toBeDefined();
  });

  it('should preserve existing data when updating status', async () => {
    const result = await updateSyncStatus(wixData, registrationId, 'synced', 'GAB456');

    expect(result.nomeCompleto).toBe('João Silva');
    expect(result.apelido).toBe('Joãozinho');
    expect(result.celular).toBe('21987654321');
  });
});

describe('Increment Sync Attempts', () => {
  let wixData;
  let registrationId;

  beforeEach(async () => {
    wixData = createWixDataMock();
    const registration = await insertRegistration(wixData, {
      nomeCompleto: 'João Silva',
      apelido: 'Joãozinho',
      celular: '21987654321',
      email: 'joao@example.com',
      bairro: 'Copacabana',
    });
    registrationId = registration._id;
  });

  it('should increment syncAttempts from 0 to 1', async () => {
    const result = await incrementSyncAttempts(wixData, registrationId);

    expect(result.syncAttempts).toBe(1);
  });

  it('should increment syncAttempts multiple times', async () => {
    await incrementSyncAttempts(wixData, registrationId);
    await incrementSyncAttempts(wixData, registrationId);
    const result = await incrementSyncAttempts(wixData, registrationId);

    expect(result.syncAttempts).toBe(3);
  });

  it('should update lastSyncAt on each attempt', async () => {
    const result1 = await incrementSyncAttempts(wixData, registrationId);
    expect(result1.lastSyncAt).toBeDefined();

    // Wait a tiny bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const result2 = await incrementSyncAttempts(wixData, registrationId);
    expect(result2.lastSyncAt).toBeDefined();
    expect(result2.lastSyncAt).not.toBe(result1.lastSyncAt);
  });
});

describe('Duplicate Celular Handling', () => {
  let wixData;

  beforeEach(() => {
    wixData = createWixDataMock();
  });

  it('should allow querying existing celular before insert', async () => {
    const celular = '21987654321';

    // First check - should be null
    let existing = await queryByCelular(wixData, celular);
    expect(existing).toBe(null);

    // Insert
    await insertRegistration(wixData, {
      nomeCompleto: 'João Silva',
      apelido: 'Joãozinho',
      celular,
      email: 'joao@example.com',
      bairro: 'Copacabana',
    });

    // Second check - should find record
    existing = await queryByCelular(wixData, celular);
    expect(existing).not.toBe(null);
    expect(existing.celular).toBe(celular);
  });

  it('should allow updating existing record instead of inserting duplicate', async () => {
    const celular = '21987654321';

    // First registration
    const registration1 = await insertRegistration(wixData, {
      nomeCompleto: 'João Silva',
      apelido: 'João',
      celular,
      email: 'joao@example.com',
      bairro: 'Copacabana',
    });

    // Check if exists
    const existing = await queryByCelular(wixData, celular);
    expect(existing).not.toBe(null);

    // Update instead of inserting duplicate
    const updated = await wixData.update('Registros', {
      _id: existing._id,
      apelido: 'Joãozinho',
      email: 'joao.updated@example.com',
    });

    expect(updated.apelido).toBe('Joãozinho');
    expect(updated.email).toBe('joao.updated@example.com');
    expect(updated.celular).toBe(celular);
  });
});
