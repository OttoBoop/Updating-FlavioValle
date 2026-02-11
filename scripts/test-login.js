#!/usr/bin/env node

/**
 * Test login to gabineteonline1.com.br with stored credentials
 */

import { chromium } from 'playwright';
import chalk from 'chalk';
import { loadCredentials } from './utils/credential-reader.js';

async function testLogin() {
  console.log(chalk.blue.bold('\n🔐 Testing gabineteonline1 Login\n'));

  let browser;
  try {
    // Load credentials
    console.log(chalk.yellow('Loading encrypted credentials...'));
    const credentials = loadCredentials();
    console.log(chalk.green('✅ Credentials loaded\n'));

    // Launch browser
    console.log(chalk.yellow('Launching browser...'));
    browser = await chromium.launch({
      headless: false,  // Show browser so you can see what's happening
      slowMo: 500       // Slow down so you can follow along
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to gabineteonline - flaviovalle subdirectory
    console.log(chalk.yellow('Navigating to gabineteonline1.com.br/flaviovalle...'));
    await page.goto('https://www.gabineteonline1.com.br/flaviovalle/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log(chalk.cyan('📸 Current URL: ' + page.url()));

    // Take screenshot before login
    await page.screenshot({ path: 'form-discovery/output/login-page.png', fullPage: true });
    console.log(chalk.gray('Screenshot saved: form-discovery/output/login-page.png\n'));

    // Look for login form
    console.log(chalk.yellow('Looking for login form...'));

    // Common login field selectors
    const possibleEmailSelectors = [
      'input[name="email"]',
      'input[name="username"]',
      'input[name="login"]',
      'input[type="email"]',
      'input[type="text"]',
      '#email',
      '#username',
      '#login'
    ];

    const possiblePasswordSelectors = [
      'input[name="password"]',
      'input[name="senha"]',
      'input[type="password"]',
      '#password',
      '#senha'
    ];

    let usernameField = null;
    let passwordField = null;

    // Try to find username field
    for (const selector of possibleEmailSelectors) {
      try {
        const field = await page.$(selector);
        if (field && await field.isVisible()) {
          usernameField = selector;
          console.log(chalk.green(`✅ Found username field: ${selector}`));
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }

    // Try to find password field
    for (const selector of possiblePasswordSelectors) {
      try {
        const field = await page.$(selector);
        if (field && await field.isVisible()) {
          passwordField = selector;
          console.log(chalk.green(`✅ Found password field: ${selector}`));
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }

    if (!usernameField || !passwordField) {
      console.log(chalk.yellow('\n⚠️  Could not auto-detect login fields.'));
      console.log(chalk.gray('This might mean:'));
      console.log(chalk.gray('  1. The site uses a different login flow'));
      console.log(chalk.gray('  2. Login is behind a button or modal'));
      console.log(chalk.gray('  3. Site structure is different than expected\n'));

      console.log(chalk.cyan('Current page title: ' + await page.title()));
      console.log(chalk.cyan('Waiting 10 seconds for you to inspect...\n'));

      await page.waitForTimeout(10000);
      await browser.close();

      console.log(chalk.yellow('\n💡 Next steps:'));
      console.log(chalk.gray('  1. Check the screenshot: form-discovery/output/login-page.png'));
      console.log(chalk.gray('  2. Manually inspect the login page'));
      console.log(chalk.gray('  3. We can update the script with correct selectors\n'));

      return;
    }

    // Fill in credentials
    console.log(chalk.yellow('\nAttempting login...'));
    await page.fill(usernameField, credentials.gabineteUsername);
    console.log(chalk.green('✅ Username entered'));

    await page.fill(passwordField, credentials.gabinetePassword);
    console.log(chalk.green('✅ Password entered'));

    // Look for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Entrar")',
      'button:has-text("Login")',
      'button:has-text("Acessar")'
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const button = await page.$(selector);
        if (button && await button.isVisible()) {
          submitButton = selector;
          console.log(chalk.green(`✅ Found submit button: ${selector}`));
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }

    if (submitButton) {
      await page.click(submitButton);
      console.log(chalk.green('✅ Submit clicked\n'));

      // Wait for navigation or error
      await page.waitForTimeout(3000);

      console.log(chalk.cyan('📸 After login URL: ' + page.url()));

      // Take screenshot after login attempt
      await page.screenshot({ path: 'form-discovery/output/after-login.png', fullPage: true });
      console.log(chalk.gray('Screenshot saved: form-discovery/output/after-login.png\n'));

      // Check for success indicators
      const currentUrl = page.url();
      const pageContent = await page.content();

      if (currentUrl !== 'https://gabineteonline1.com.br' && !pageContent.toLowerCase().includes('erro')) {
        console.log(chalk.green.bold('🎉 Login appears successful!'));
        console.log(chalk.gray(`   New URL: ${currentUrl}\n`));
      } else if (pageContent.toLowerCase().includes('erro') || pageContent.toLowerCase().includes('inválid')) {
        console.log(chalk.red('❌ Login failed - check credentials'));
        console.log(chalk.yellow('   Check the screenshot for error messages\n'));
      } else {
        console.log(chalk.yellow('⚠️  Login result unclear - check screenshots\n'));
      }

      // Keep browser open for 10 seconds so you can see
      console.log(chalk.gray('Keeping browser open for 10 seconds...\n'));
      await page.waitForTimeout(10000);
    }

    await browser.close();
    console.log(chalk.green('✅ Test complete\n'));

  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    if (browser) await browser.close();
    process.exit(1);
  }
}

testLogin();
