// __mocks__/participatedb-web.js — jest mock for backend/participatedb.web
// Exported as both the function alias (for the page to import) and the mock handle (for tests to spy on).
import { jest } from '@jest/globals';

export const mockSaveRegistration = jest.fn();
export const mockLookupUserByPhone = jest.fn();

// These are the names the page imports
export const saveRegistration = mockSaveRegistration;
export const lookupUserByPhone = mockLookupUserByPhone;
