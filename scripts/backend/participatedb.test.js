/**
 * @jest-environment node
 *
 * Unit tests: participatedb.web.js
 * wix-data and wix-web-module are resolved to __mocks__/ stubs via moduleNameMapper.
 * The webMethod mock is transparent (returns the inner function), so saveRegistration
 * and lookupUserByPhone are tested as plain async functions.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { mockInsert, mockFind, mockEq, mockQuery } from 'wix-data';
import { saveRegistration, lookupUserByPhone } from '../../../flavio-valle/src/backend/participatedb.web.js';

// -------------------------------------------------------------------

beforeEach(() => {
    mockInsert.mockReset();
    mockFind.mockReset();
    mockEq.mockReset();
    mockQuery.mockReset();
    // Re-establish default query chain
    mockFind.mockResolvedValue({ items: [] });
    mockEq.mockReturnValue({ find: mockFind });
    mockQuery.mockReturnValue({ eq: mockEq });
});

// -------------------------------------------------------------------

describe('saveRegistration', () => {
    it('should insert a record into the Registros collection', async () => {
        const fakeRecord = { _id: 'abc123', celular: '(21) 99999-9999' };
        mockInsert.mockResolvedValue(fakeRecord);

        const formData = {
            apelido: 'João',
            sobrenome: 'Silva',
            celular: '21999999999',
            email: 'joao@example.com',
        };

        const result = await saveRegistration(formData);

        expect(mockInsert).toHaveBeenCalledTimes(1);
        expect(mockInsert).toHaveBeenCalledWith('Registros', expect.objectContaining({
            apelido: 'João',
            email: 'joao@example.com',
            syncStatus: 'pending',
            syncAttempts: 0,
        }));
        expect(result).toEqual(fakeRecord);
    });

    it('should set syncStatus to "pending" and syncAttempts to 0 on every save', async () => {
        mockInsert.mockResolvedValue({ _id: 'xyz' });

        await saveRegistration({
            apelido: 'Maria',
            sobrenome: 'Santos',
            celular: '21988888888',
            email: 'maria@example.com',
        });

        const insertedRecord = mockInsert.mock.calls[0][1];
        expect(insertedRecord.syncStatus).toBe('pending');
        expect(insertedRecord.syncAttempts).toBe(0);
    });

    it('should throw if apelido is missing', async () => {
        await expect(saveRegistration({
            sobrenome: 'Silva',
            celular: '21999999999',
            email: 'test@example.com',
        })).rejects.toThrow();
    });

    it('should throw if celular is missing', async () => {
        await expect(saveRegistration({
            apelido: 'João',
            sobrenome: 'Silva',
            email: 'test@example.com',
        })).rejects.toThrow();
    });

    it('should throw if email is missing', async () => {
        await expect(saveRegistration({
            apelido: 'João',
            sobrenome: 'Silva',
            celular: '21999999999',
        })).rejects.toThrow();
    });
});

// -------------------------------------------------------------------

describe('lookupUserByPhone', () => {
    it('should return null when no record matches the phone number', async () => {
        mockFind.mockResolvedValue({ items: [] });

        const result = await lookupUserByPhone('21999999999');

        expect(result).toBeNull();
        expect(mockQuery).toHaveBeenCalledWith('Registros');
    });

    it('should return the first matching record when phone is found', async () => {
        const existingUser = { _id: 'user1', apelido: 'Maria', celular: '(21) 99999-9999' };
        mockFind.mockResolvedValue({ items: [existingUser] });

        const result = await lookupUserByPhone('21999999999');

        expect(result).toEqual(existingUser);
    });

    it('should normalise digits-only phone to formatted (XX) XXXXX-XXXX before querying', async () => {
        mockFind.mockResolvedValue({ items: [] });

        await lookupUserByPhone('21999999999');

        expect(mockEq).toHaveBeenCalledWith('celular', '(21) 99999-9999');
    });

    it('should normalise already-formatted phone before querying', async () => {
        mockFind.mockResolvedValue({ items: [] });

        await lookupUserByPhone('(21) 99999-9999');

        expect(mockEq).toHaveBeenCalledWith('celular', '(21) 99999-9999');
    });

    it('should return null for an empty phone string', async () => {
        mockFind.mockResolvedValue({ items: [] });

        const result = await lookupUserByPhone('');

        expect(result).toBeNull();
    });
});
