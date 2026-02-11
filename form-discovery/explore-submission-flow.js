#!/usr/bin/env node

/**
 * EXPLORATION SCRIPT: Discover gabineteonline submission mechanism
 *
 * Goals:
 * 1. Intercept network requests when form is submitted
 * 2. Identify the endpoint, method, and payload format
 * 3. Check for API documentation or endpoints
 * 4. Determine if we can POST directly or need browser automation
 */

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { decryptCredentials } from './utils/decrypt-credentials.js';
import chalk from 'chalk';
import fs from 'fs/promises';

chromium.use(StealthPlugin());

async function exploreSubmissionFlow() {
  let browser = null;

  try {
    console.log(chalk.blue('='.repeat(70)));
    console.log(chalk.blue('  🔍 EXPLORING GABINETEONLINE SUBMISSION MECHANISM'));
    console.log(chalk.blue('='.repeat(70)));

    const credentials = decryptCredentials();

    // Launch browser with network interception
    console.log(chalk.cyan('\n🚀 Launching browser with network monitoring...'));
    browser = await chromium.launch({
      headless: false,
      slowMo: 500,
      devtools: true,
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

    // Capture all network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        resourceType: request.resourceType(),
        headers: request.headers(),
        postData: request.postData()
      });
    });

    page.on('response', async response => {
      const request = response.request();
      try {
        networkRequests.push({
          timestamp: new Date().toISOString(),
          type: 'response',
          method: request.method(),
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: await response.text().catch(() => '[Binary or unavailable]')
        });
      } catch (error) {
        // Some responses can't be read
      }
    });

    // =================================================================
    // STEP 1: Login
    // =================================================================
    console.log(chalk.cyan('\n📋 STEP 1: Logging in to gabineteonline...'));
    await page.goto('https://www.gabineteonline1.com.br/flaviovalle/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    const usernameField = page.locator('input[name="txtusuario"]').first();
    const passwordField = page.locator('input[name="txtsenha"]').first();

    await usernameField.fill(credentials.gabineteUsername);
    await passwordField.fill(credentials.gabinetePassword);

    const submitButton = page.locator('button:has-text("Entrar")').first();
    await submitButton.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log(chalk.green('✓ Logged in successfully'));
    console.log(chalk.gray(`  Current URL: ${page.url()}`));

    // =================================================================
    // STEP 2: Navigate to registration form
    // =================================================================
    console.log(chalk.cyan('\n📋 STEP 2: Navigating to registration form...'));

    // Find "Cadastro" link
    const cadastroLink = page.locator('a:has-text("Cadastro"), a:has-text("Cadastrar")').first();
    await cadastroLink.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log(chalk.green('✓ Registration form loaded'));
    console.log(chalk.gray(`  Form URL: ${page.url()}`));

    await page.screenshot({ path: 'output/exploration-01-form.png', fullPage: true });

    // =================================================================
    // STEP 3: Analyze form structure
    // =================================================================
    console.log(chalk.cyan('\n📋 STEP 3: Analyzing form structure...'));

    const formAnalysis = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));

      return forms.map(form => ({
        action: form.action,
        method: form.method,
        enctype: form.enctype,
        id: form.id,
        name: form.name,
        inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
          name: input.name,
          type: input.type,
          id: input.id,
          required: input.required
        }))
      }));
    });

    console.log(chalk.green(`✓ Found ${formAnalysis.length} form(s)`));
    formAnalysis.forEach((form, idx) => {
      console.log(chalk.cyan(`\n  Form ${idx}:`));
      console.log(chalk.gray(`    Action: ${form.action || '(none - JavaScript handling)'}`));
      console.log(chalk.gray(`    Method: ${form.method.toUpperCase() || 'GET'}`));
      console.log(chalk.gray(`    Fields: ${form.inputs.length}`));
    });

    await fs.writeFile('output/exploration-form-structure.json', JSON.stringify(formAnalysis, null, 2));

    // =================================================================
    // STEP 4: Check for API endpoints
    // =================================================================
    console.log(chalk.cyan('\n📋 STEP 4: Checking for API endpoints...'));

    // Common API endpoint patterns
    const apiPatterns = [
      '/api/',
      '/rest/',
      '/v1/',
      '/webservice/',
      '/ws/',
      'api.gabineteonline',
      '/json',
      '/ajax/'
    ];

    const apiRequests = networkRequests.filter(req =>
      apiPatterns.some(pattern => req.url.includes(pattern))
    );

    if (apiRequests.length > 0) {
      console.log(chalk.green(`✓ Found ${apiRequests.length} potential API request(s)`));
      apiRequests.forEach(req => {
        console.log(chalk.gray(`  ${req.method} ${req.url}`));
      });
    } else {
      console.log(chalk.yellow('⚠ No obvious API endpoints detected'));
    }

    // =================================================================
    // STEP 5: Interactive test - fill form and observe
    // =================================================================
    console.log(chalk.cyan('\n📋 STEP 5: Filling form with test data...'));
    console.log(chalk.yellow('⚠ IMPORTANT: Using TEST DATA (not real submission)'));

    // Get all form fields
    const fields = await page.locator('form input[name], form select[name], form textarea[name]').all();
    console.log(chalk.gray(`  Found ${fields.length} named fields`));

    // Fill with test data
    const testData = {
      nome: 'Test User',
      telefone: '(11) 98765-4321',
      email: 'test@example.com',
      cpf: '123.456.789-00'
    };

    for (const field of fields) {
      try {
        const name = await field.getAttribute('name');
        const type = await field.getAttribute('type');

        // Fill text/email fields with test data
        if (type === 'text' || type === 'email' || type === 'tel') {
          const testValue = testData[name] || `Test ${name}`;
          await field.fill(testValue);
          console.log(chalk.gray(`    Filled: ${name} = "${testValue}"`));
        }
      } catch (error) {
        // Skip fields that can't be filled
      }
    }

    await page.screenshot({ path: 'output/exploration-02-filled-form.png', fullPage: true });

    // =================================================================
    // STEP 6: Pause for manual exploration
    // =================================================================
    console.log(chalk.cyan('\n📋 STEP 6: PAUSING FOR MANUAL EXPLORATION'));
    console.log(chalk.blue('='.repeat(70)));
    console.log(chalk.yellow('\n🛑 BROWSER PAUSED'));
    console.log(chalk.yellow('\nManual tasks to perform:'));
    console.log(chalk.yellow('  1. Open DevTools → Network tab'));
    console.log(chalk.yellow('  2. Click the submit button (or inspect without submitting)'));
    console.log(chalk.yellow('  3. Observe what requests are made'));
    console.log(chalk.yellow('  4. Note the endpoint, method, and payload format'));
    console.log(chalk.yellow('  5. Check for any AJAX/fetch requests'));
    console.log(chalk.yellow('\n💡 Questions to answer:'));
    console.log(chalk.yellow('  - Does it POST to a form action URL?'));
    console.log(chalk.yellow('  - Does it make an AJAX call to an API?'));
    console.log(chalk.yellow('  - What format is the data? (form-data, JSON, etc.)'));
    console.log(chalk.yellow('  - Is there CSRF protection or tokens needed?'));
    console.log(chalk.yellow('\nPress the Play button in Playwright Inspector to continue...'));

    await page.pause();

    // =================================================================
    // STEP 7: Analyze captured network traffic
    // =================================================================
    console.log(chalk.cyan('\n📋 STEP 7: Analyzing captured network traffic...'));

    // Filter for likely submission requests
    const postRequests = networkRequests.filter(req =>
      req.method === 'POST' &&
      !req.url.includes('google') &&
      !req.url.includes('cloudflare') &&
      !req.url.includes('analytics')
    );

    console.log(chalk.green(`✓ Captured ${networkRequests.length} total requests`));
    console.log(chalk.green(`✓ Found ${postRequests.length} POST request(s)`));

    if (postRequests.length > 0) {
      console.log(chalk.cyan('\n  POST Requests:'));
      postRequests.forEach(req => {
        console.log(chalk.gray(`    ${req.url}`));
        if (req.postData) {
          console.log(chalk.gray(`      Data: ${req.postData.substring(0, 200)}...`));
        }
      });
    }

    // Save full network log
    await fs.writeFile('output/exploration-network-log.json', JSON.stringify(networkRequests, null, 2));
    console.log(chalk.green('\n✓ Network log saved: output/exploration-network-log.json'));

    // =================================================================
    // SUMMARY
    // =================================================================
    console.log(chalk.blue('\n' + '='.repeat(70)));
    console.log(chalk.green('✅ EXPLORATION COMPLETE'));
    console.log(chalk.blue('='.repeat(70)));
    console.log(chalk.cyan('\n📊 Generated Files:'));
    console.log(chalk.gray('  - output/exploration-01-form.png'));
    console.log(chalk.gray('  - output/exploration-02-filled-form.png'));
    console.log(chalk.gray('  - output/exploration-form-structure.json'));
    console.log(chalk.gray('  - output/exploration-network-log.json'));
    console.log(chalk.cyan('\n🔍 Next Steps:'));
    console.log(chalk.gray('  1. Review network log for submission endpoint'));
    console.log(chalk.gray('  2. Identify required fields and format'));
    console.log(chalk.gray('  3. Determine if Wix can POST directly or needs automation'));
    console.log(chalk.gray('  4. Design backend/gabineteonline-api.jsw based on findings'));

    console.log(chalk.yellow('\n🔒 Press Ctrl+C to close browser and exit'));
    await new Promise(() => {}); // Keep open

  } catch (error) {
    console.error(chalk.red('\n💥 ERROR:'), error.message);
    console.error(chalk.gray(error.stack));
  } finally {
    // Don't close - let user close manually
  }
}

exploreSubmissionFlow().catch(console.error);
