// __mocks__/wix-data.js — jest mock for Wix Data module
// Used by tests that import 'wix-data' (via moduleNameMapper in jest.config.js)
import { jest } from '@jest/globals';

export const mockInsert = jest.fn();
export const mockFind = jest.fn().mockResolvedValue({ items: [] });
export const mockEq = jest.fn(() => ({ find: mockFind }));
export const mockQuery = jest.fn(() => ({ eq: mockEq }));

export default {
    insert: mockInsert,
    query: mockQuery,
};
