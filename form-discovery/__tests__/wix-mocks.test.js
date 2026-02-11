import { describe, it, expect } from '@jest/globals';
import {
  createWixDataMock,
  createWixFetchMock,
  createWixLocationMock,
  createWixSecretsMock
} from '../utils/wix-mocks.js';

describe('Wix Data Mock', () => {
  it('should export createWixDataMock factory function', () => {
    expect(createWixDataMock).toBeDefined();
    expect(typeof createWixDataMock).toBe('function');
  });

  it('should return an object with query, insert, update, get methods', () => {
    const wixData = createWixDataMock();

    expect(wixData).toBeDefined();
    expect(typeof wixData.query).toBe('function');
    expect(typeof wixData.insert).toBe('function');
    expect(typeof wixData.update).toBe('function');
    expect(typeof wixData.get).toBe('function');
  });

  it('should query().eq().find() matching items from seeded data', () => {
    const initialData = {
      'Registros': [
        { _id: '1', nome: 'João Silva', email: 'joao@test.com' },
        { _id: '2', nome: 'Maria Santos', email: 'maria@test.com' },
        { _id: '3', nome: 'João Souza', email: 'souza@test.com' }
      ]
    };

    const wixData = createWixDataMock(initialData);
    const result = wixData.query('Registros').eq('nome', 'João Silva').find();

    expect(result).toBeDefined();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({ _id: '1', nome: 'João Silva', email: 'joao@test.com' });
    expect(result.totalCount).toBe(1);
    expect(result.length).toBe(1);
  });

  it('should query().find() with no eq() return all items in collection', () => {
    const initialData = {
      'Registros': [
        { _id: '1', nome: 'João Silva' },
        { _id: '2', nome: 'Maria Santos' },
        { _id: '3', nome: 'João Souza' }
      ]
    };

    const wixData = createWixDataMock(initialData);
    const result = wixData.query('Registros').find();

    expect(result.items).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.length).toBe(3);
  });

  it('should query on empty collection return empty result with counts zero', () => {
    const wixData = createWixDataMock();
    const result = wixData.query('NonExistent').find();

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.length).toBe(0);
  });

  it('should insert() add item and return it with auto-generated _id', () => {
    const wixData = createWixDataMock();
    const newItem = { nome: 'Novo Registro', email: 'novo@test.com' };

    const result = wixData.insert('Registros', newItem);

    expect(result).toBeDefined();
    expect(result._id).toBeDefined();
    expect(typeof result._id).toBe('string');
    expect(result.nome).toBe('Novo Registro');
    expect(result.email).toBe('novo@test.com');

    // Verify it's actually stored
    const found = wixData.query('Registros').eq('nome', 'Novo Registro').find();
    expect(found.items).toHaveLength(1);
    expect(found.items[0]._id).toBe(result._id);
  });

  it('should update() modify existing item by _id and return updated item', () => {
    const initialData = {
      'Registros': [
        { _id: '1', nome: 'João Silva', email: 'joao@test.com' }
      ]
    };

    const wixData = createWixDataMock(initialData);
    const updatedItem = { _id: '1', nome: 'João Silva Updated', email: 'newemail@test.com' };

    const result = wixData.update('Registros', updatedItem);

    expect(result).toEqual(updatedItem);

    // Verify the update persisted
    const found = wixData.get('Registros', '1');
    expect(found.nome).toBe('João Silva Updated');
    expect(found.email).toBe('newemail@test.com');
  });

  it('should get() return item by _id', () => {
    const initialData = {
      'Registros': [
        { _id: '1', nome: 'João Silva', email: 'joao@test.com' },
        { _id: '2', nome: 'Maria Santos', email: 'maria@test.com' }
      ]
    };

    const wixData = createWixDataMock(initialData);
    const item = wixData.get('Registros', '2');

    expect(item).toEqual({ _id: '2', nome: 'Maria Santos', email: 'maria@test.com' });
  });

  it('should get() return null for missing items', () => {
    const wixData = createWixDataMock();
    const item = wixData.get('Registros', 'nonexistent');

    expect(item).toBeNull();
  });

  it('should query().limit(n).find() limit results', () => {
    const initialData = {
      'Registros': [
        { _id: '1', nome: 'João 1' },
        { _id: '2', nome: 'João 2' },
        { _id: '3', nome: 'João 3' },
        { _id: '4', nome: 'João 4' },
        { _id: '5', nome: 'João 5' }
      ]
    };

    const wixData = createWixDataMock(initialData);
    const result = wixData.query('Registros').limit(3).find();

    expect(result.items).toHaveLength(3);
    expect(result.length).toBe(3);
    // totalCount should still reflect total available (not limited)
    expect(result.totalCount).toBe(5);
  });

  it('should query().skip(n).find() skip first n items', () => {
    const initialData = {
      'Registros': [
        { _id: '1', nome: 'João 1' },
        { _id: '2', nome: 'João 2' },
        { _id: '3', nome: 'João 3' },
        { _id: '4', nome: 'João 4' },
        { _id: '5', nome: 'João 5' }
      ]
    };

    const wixData = createWixDataMock(initialData);
    const result = wixData.query('Registros').skip(2).find();

    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toEqual({ _id: '3', nome: 'João 3' });
  });

  it('should chain query().eq().limit().skip().find() operations', () => {
    const initialData = {
      'Registros': [
        { _id: '1', status: 'active', nome: 'João 1' },
        { _id: '2', status: 'active', nome: 'João 2' },
        { _id: '3', status: 'active', nome: 'João 3' },
        { _id: '4', status: 'inactive', nome: 'João 4' },
        { _id: '5', status: 'active', nome: 'João 5' }
      ]
    };

    const wixData = createWixDataMock(initialData);
    const result = wixData.query('Registros')
      .eq('status', 'active')
      .skip(1)
      .limit(2)
      .find();

    expect(result.items).toHaveLength(2);
    expect(result.items[0]._id).toBe('2');
    expect(result.items[1]._id).toBe('3');
  });
});

