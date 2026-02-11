/**
 * F5-T2: Phone Lookup Logic Module Tests
 *
 * Tests for the phone lookup flow on /participe page:
 * - Validates phone numbers
 * - Queries Registros DB
 * - Routes users (new vs returning)
 */

import { lookupPhone, getWelcomeMessage, getRouteAction } from '../utils/phone-lookup.js';
import { createWixDataMock } from '../utils/wix-mocks.js';

describe('lookupPhone', () => {
  test('returns invalid route for empty string', async () => {
    const wixData = createWixDataMock();
    const result = await lookupPhone('', wixData);

    expect(result.route).toBe('invalid');
    expect(result.error).toBeDefined();
  });

  test('returns invalid route for non-string input (null)', async () => {
    const wixData = createWixDataMock();
    const result = await lookupPhone(null, wixData);

    expect(result.route).toBe('invalid');
    expect(result.error).toBeDefined();
  });

  test('returns invalid route for invalid phone format ("abc")', async () => {
    const wixData = createWixDataMock();
    const result = await lookupPhone('abc', wixData);

    expect(result.route).toBe('invalid');
    expect(result.error).toBeDefined();
  });

  test('returns register route when phone is valid but not in DB', async () => {
    const wixData = createWixDataMock({
      Registros: []
    });
    const result = await lookupPhone('21999999999', wixData);

    expect(result.route).toBe('register');
    expect(result.user).toBeUndefined();
  });

  test('returns welcome-back route when phone found in DB', async () => {
    const wixData = createWixDataMock({
      Registros: [
        {
          _id: 'rec1',
          nomeCompleto: 'João Silva',
          apelido: 'João',
          celular: '21999999999',
          email: 'joao@test.com',
          bairro: 'Centro',
          syncStatus: 'pending'
        }
      ]
    });
    const result = await lookupPhone('21999999999', wixData);

    expect(result.route).toBe('welcome-back');
    expect(result.user).toBeDefined();
  });

  test('normalizes phone before DB query', async () => {
    const wixData = createWixDataMock({
      Registros: [
        {
          _id: 'rec1',
          nomeCompleto: 'João Silva',
          apelido: 'João',
          celular: '21999999999',
          email: 'joao@test.com',
          bairro: 'Centro',
          syncStatus: 'pending'
        }
      ]
    });
    const result = await lookupPhone('(21) 99999-9999', wixData);

    expect(result.route).toBe('welcome-back');
    expect(result.user).toBeDefined();
    expect(result.user.celular).toBe('21999999999');
  });

  test('works with +55 prefix in phone', async () => {
    const wixData = createWixDataMock({
      Registros: [
        {
          _id: 'rec1',
          nomeCompleto: 'João Silva',
          apelido: 'João',
          celular: '21999999999',
          email: 'joao@test.com',
          bairro: 'Centro',
          syncStatus: 'pending'
        }
      ]
    });
    const result = await lookupPhone('+55 21 99999-9999', wixData);

    expect(result.route).toBe('welcome-back');
    expect(result.user).toBeDefined();
  });

  test('returns the full user record in welcome-back route', async () => {
    const expectedUser = {
      _id: 'rec1',
      nomeCompleto: 'João Silva',
      apelido: 'João',
      celular: '21999999999',
      email: 'joao@test.com',
      bairro: 'Centro',
      syncStatus: 'pending'
    };

    const wixData = createWixDataMock({
      Registros: [expectedUser]
    });
    const result = await lookupPhone('21999999999', wixData);

    expect(result.route).toBe('welcome-back');
    expect(result.user).toEqual(expectedUser);
  });
});

describe('getWelcomeMessage', () => {
  test('returns message with apelido when user has apelido', () => {
    const user = {
      _id: 'rec1',
      nomeCompleto: 'João Silva',
      apelido: 'João',
      celular: '21999999999',
      email: 'joao@test.com',
      bairro: 'Centro'
    };

    const message = getWelcomeMessage(user);
    expect(message).toBe('Bem-vindo de volta, João!');
  });

  test('returns message with nomeCompleto when user has no apelido', () => {
    const user = {
      _id: 'rec1',
      nomeCompleto: 'Maria Silva',
      celular: '21999999999',
      email: 'maria@test.com',
      bairro: 'Centro'
    };

    const message = getWelcomeMessage(user);
    expect(message).toBe('Bem-vindo de volta, Maria Silva!');
  });

  test('returns generic message when user has neither apelido nor nomeCompleto', () => {
    const user = {
      _id: 'rec1',
      celular: '21999999999',
      email: 'test@test.com',
      bairro: 'Centro'
    };

    const message = getWelcomeMessage(user);
    expect(message).toBe('Bem-vindo de volta!');
  });

  test('uses apelido over nomeCompleto when both exist', () => {
    const user = {
      _id: 'rec1',
      nomeCompleto: 'João Pedro Silva',
      apelido: 'João',
      celular: '21999999999',
      email: 'joao@test.com',
      bairro: 'Centro'
    };

    const message = getWelcomeMessage(user);
    expect(message).toBe('Bem-vindo de volta, João!');
  });
});

describe('getRouteAction', () => {
  test('returns showForm action for register route', () => {
    const lookupResult = { route: 'register' };
    const action = getRouteAction(lookupResult);

    expect(action.action).toBe('showForm');
    expect(action.prefill).toEqual({});
  });

  test('returns showWelcome action with message and whatsappUrl for welcome-back route', () => {
    const lookupResult = {
      route: 'welcome-back',
      user: {
        _id: 'rec1',
        nomeCompleto: 'João Silva',
        apelido: 'João',
        celular: '21999999999',
        email: 'joao@test.com',
        bairro: 'Centro'
      }
    };
    const action = getRouteAction(lookupResult);

    expect(action.action).toBe('showWelcome');
    expect(action.message).toBe('Bem-vindo de volta, João!');
    expect(action.whatsappUrl).toBe('https://wa.me/5521978919938');
  });

  test('returns showError action for invalid route', () => {
    const lookupResult = {
      route: 'invalid',
      error: 'Phone cannot be empty'
    };
    const action = getRouteAction(lookupResult);

    expect(action.action).toBe('showError');
    expect(action.message).toBe('Phone cannot be empty');
  });

  test('welcome action includes showUpdateOption: true', () => {
    const lookupResult = {
      route: 'welcome-back',
      user: {
        _id: 'rec1',
        nomeCompleto: 'João Silva',
        apelido: 'João',
        celular: '21999999999',
        email: 'joao@test.com',
        bairro: 'Centro'
      }
    };
    const action = getRouteAction(lookupResult);

    expect(action.showUpdateOption).toBe(true);
  });

  test('welcome action includes correct whatsappUrl', () => {
    const lookupResult = {
      route: 'welcome-back',
      user: {
        _id: 'rec1',
        nomeCompleto: 'João Silva',
        celular: '21999999999',
        email: 'joao@test.com',
        bairro: 'Centro'
      }
    };
    const action = getRouteAction(lookupResult);

    expect(action.whatsappUrl).toBe('https://wa.me/5521978919938');
  });
});
