// __mocks__/cep-resolver-web.js — jest mock for backend/cep-resolver.web
import { jest } from '@jest/globals';

export const mockResolveCep = jest.fn().mockResolvedValue({
    rua: 'Rua Voluntários da Pátria',
    cidade: 'Rio de Janeiro',
    cep: '22222-222',
});

// Name the page imports
export const resolveCep = mockResolveCep;
