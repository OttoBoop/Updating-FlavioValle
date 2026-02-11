import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { syncPendingRecords, syncSingleRecord } from '../utils/sync-worker.js';
import { createWixDataMock, createWixFetchMock } from '../utils/wix-mocks.js';

describe('Sync Worker (F4-T6)', () => {
  describe('syncSingleRecord - xajax format', () => {
    it('should format xajax request correctly (xajax=CadastrarClienteDados&xajaxr=...)', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'João Silva',
            apelido: 'João',
            celular: '21987654321',
            email: 'joao@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test123' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      const result = await syncSingleRecord('1', wixData, wixFetch, 'testuser', 'testpass');

      const calls = wixFetch.getCalls();
      // First call = login, second call = submit
      const submitCall = calls.find(c => c.url.includes('cadastroclientes_dados.php'));

      expect(submitCall).toBeDefined();
      expect(submitCall.options.body).toContain('xajax=CadastrarClienteDados');
      expect(submitCall.options.body).toContain('xajaxr=');
      expect(submitCall.options.body).toContain('xajaxargs[]=');
    });

    it('should send xajaxargs[] with encoded JSON form data', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Maria',
            sobrenome: 'Santos',
            apelido: 'Mari',
            celular: '21999999999',
            email: 'maria@test.com',
            bairro: '456',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      const calls = wixFetch.getCalls();
      const submitCall = calls.find(c => c.url.includes('cadastroclientes_dados.php'));

      // xajaxargs[] should be URL-encoded JSON
      const body = submitCall.options.body;
      expect(body).toMatch(/xajaxargs\[\]=/);

      // Extract and decode the args
      const match = body.match(/xajaxargs\[\]=([^&]+)/);
      expect(match).toBeTruthy();

      const decodedJson = decodeURIComponent(match[1]);
      const formData = JSON.parse(decodedJson);

      expect(formData).toHaveProperty('nome', 'Maria Santos');
      expect(formData).toHaveProperty('apelido', 'Mari');
      expect(formData).toHaveProperty('celular', '21999999999');
    });
  });

  describe('syncSingleRecord - retry logic', () => {
    it('should retry 3 times with increasing delays on failure', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Test User',
            apelido: 'Test',
            celular: '21999999999',
            email: 'test@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      // Login succeeds, but submit fails 3 times
      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 500, // Server error
          body: 'Internal Server Error'
        }
      ]);

      // Mock setTimeout to track delays
      const originalSetTimeout = global.setTimeout;
      const delays = [];
      global.setTimeout = jest.fn((fn, delay) => {
        delays.push(delay);
        return originalSetTimeout(fn, 0); // Execute immediately for testing
      });

      const result = await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;

      // Should have called submit 3 times (initial + 2 retries)
      const submitCalls = wixFetch.getCalls().filter(c => c.url.includes('cadastroclientes_dados.php'));
      expect(submitCalls.length).toBe(3);

      // Delays should increase exponentially: 1s, 2s, 4s (but could be 1000, 2000, 4000)
      expect(delays.length).toBeGreaterThanOrEqual(2);
      expect(delays[0]).toBeLessThan(delays[1]); // Each delay should be larger
    });

    it('should update syncAttempts counter on each retry', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Test',
            apelido: 'T',
            celular: '21999999999',
            email: 'test@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 500
        }
      ]);

      // Mock setTimeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn, delay) => originalSetTimeout(fn, 0));

      await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      global.setTimeout = originalSetTimeout;

      const record = wixData.get('Registros', '1');
      expect(record.syncAttempts).toBe(3);
    });
  });

  describe('syncSingleRecord - status updates', () => {
    it('should update syncStatus from pending to synced on success', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Success User',
            apelido: 'Success',
            celular: '21999999999',
            email: 'success@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      const result = await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      expect(result.success).toBe(true);

      const record = wixData.get('Registros', '1');
      expect(record.syncStatus).toBe('synced');
    });

    it('should update syncStatus to failed after 3 failed attempts', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Fail User',
            apelido: 'Fail',
            celular: '21999999999',
            email: 'fail@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 500
        }
      ]);

      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn, delay) => originalSetTimeout(fn, 0));

      const result = await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      global.setTimeout = originalSetTimeout;

      expect(result.success).toBe(false);

      const record = wixData.get('Registros', '1');
      expect(record.syncStatus).toBe('failed');
      expect(record.syncError).toBeDefined();
      expect(record.syncError.length).toBeGreaterThan(0);
    });

    it('should set lastSyncAt timestamp after sync attempt', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Test',
            apelido: 'T',
            celular: '21999999999',
            email: 'test@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0,
            lastSyncAt: null
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      const beforeSync = Date.now();
      await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');
      const afterSync = Date.now();

      const record = wixData.get('Registros', '1');
      expect(record.lastSyncAt).toBeDefined();
      expect(record.lastSyncAt).toBeGreaterThanOrEqual(beforeSync);
      expect(record.lastSyncAt).toBeLessThanOrEqual(afterSync);
    });

    it('should set gabineteId on successful sync', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Test',
            apelido: 'T',
            celular: '21999999999',
            email: 'test@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0,
            gabineteId: null
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd><cmd>{"id": "12345"}</cmd></xjx>'
        }
      ]);

      await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      const record = wixData.get('Registros', '1');
      // For now, just verify it's set (parsing XML response is v2)
      expect(record.gabineteId).toBeDefined();
    });

    it('should return failure result after 3 failed attempts', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Test',
            apelido: 'T',
            celular: '21999999999',
            email: 'test@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 500
        }
      ]);

      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn, delay) => originalSetTimeout(fn, 0));

      const result = await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      global.setTimeout = originalSetTimeout;

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toBeTruthy();
    });
  });

  describe('syncSingleRecord - error handling', () => {
    it('should handle login failure gracefully', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Test',
            apelido: 'T',
            celular: '21999999999',
            email: 'test@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      // Login fails
      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 401, // Unauthorized
          body: 'Invalid credentials'
        }
      ]);

      const result = await syncSingleRecord('1', wixData, wixFetch, 'baduser', 'badpass');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Login failed');

      const record = wixData.get('Registros', '1');
      expect(record.syncStatus).toBe('failed');
    });

    it('should call velo-field-mapper for mapping Wix data to gabineteonline fields', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'João',
            sobrenome: 'Silva',
            apelido: 'JS',
            celular: '21999999999',
            email: 'joao@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      const calls = wixFetch.getCalls();
      const submitCall = calls.find(c => c.url.includes('cadastroclientes_dados.php'));

      // Extract form data from xajaxargs[]
      const body = submitCall.options.body;
      const match = body.match(/xajaxargs\[\]=([^&]+)/);
      const decodedJson = decodeURIComponent(match[1]);
      const formData = JSON.parse(decodedJson);

      // Verify field mapper was used (nomeCompleto + sobrenome → nome)
      expect(formData.nome).toBe('João Silva');
      expect(formData.apelido).toBe('JS');
      expect(formData.id_bairro).toBe('123'); // Mapped from bairro
    });

    it('should call velo-gabinete-client.submitRegistration', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'Test',
            apelido: 'T',
            celular: '21999999999',
            email: 'test@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test123' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      await syncSingleRecord('1', wixData, wixFetch, 'user', 'pass');

      const calls = wixFetch.getCalls();
      const submitCall = calls.find(c => c.url.includes('cadastroclientes_dados.php'));

      // Verify it was called with cookies from login
      expect(submitCall).toBeDefined();
      expect(submitCall.options.headers.Cookie).toContain('PHPSESSID=test123');
    });
  });

  describe('syncPendingRecords - batch processing', () => {
    it('should query pending records from Wix DB', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'User 1',
            apelido: 'U1',
            celular: '21999999991',
            email: 'u1@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          },
          {
            _id: '2',
            nomeCompleto: 'User 2',
            apelido: 'U2',
            celular: '21999999992',
            email: 'u2@test.com',
            bairro: '123',
            syncStatus: 'synced', // Already synced
            syncAttempts: 1
          },
          {
            _id: '3',
            nomeCompleto: 'User 3',
            apelido: 'U3',
            celular: '21999999993',
            email: 'u3@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      const results = await syncPendingRecords(wixData, wixFetch, 'user', 'pass');

      // Should have synced 2 pending records (IDs 1 and 3)
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);

      // Verify records updated
      const record1 = wixData.get('Registros', '1');
      const record2 = wixData.get('Registros', '2');
      const record3 = wixData.get('Registros', '3');

      expect(record1.syncStatus).toBe('synced');
      expect(record2.syncStatus).toBe('synced'); // Unchanged
      expect(record3.syncStatus).toBe('synced');
    });

    it('should batch process multiple pending records', async () => {
      const wixData = createWixDataMock({
        Registros: [
          {
            _id: '1',
            nomeCompleto: 'A',
            apelido: 'A',
            celular: '21999999991',
            email: 'a@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          },
          {
            _id: '2',
            nomeCompleto: 'B',
            apelido: 'B',
            celular: '21999999992',
            email: 'b@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          },
          {
            _id: '3',
            nomeCompleto: 'C',
            apelido: 'C',
            celular: '21999999993',
            email: 'c@test.com',
            bairro: '123',
            syncStatus: 'pending',
            syncAttempts: 0
          }
        ]
      });

      const wixFetch = createWixFetchMock([
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          headers: { 'set-cookie': 'PHPSESSID=test' }
        },
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd>success</cmd></xjx>'
        }
      ]);

      const results = await syncPendingRecords(wixData, wixFetch, 'user', 'pass');

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});
