import { jest } from '@jest/globals';

export const insert = jest.fn();
export const query = jest.fn(() => ({
  eq: jest.fn().mockReturnThis(),
  find: jest.fn()
}));