describe('Wix Fetch Mock', () => {
  it('should export createWixFetchMock factory function', () => {
    expect(createWixFetchMock).toBeDefined();
    expect(typeof createWixFetchMock).toBe('function');
  });

  it('should return an object with fetch method and getCalls tracker', () => {
    const wixFetch = createWixFetchMock();

    expect(wixFetch).toBeDefined();
    expect(typeof wixFetch.fetch).toBe('function');
    expect(typeof wixFetch.getCalls).toBe('function');
  });

  it('should fetch() return configured response for matching URL pattern', async () => {
    const responses = [
      {
        urlPattern: 'https://api.example.com/users',
        status: 200,
        body: { users: [{ id: 1, name: 'João' }] }
      }
    ];

    const wixFetch = createWixFetchMock(responses);
    const response = await wixFetch.fetch('https://api.example.com/users');

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ users: [{ id: 1, name: 'João' }] });
  });

  it('should fetch() return 404 for unmatched URLs', async () => {
    const wixFetch = createWixFetchMock([]);
    const response = await wixFetch.fetch('https://api.example.com/unknown');

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it('should response have .ok, .status, .json(), .text() methods', async () => {
    const responses = [
      {
        urlPattern: 'https://api.example.com/test',
        status: 200,
        body: { message: 'Hello World' }
      }
    ];

    const wixFetch = createWixFetchMock(responses);
    const response = await wixFetch.fetch('https://api.example.com/test');

    expect(response).toHaveProperty('ok');
    expect(response).toHaveProperty('status');
    expect(typeof response.json).toBe('function');
    expect(typeof response.text).toBe('function');
  });

  it('should response.text() return stringified body', async () => {
    const responses = [
      {
        urlPattern: 'https://api.example.com/text',
        status: 200,
        body: 'Plain text response'
      }
    ];

    const wixFetch = createWixFetchMock(responses);
    const response = await wixFetch.fetch('https://api.example.com/text');
    const text = await response.text();

    expect(text).toBe('Plain text response');
  });

  it('should getCalls() track all fetch calls with url and options', async () => {
    const wixFetch = createWixFetchMock([]);

    await wixFetch.fetch('https://api.example.com/users');
    await wixFetch.fetch('https://api.example.com/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' })
    });

    const calls = wixFetch.getCalls();

    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe('https://api.example.com/users');
    expect(calls[1].url).toBe('https://api.example.com/posts');
    expect(calls[1].options.method).toBe('POST');
  });

  it('should fetch() capture headers, method, body from options', async () => {
    const wixFetch = createWixFetchMock([]);

    await wixFetch.fetch('https://api.example.com/test', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token123' },
      body: JSON.stringify({ data: 'test' })
    });

    const calls = wixFetch.getCalls();

    expect(calls[0].options.method).toBe('PUT');
    expect(calls[0].options.headers['Content-Type']).toBe('application/json');
    expect(calls[0].options.headers['Authorization']).toBe('Bearer token123');
    expect(calls[0].options.body).toBe(JSON.stringify({ data: 'test' }));
  });

  it('should response.headers provide access to response headers', async () => {
    const responses = [
      {
        urlPattern: 'https://api.example.com/headers',
        status: 200,
        body: { data: 'test' },
        headers: { 'Content-Type': 'application/json', 'X-Custom-Header': 'custom-value' }
      }
    ];

    const wixFetch = createWixFetchMock(responses);
    const response = await wixFetch.fetch('https://api.example.com/headers');

    expect(response.headers).toBeDefined();
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['X-Custom-Header']).toBe('custom-value');
  });

  it('should match URL patterns using partial string matching', async () => {
    const responses = [
      {
        urlPattern: '/api/users',
        status: 200,
        body: { success: true }
      }
    ];

    const wixFetch = createWixFetchMock(responses);
    const response = await wixFetch.fetch('https://example.com/api/users?id=123');

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

describe('Wix Location Mock', () => {
  it('should export createWixLocationMock factory function', () => {
    expect(createWixLocationMock).toBeDefined();
    expect(typeof createWixLocationMock).toBe('function');
  });

  it('should return object with to, path, query properties and getNavigations method', () => {
    const wixLocation = createWixLocationMock();

    expect(wixLocation).toBeDefined();
    expect(typeof wixLocation.to).toBe('function');
    expect(wixLocation).toHaveProperty('path');
    expect(wixLocation).toHaveProperty('query');
    expect(typeof wixLocation.getNavigations).toBe('function');
  });

  it('should .path return initial path', () => {
    const wixLocation = createWixLocationMock('/home', {});

    expect(wixLocation.path).toBe('/home');
  });

  it('should .query return initial query params', () => {
    const initialQuery = { page: '1', filter: 'active' };
    const wixLocation = createWixLocationMock('/', initialQuery);

    expect(wixLocation.query).toEqual(initialQuery);
  });

  it('should .to(url) record navigation', () => {
    const wixLocation = createWixLocationMock();

    wixLocation.to('/about');
    wixLocation.to('/contact?ref=header');

    const navigations = wixLocation.getNavigations();

    expect(navigations).toHaveLength(2);
    expect(navigations[0]).toBe('/about');
    expect(navigations[1]).toBe('/contact?ref=header');
  });

  it('should getNavigations() return empty array initially', () => {
    const wixLocation = createWixLocationMock();

    const navigations = wixLocation.getNavigations();

    expect(navigations).toEqual([]);
  });

  it('should default to root path and empty query if not provided', () => {
    const wixLocation = createWixLocationMock();

    expect(wixLocation.path).toBe('/');
    expect(wixLocation.query).toEqual({});
  });
});

describe('Wix Secrets Mock', () => {
  it('should export createWixSecretsMock factory function', () => {
    expect(createWixSecretsMock).toBeDefined();
    expect(typeof createWixSecretsMock).toBe('function');
  });

  it('should return object with getSecret method', () => {
    const wixSecrets = createWixSecretsMock({});

    expect(wixSecrets).toBeDefined();
    expect(typeof wixSecrets.getSecret).toBe('function');
  });

  it('should getSecret() return configured secret value', () => {
    const secrets = {
      'API_KEY': 'secret-api-key-123',
      'DATABASE_URL': 'postgresql://localhost/db'
    };

    const wixSecrets = createWixSecretsMock(secrets);

    expect(wixSecrets.getSecret('API_KEY')).toBe('secret-api-key-123');
    expect(wixSecrets.getSecret('DATABASE_URL')).toBe('postgresql://localhost/db');
  });

  it('should getSecret() throw for unknown secret names', () => {
    const wixSecrets = createWixSecretsMock({ 'KNOWN_SECRET': 'value' });

    expect(() => wixSecrets.getSecret('UNKNOWN_SECRET')).toThrow();
    expect(() => wixSecrets.getSecret('UNKNOWN_SECRET')).toThrow('UNKNOWN_SECRET');
  });

  it('should getSecret() throw descriptive error message with secret name', () => {
    const wixSecrets = createWixSecretsMock({});

    expect(() => wixSecrets.getSecret('MISSING_KEY')).toThrow('Secret not found');
    expect(() => wixSecrets.getSecret('MISSING_KEY')).toThrow('MISSING_KEY');
  });
});
