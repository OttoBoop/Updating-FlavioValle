import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

export async function loginToGabineteWithStealth(credentials, options = {}) {
  const {
    headless = false,
    timeout = 30000,
    baseUrl = 'https://www.gabineteonline1.com.br/flaviovalle/',
    retries = 3
  } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const browser = await chromium.launch({
        headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-sandbox'
        ]
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const page = await context.newPage();
      await page.goto(baseUrl, { timeout, waitUntil: 'domcontentloaded' });

      // Screenshot milestone
      await page.screenshot({ path: 'output/01-landing-page.png', fullPage: true });

      // Find and fill login form
      // Note: Use specific selectors to avoid the invisible decoy field (id="current-password")
      const usernameField = page.locator('input[name="txtusuario"], input[id="txtusuario"]').first();
      const passwordField = page.locator('input[name="txtsenha"], input[id="txtsenha"]').first();

      // Wait for fields to be visible and fill them
      await usernameField.waitFor({ state: 'visible', timeout });
      await usernameField.clear();
      await usernameField.fill(credentials.username);

      await passwordField.waitFor({ state: 'visible', timeout });
      await passwordField.clear();
      await passwordField.fill(credentials.password);

      // Small delay to ensure fields are filled
      await page.waitForTimeout(1000);

      // Submit (look for "Entrar" button or submit types)
      const submitButton = await page.locator('button:has-text("Entrar"), button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      // Wait for navigation
      await page.waitForLoadState('domcontentloaded', { timeout });

      // Screenshot after login
      await page.screenshot({ path: 'output/02-after-login.png', fullPage: true });

      // Verify login success (check URL changed from login page)
      const currentUrl = page.url();
      if (currentUrl.includes('login')) {
        throw new Error('Still on login page - login failed');
      }

      return { success: true, browser, page, url: currentUrl };

    } catch (error) {
      console.error(`Login attempt ${attempt}/${retries} failed: ${error.message}`);

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 2500; // 5s, 10s, 20s
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return { success: false, error: error.message };
      }
    }
  }
}
