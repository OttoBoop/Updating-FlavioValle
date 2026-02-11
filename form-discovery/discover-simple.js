import { chromium } from 'playwright';
import { decryptCredentials } from './utils/decrypt-credentials.js';

console.log('\n🔍 Starting gabineteonline login...\n');

const credentials = decryptCredentials();
console.log('✅ Credentials loaded for:', credentials.gabineteEmail);

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('🌐 Navigating to https://www.gabineteonline1.com.br/flaviovalle/\n');
await page.goto('https://www.gabineteonline1.com.br/flaviovalle/');

console.log('⏳ Waiting for page to load...\n');
await page.waitForLoadState('networkidle');

console.log('📝 Page loaded. Looking for login fields...\n');

// Try to find and fill login fields
try {
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="usuario"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[name="senha"]').first();
  
  if (await emailInput.count() > 0) {
    console.log('✅ Found email field, filling...');
    await emailInput.fill(credentials.gabineteEmail);
  }
  
  if (await passwordInput.count() > 0) {
    console.log('✅ Found password field, filling...');
    await passwordInput.fill(credentials.gabinetePassword);
  }
  
  console.log('\n💡 Credentials filled! Check the browser window.');
  console.log('💡 You can now manually click login or press Enter here to try auto-submit...\n');
  
} catch (error) {
  console.log('⚠️  Could not auto-fill. Error:', error.message);
  console.log('💡 Please fill manually in the browser window.\n');
}

console.log('🔍 Browser will stay open. Press Ctrl+C when done exploring.\n');

// Keep script running
await new Promise(() => {});
