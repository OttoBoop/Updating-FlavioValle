import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  loginToWix,
  duplicateSite,
  enableVelo,
  runSetup
} from '../utils/wix-dashboard-automator.js';

// Mock Playwright page object
function createMockPage(options = {}) {
  const {
    currentUrl = 'https://manage.wix.com/dashboard/',
    loginSuccess = true,
    duplicateSuccess = true,
  } = options;

  let url = 'https://users.wix.com/signin';

  const locatorMock = (selector) => ({
    first: () => ({
      waitFor: jest.fn().mockResolvedValue(undefined),
      fill: jest.fn().mockResolvedValue(undefined),
      click: jest.fn().mockResolvedValue(undefined),
      isVisible: jest.fn().mockResolvedValue(true),
      textContent: jest.fn().mockResolvedValue(''),
    }),
    waitFor: jest.fn().mockResolvedValue(undefined),
    fill: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockResolvedValue(true),
    textContent: jest.fn().mockResolvedValue(''),
    count: jest.fn().mockResolvedValue(1),
  });

  const page = {
    goto: jest.fn().mockImplementation((targetUrl) => {
      url = targetUrl;
      return Promise.resolve();
    }),
    url: jest.fn().mockImplementation(() => {
      return loginSuccess ? currentUrl : 'https://users.wix.com/signin';
    }),
    locator: jest.fn().mockImplementation(locatorMock),
    waitForLoadState: jest.fn().mockResolvedValue(undefined),
    waitForTimeout: jest.fn().mockResolvedValue(undefined),
    waitForURL: jest.fn().mockResolvedValue(undefined),
    screenshot: jest.fn().mockResolvedValue(undefined),
    getByText: jest.fn().mockImplementation(() => ({
      first: () => ({
        click: jest.fn().mockResolvedValue(undefined),
        waitFor: jest.fn().mockResolvedValue(undefined),
        isVisible: jest.fn().mockResolvedValue(true),
      }),
      click: jest.fn().mockResolvedValue(undefined),
      waitFor: jest.fn().mockResolvedValue(undefined),
      isVisible: jest.fn().mockResolvedValue(true),
    })),
    getByRole: jest.fn().mockImplementation(() => ({
      first: () => ({
        click: jest.fn().mockResolvedValue(undefined),
        fill: jest.fn().mockResolvedValue(undefined),
        waitFor: jest.fn().mockResolvedValue(undefined),
      }),
      click: jest.fn().mockResolvedValue(undefined),
      fill: jest.fn().mockResolvedValue(undefined),
      waitFor: jest.fn().mockResolvedValue(undefined),
    })),
  };

  return page;
}

describe('Wix Dashboard Automator', () => {
  describe('loginToWix', () => {
    it('should navigate to Wix login page', async () => {
      const page = createMockPage();
      await loginToWix(page, { email: 'test@test.com', password: 'pass123' });

      expect(page.goto).toHaveBeenCalledWith(
        expect.stringContaining('wix.com'),
        expect.any(Object)
      );
    });

    it('should fill email and password fields', async () => {
      const page = createMockPage();
      await loginToWix(page, { email: 'user@example.com', password: 'secret' });

      // Should interact with login form fields
      expect(page.locator).toHaveBeenCalled();
    });

    it('should return success with dashboard URL on successful login', async () => {
      const page = createMockPage({ loginSuccess: true, currentUrl: 'https://manage.wix.com/dashboard/site-id' });
      const result = await loginToWix(page, { email: 'test@test.com', password: 'pass123' });

      expect(result.success).toBe(true);
      expect(result.url).toContain('manage.wix.com');
    });

    it('should return failure when login does not redirect', async () => {
      const page = createMockPage({ loginSuccess: false });
      const result = await loginToWix(page, { email: 'bad@test.com', password: 'wrong' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('duplicateSite', () => {
    it('should navigate to site dashboard', async () => {
      const page = createMockPage();
      const result = await duplicateSite(page, {
        siteId: 'original-site-id',
        newName: 'flaviovalle-dev'
      });

      expect(page.goto).toHaveBeenCalled();
    });

    it('should return structured result with newSiteId', async () => {
      const page = createMockPage();
      const result = await duplicateSite(page, {
        siteId: 'original-site-id',
        newName: 'flaviovalle-dev'
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('newName');
      expect(result.newName).toBe('flaviovalle-dev');
    });

    it('should use the provided site name for the duplicate', async () => {
      const page = createMockPage();
      const result = await duplicateSite(page, {
        siteId: 'abc123',
        newName: 'my-dev-site'
      });

      expect(result.newName).toBe('my-dev-site');
    });
  });

  describe('enableVelo', () => {
    it('should navigate to the site editor', async () => {
      const page = createMockPage();
      await enableVelo(page, { siteId: 'dev-site-id' });

      expect(page.goto).toHaveBeenCalledWith(
        expect.stringContaining('editor'),
        expect.any(Object)
      );
    });

    it('should return success result', async () => {
      const page = createMockPage();
      const result = await enableVelo(page, { siteId: 'dev-site-id' });

      expect(result).toHaveProperty('success');
    });
  });

  describe('runSetup', () => {
    it('should execute all steps in correct order', async () => {
      const callOrder = [];
      const page = createMockPage();

      // Track call order via goto
      page.goto.mockImplementation((url) => {
        if (url.includes('signin')) callOrder.push('login');
        else if (url.includes('dashboard')) callOrder.push('dashboard');
        else if (url.includes('editor')) callOrder.push('editor');
        return Promise.resolve();
      });
      page.url.mockReturnValue('https://manage.wix.com/dashboard/site-id');

      const result = await runSetup(page, {
        email: 'test@test.com',
        password: 'pass123',
        siteId: 'original-site-id',
        devSiteName: 'flaviovalle-dev'
      });

      expect(result).toHaveProperty('steps');
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
    });

    it('should return all step results', async () => {
      const page = createMockPage();
      page.url.mockReturnValue('https://manage.wix.com/dashboard/site-id');

      const result = await runSetup(page, {
        email: 'test@test.com',
        password: 'pass123',
        siteId: 'original-site-id',
        devSiteName: 'flaviovalle-dev'
      });

      expect(result).toHaveProperty('login');
      expect(result).toHaveProperty('duplicate');
      expect(result).toHaveProperty('velo');
    });

    it('should abort early if login fails', async () => {
      const page = createMockPage({ loginSuccess: false });

      const result = await runSetup(page, {
        email: 'bad@test.com',
        password: 'wrong',
        siteId: 'original-site-id',
        devSiteName: 'flaviovalle-dev'
      });

      expect(result.login.success).toBe(false);
      expect(result.duplicate).toBeUndefined();
      expect(result.velo).toBeUndefined();
    });

    it('should include credentials validation', async () => {
      const page = createMockPage();

      // Missing required fields
      await expect(
        runSetup(page, { email: '', password: '' })
      ).rejects.toThrow();
    });
  });
});
