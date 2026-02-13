// __tests__/database-operations.test.js
import { jest } from '@jest/globals';
import { insert, query } from 'wix-data';
import { saveRegistration, lookupUserByPhone } from '../velo-code/backend/participatedb.jsw';

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveRegistration', () => {
    test('should save valid registration data to database', async () => {
      // Arrange
      const formData = {
        apelido: 'João',
        sobrenome: 'Silva',
        nome: 'João Silva',
        celular: '(21) 99999-9999',
        email: 'joao@example.com',
        cep: '22290-080',
        dataNascimento: '01/01/1990'
      };

      const mockResult = {
        _id: 'mock-id-123',
        ...formData,
        syncStatus: 'pending',
        syncAttempts: 0
      };

      insert.mockResolvedValue(mockResult);

      // Act
      const result = await saveRegistration(formData);

      // Assert
      expect(insert).toHaveBeenCalledWith('Registros', {
        ...formData,
        syncStatus: 'pending',
        syncAttempts: 0,
        lastSyncAt: null,
        gabineteId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(result).toEqual(mockResult);
    });

    test('should validate required fields before saving', async () => {
      // Arrange
      const invalidData = {
        apelido: '', // Required field empty
        celular: '(21) 99999-9999',
        email: 'joao@example.com'
      };

      // Act & Assert
      await expect(saveRegistration(invalidData)).rejects.toThrow('Campo obrigatório não preenchido: apelido');
      expect(insert).not.toHaveBeenCalled();
    });

    test('should validate email format', async () => {
      // Arrange
      const invalidData = {
        apelido: 'João',
        celular: '(21) 99999-9999',
        email: 'invalid-email'
      };

      // Act & Assert
      await expect(saveRegistration(invalidData)).rejects.toThrow('Email inválido');
      expect(insert).not.toHaveBeenCalled();
    });

    test('should validate phone number format', async () => {
      // Arrange
      const invalidData = {
        apelido: 'João',
        celular: '123', // Too short
        email: 'joao@example.com'
      };

      // Act & Assert
      await expect(saveRegistration(invalidData)).rejects.toThrow('Número de telefone inválido');
      expect(insert).not.toHaveBeenCalled();
    });

    test('should normalize phone number before saving', async () => {
      // Arrange
      const formData = {
        apelido: 'João',
        celular: '21999999999', // No formatting
        email: 'joao@example.com'
      };

      const mockResult = {
        _id: 'mock-id-123',
        ...formData,
        celular: '(21) 99999-9999', // Normalized
        syncStatus: 'pending',
        syncAttempts: 0
      };

      insert.mockResolvedValue(mockResult);

      // Act
      const result = await saveRegistration(formData);

      // Assert
      expect(insert).toHaveBeenCalledWith('Registros', expect.objectContaining({
        celular: '(21) 99999-9999' // Should be normalized
      }));
    });
  });

  describe('lookupUserByPhone', () => {
    test('should find existing user by phone number', async () => {
      // Arrange
      const phoneNumber = '(21) 99999-9999';
      const mockUser = {
        _id: 'user-123',
        apelido: 'João',
        nome: 'João Silva',
        celular: '(21) 99999-9999',
        email: 'joao@example.com'
      };

      const mockQueryResult = {
        items: [mockUser],
        totalCount: 1
      };

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        find: jest.fn().mockResolvedValue(mockQueryResult)
      };

      query.mockReturnValue(mockQuery);

      // Act
      const result = await lookupUserByPhone(phoneNumber);

      // Assert
      expect(query).toHaveBeenCalledWith('Registros');
      expect(mockQuery.eq).toHaveBeenCalledWith('celular', '(21) 99999-9999');
      expect(result).toEqual(mockUser);
    });

    test('should normalize phone number before lookup', async () => {
      // Arrange
      const phoneNumber = '21999999999'; // No formatting
      const normalizedPhone = '(21) 99999-9999';

      const mockUser = {
        _id: 'user-123',
        celular: normalizedPhone
      };

      const mockQueryResult = {
        items: [mockUser],
        totalCount: 1
      };

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        find: jest.fn().mockResolvedValue(mockQueryResult)
      };

      query.mockReturnValue(mockQuery);

      // Act
      const result = await lookupUserByPhone(phoneNumber);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith('celular', normalizedPhone);
    });

    test('should return null when user not found', async () => {
      // Arrange
      const phoneNumber = '(21) 88888-8888';

      const mockQueryResult = {
        items: [],
        totalCount: 0
      };

      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        find: jest.fn().mockResolvedValue(mockQueryResult)
      };

      query.mockReturnValue(mockQuery);

      // Act
      const result = await lookupUserByPhone(phoneNumber);

      // Assert
      expect(result).toBeNull();
    });
  });
});