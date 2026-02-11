import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { decryptCredentials } from './utils/decrypt-credentials.js';

chromium.use(StealthPlugin());

async function debugLogin() {
  const credentials = decryptCredentials();
  console.log('Username:', credentials.gabineteUsername);
  console.log('Password length:', credentials.gabinetePassword?.length);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = await browser.newPage();
  await page.goto('https://www.gabineteonline1.com.br/flaviovalle/', { waitUntil: 'domcontentloaded' });

  console.log('\nWaiting 3 seconds for page to load...');
  await page.waitForTimeout(3000);

  // Find fields - use more specific selectors like FGV scraper
  const usernameSelector = 'input[name="txtusuario"], input[id="txtusuario"], input[placeholder*="usuário"], input[type="text"]';
  const passwordSelector = 'input[name="txtsenha"], input[id="txtsenha"], input[placeholder*="enha"], input[type="password"]';

  console.log('\nLooking for username field...');
  const usernameField = page.locator(usernameSelector).first();
  await usernameField.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Username field found');

  console.log('\nLooking for password field...');
  const passwordField = page.locator(passwordSelector).first();
  await passwordField.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Password field found');

  console.log('\nFilling username...');
  await usernameField.click();
  await page.waitForTimeout(500);
  await usernameField.fill(credentials.gabineteUsername);
  console.log('✓ Username filled');

  console.log('\nFilling password...');
  // Use pressSequentially instead of click+fill to avoid JavaScript event interception
  await passwordField.focus();
  await page.waitForTimeout(300);
  await passwordField.pressSequentially(credentials.gabinetePassword, { delay: 100 });
  console.log('✓ Password filled');

  console.log('\nWaiting 2 seconds before clicking submit...');
  await page.waitForTimeout(2000);

  console.log('\nLooking for submit button...');
  const submitButton = page.locator('button:has-text("Entrar")').first();
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✓ Submit button found');

  console.log('\nClicking submit...');
  await submitButton.click();
  console.log('✓ Submit clicked');

  console.log('\nWaiting 5 seconds to see result...');
  await page.waitForTimeout(5000);

  console.log('\nCurrent URL:', page.url());
  await page.screenshot({ path: 'output/debug-after-submit.png', fullPage: true });
  console.log('Screenshot saved: output/debug-after-submit.png');

  console.log('\nBrowser will stay open. Press Ctrl+C to close.');
  await new Promise(() => {}); // Keep browser open
}

debugLogin().catch(console.error);
