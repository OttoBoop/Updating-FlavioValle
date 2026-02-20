// __mocks__/wix-location.js — jest mock for Wix Location
import { jest } from '@jest/globals';

export const mockTo = jest.fn();

export default { to: mockTo };
