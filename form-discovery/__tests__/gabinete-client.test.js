import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock fetch globally for ESM
let originalFetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('Gabinete Client', () => {
  describe('login function', () => {
    it('should export login function', async () => {
      // Dynamic import to test module exists
      const module = await import('../utils/gabinete-client.js');
      expect(module.login).toBeDefined();
      expect(typeof module.login).toBe('function');
    });

    it('should successfully login and return session cookies', async () => {
      // Mock successful login response
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name) => {
              if (name.toLowerCase() === 'set-cookie') {
                return 'PHPSESSID=abc123; Path=/; HttpOnly';
              }
              return null;
            },
            raw: () => ({
              'set-cookie': ['PHPSESSID=abc123; Path=/; HttpOnly', 'session=xyz789']
            })
          },
          text: async () => '<html>Dashboard</html>'
        });

      const { login } = await import('../utils/gabinete-client.js');
      const result = await login('testuser', 'testpass');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('cookies');
      expect(Array.isArray(result.cookies)).toBe(true);
      expect(result.cookies.length).toBeGreaterThan(0);
    });

    it('should throw error when login fails with wrong credentials', async () => {
      // Mock failed login response
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: async () => '<html>Login failed</html>'
        });

      const { login } = await import('../utils/gabinete-client.js');

      await expect(login('wronguser', 'wrongpass')).rejects.toThrow();
    });

    it('should send correct login form fields (txtusuario, txtsenha)', async () => {
      let capturedBody = null;

      global.fetch = jest.fn()
        .mockImplementation(async (url, options) => {
          // Capture the body for inspection
          capturedBody = options.body;

          return {
            ok: true,
            headers: {
              get: () => 'PHPSESSID=test',
              raw: () => ({ 'set-cookie': ['PHPSESSID=test'] })
            },
            text: async () => '<html>Dashboard</html>'
          };
        });

      const { login } = await import('../utils/gabinete-client.js');
      await login('myuser', 'mypass');

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalled();

      // Verify request body contains correct field names
      expect(capturedBody).toBeDefined();
      expect(capturedBody.toString()).toContain('txtusuario');
      expect(capturedBody.toString()).toContain('txtsenha');
      expect(capturedBody.toString()).toContain('myuser');
      expect(capturedBody.toString()).toContain('mypass');
    });

    it('should use correct login URL', async () => {
      let capturedUrl = null;

      global.fetch = jest.fn()
        .mockImplementation(async (url, options) => {
          capturedUrl = url;

          return {
            ok: true,
            headers: {
              get: () => 'PHPSESSID=test',
              raw: () => ({ 'set-cookie': ['PHPSESSID=test'] })
            },
            text: async () => '<html>Dashboard</html>'
          };
        });

      const { login } = await import('../utils/gabinete-client.js');
      await login('user', 'pass');

      expect(capturedUrl).toContain('gabineteonline1.com.br/flaviovalle');
    });
  });

  describe('submitRegistration function', () => {
    it('should export submitRegistration function', async () => {
      const module = await import('../utils/gabinete-client.js');
      expect(module.submitRegistration).toBeDefined();
      expect(typeof module.submitRegistration).toBe('function');
    });

    it('should send correct POST request with mapped fields', async () => {
      let capturedUrl = null;
      let capturedBody = null;
      let capturedMethod = null;

      global.fetch = jest.fn()
        .mockImplementation(async (url, options) => {
          capturedUrl = url;
          capturedBody = options.body;
          capturedMethod = options.method;

          return {
            ok: true,
            status: 200,
            text: async () => '<html>Success</html>'
          };
        });

      const mockCookies = ['PHPSESSID=abc123', 'session=xyz789'];
      const mockFormData = {
        nome: 'João Silva',
        celular: '(11)98765-4321',
        email: 'joao@example.com'
      };

      const { submitRegistration } = await import('../utils/gabinete-client.js');
      const result = await submitRegistration(mockCookies, mockFormData);

      // Verify URL
      expect(capturedUrl).toContain('gabineteonline1.com.br/flaviovalle/cadastroclientes_dados.php');

      // Verify method
      expect(capturedMethod).toBe('POST');

      // Verify body contains form data
      expect(capturedBody).toBeDefined();
      const bodyString = capturedBody.toString();
      expect(bodyString).toContain('nome');
      expect(bodyString).toContain('celular');
      expect(bodyString).toContain('João Silva');
      expect(bodyString).toContain('(11)98765-4321');

      // Verify result
      expect(result).toHaveProperty('success', true);
    });

    it('should include session cookies in request headers', async () => {
      let capturedHeaders = null;

      global.fetch = jest.fn()
        .mockImplementation(async (url, options) => {
          capturedHeaders = options.headers;

          return {
            ok: true,
            status: 200,
            text: async () => '<html>Success</html>'
          };
        });

      const mockCookies = ['PHPSESSID=abc123', 'session=xyz789'];
      const mockFormData = {
        nome: 'Test User',
        celular: '11999999999'
      };

      const { submitRegistration } = await import('../utils/gabinete-client.js');
      await submitRegistration(mockCookies, mockFormData);

      expect(capturedHeaders).toBeDefined();
      expect(capturedHeaders['Cookie'] || capturedHeaders['cookie']).toBeDefined();

      const cookieHeader = capturedHeaders['Cookie'] || capturedHeaders['cookie'];
      expect(cookieHeader).toContain('PHPSESSID=abc123');
      expect(cookieHeader).toContain('session=xyz789');
    });

    it('should return success when form is accepted by server', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '<html>Cadastro realizado com sucesso</html>'
        });

      const mockCookies = ['PHPSESSID=test'];
      const mockFormData = {
        nome: 'Test User',
        celular: '11999999999'
      };

      const { submitRegistration } = await import('../utils/gabinete-client.js');
      const result = await submitRegistration(mockCookies, mockFormData);

      expect(result).toEqual({ success: true });
    });

    it('should return failure object when form is rejected by server', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () => '<html>Erro: CPF inválido</html>'
        });

      const mockCookies = ['PHPSESSID=test'];
      const mockFormData = {
        nome: 'Test User',
        celular: '11999999999',
        cpf: 'invalid'
      };

      const { submitRegistration } = await import('../utils/gabinete-client.js');
      const result = await submitRegistration(mockCookies, mockFormData);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error: ECONNREFUSED'));

      const mockCookies = ['PHPSESSID=test'];
      const mockFormData = {
        nome: 'Test User',
        celular: '11999999999'
      };

      const { submitRegistration } = await import('../utils/gabinete-client.js');
      const result = await submitRegistration(mockCookies, mockFormData);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Network error');
    });
  });
});
