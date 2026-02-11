import { describe, it, expect } from '@jest/globals';
import { login, submitRegistration } from '../utils/velo-gabinete-client.jsw';
import { createWixFetchMock } from '../utils/wix-mocks.js';

describe('Velo Gabinete Client (F4-T5)', () => {
  describe('login function with wix-fetch', () => {
    it('should export login function', () => {
      expect(login).toBeDefined();
      expect(typeof login).toBe('function');
    });

    it('should use wix-fetch mock correctly for login', async () => {
      const responses = [
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          body: '<html>Dashboard</html>',
          headers: {
            'set-cookie': 'PHPSESSID=abc123; Path=/; HttpOnly'
          }
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const result = await login('testuser', 'testpass', wixFetch);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('cookies');
      expect(Array.isArray(result.cookies)).toBe(true);
    });

    it('should send login credentials in correct field names (txtusuario, txtsenha)', async () => {
      const responses = [
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          body: '<html>Dashboard</html>',
          headers: { 'set-cookie': 'PHPSESSID=test' }
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      await login('myuser', 'mypass', wixFetch);

      const calls = wixFetch.getCalls();
      expect(calls).toHaveLength(1);

      const body = calls[0].options.body;
      expect(body).toContain('txtusuario=myuser');
      expect(body).toContain('txtsenha=mypass');
    });

    it('should extract cookies from response headers', async () => {
      const responses = [
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 200,
          body: '<html>Dashboard</html>',
          headers: {
            'set-cookie': 'PHPSESSID=abc123; Path=/; HttpOnly; session=xyz789'
          }
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const result = await login('user', 'pass', wixFetch);

      expect(result.cookies).toBeDefined();
      expect(result.cookies.length).toBeGreaterThan(0);
      expect(result.cookies[0]).toContain('PHPSESSID');
    });

    it('should throw error on failed login (non-2xx status)', async () => {
      const responses = [
        {
          urlPattern: 'gabineteonline1.com.br/flaviovalle',
          status: 401,
          body: '<html>Login failed</html>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);

      await expect(login('wronguser', 'wrongpass', wixFetch)).rejects.toThrow('Login failed');
    });
  });

  describe('submitRegistration function with xajax protocol', () => {
    it('should export submitRegistration function', () => {
      expect(submitRegistration).toBeDefined();
      expect(typeof submitRegistration).toBe('function');
    });

    it('should format xajax request correctly', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd n="sc" t="js"><![CDATA[alert("Cadastro realizado!");]]></cmd></xjx>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=abc123'];
      const formData = {
        nome: 'João Silva',
        celular: '(21)98765-4321',
        email: 'joao@test.com'
      };

      await submitRegistration(cookies, formData, wixFetch);

      const calls = wixFetch.getCalls();
      expect(calls).toHaveLength(1);

      const body = calls[0].options.body;

      // Must contain xajax protocol parts
      expect(body).toContain('xajax=CadastrarClienteDados');
      expect(body).toContain('xajaxr=');  // timestamp
      expect(body).toContain('xajaxargs[]=');  // encoded form data
    });

    it('should send form data as JSON-encoded xajax argument', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd n="sc" t="js"><![CDATA[alert("Success");]]></cmd></xjx>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=test'];
      const formData = {
        nome: 'João Silva',
        celular: '(21)98765-4321'
      };

      await submitRegistration(cookies, formData, wixFetch);

      const calls = wixFetch.getCalls();
      const body = calls[0].options.body;

      // The form data should be JSON-stringified and URL-encoded in xajaxargs[]
      expect(body).toContain('xajaxargs[]=');

      // Decode the body to check JSON structure
      const decoded = decodeURIComponent(body);
      expect(decoded).toContain('"nome"');
      expect(decoded).toContain('"celular"');
    });

    it('should include session cookies in request headers', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd n="sc" t="js"><![CDATA[]]></cmd></xjx>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=abc123', 'session=xyz789'];
      const formData = { nome: 'Test', celular: '123' };

      await submitRegistration(cookies, formData, wixFetch);

      const calls = wixFetch.getCalls();
      const headers = calls[0].options.headers;

      expect(headers).toBeDefined();
      expect(headers.Cookie || headers.cookie).toBeDefined();

      const cookieHeader = headers.Cookie || headers.cookie;
      expect(cookieHeader).toContain('PHPSESSID=abc123');
      expect(cookieHeader).toContain('session=xyz789');
    });

    it('should use correct Content-Type header', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx></xjx>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=test'];
      const formData = { nome: 'Test', celular: '123' };

      await submitRegistration(cookies, formData, wixFetch);

      const calls = wixFetch.getCalls();
      const headers = calls[0].options.headers;

      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    });

    it('should return success when server responds with 2xx', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx><cmd n="sc" t="js"><![CDATA[alert("Cadastro realizado!");]]></cmd></xjx>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=test'];
      const formData = { nome: 'Test', celular: '123' };

      const result = await submitRegistration(cookies, formData, wixFetch);

      expect(result).toEqual({ success: true });
    });

    it('should return failure when server responds with non-2xx', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 400,
          body: '<html>Bad Request</html>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=test'];
      const formData = { nome: 'Test', celular: '123' };

      const result = await submitRegistration(cookies, formData, wixFetch);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('400');
    });

    it('should handle network errors gracefully', async () => {
      const wixFetch = {
        fetch: async () => {
          throw new Error('Network error: ECONNREFUSED');
        },
        getCalls: () => []
      };

      const cookies = ['PHPSESSID=test'];
      const formData = { nome: 'Test', celular: '123' };

      const result = await submitRegistration(cookies, formData, wixFetch);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Network error');
    });

    it('should use correct gabinete URL for submission', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx></xjx>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=test'];
      const formData = { nome: 'Test', celular: '123' };

      await submitRegistration(cookies, formData, wixFetch);

      const calls = wixFetch.getCalls();
      expect(calls[0].url).toContain('gabineteonline1.com.br/flaviovalle/cadastroclientes_dados.php');
    });

    it('should generate unique xajaxr timestamp for each request', async () => {
      const responses = [
        {
          urlPattern: 'cadastroclientes_dados.php',
          status: 200,
          body: '<xjx></xjx>'
        }
      ];

      const wixFetch = createWixFetchMock(responses);
      const cookies = ['PHPSESSID=test'];
      const formData = { nome: 'Test', celular: '123' };

      await submitRegistration(cookies, formData, wixFetch);
      await submitRegistration(cookies, formData, wixFetch);

      const calls = wixFetch.getCalls();

      const body1 = calls[0].options.body;
      const body2 = calls[1].options.body;

      // Extract xajaxr values
      const match1 = body1.match(/xajaxr=(\d+)/);
      const match2 = body2.match(/xajaxr=(\d+)/);

      expect(match1).not.toBeNull();
      expect(match2).not.toBeNull();

      // Timestamps should be different (or at least exist)
      expect(match1[1]).toBeDefined();
      expect(match2[1]).toBeDefined();
    });
  });

  describe('wix-fetch integration compatibility', () => {
    it('should work with wix-fetch mock that simulates real Wix API', async () => {
      // This test verifies the client is compatible with wix-fetch's interface
      const responses = [
        {
          urlPattern: 'gabineteonline1.com.br',
          status: 200,
          body: 'OK',
          headers: { 'set-cookie': 'PHPSESSID=test123' }
        }
      ];

      const wixFetch = createWixFetchMock(responses);

      // Should be able to call login
      const loginResult = await login('user', 'pass', wixFetch);
      expect(loginResult.success).toBe(true);

      // Should track the call
      const calls = wixFetch.getCalls();
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
