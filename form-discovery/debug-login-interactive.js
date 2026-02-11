#!/usr/bin/env node

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chalk from 'chalk';
import fs from 'fs/promises';
import { decryptCredentials } from './utils/decrypt-credentials.js';

chromium.use(StealthPlugin());

async function main() {
  let browser = null;
  let page = null;

  try {
    // Create debug-output directory
    await fs.mkdir('debug-output', { recursive: true });

    console.log(chalk.blue('='.repeat(70)));
    console.log(chalk.blue('  🔍 INTERACTIVE PASSWORD FIELD DEBUGGER'));
    console.log(chalk.blue('='.repeat(70)));

    // Launch browser
    console.log(chalk.cyan('\n🚀 Launching browser...'));
    browser = await chromium.launch({
      headless: false,
      slowMo: 300,
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

    page = await context.newPage();

    // =================================================================
    // PHASE 1: HTML STRUCTURE DISCOVERY
    // =================================================================
    console.log(chalk.blue('\n' + '='.repeat(70)));
    console.log(chalk.blue('📋 PHASE 1: HTML STRUCTURE DISCOVERY'));
    console.log(chalk.blue('='.repeat(70)));

    console.log(chalk.cyan('\nNavigating to login page...'));
    await page.goto('https://www.gabineteonline1.com.br/flaviovalle/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    console.log(chalk.green('✓ Page loaded'));

    console.log(chalk.cyan('\nExtracting form HTML structure...'));
    const formData = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));

      return forms.map((form, formIndex) => ({
        formIndex,
        formHTML: form.outerHTML.substring(0, 5000),
        inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
          tagName: input.tagName.toLowerCase(),
          type: input.type || '',
          name: input.name || '',
          id: input.id || '',
          className: input.className || '',
          placeholder: input.placeholder || '',
          autocomplete: input.autocomplete || '',
          required: input.required,
          disabled: input.disabled,
          visible: input.offsetParent !== null,
          value: input.value,
          attributes: Array.from(input.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          }))
        }))
      }));
    });

    await fs.writeFile('debug-output/form-structure.json', JSON.stringify(formData, null, 2));
    console.log(chalk.green(`✓ Extracted ${formData.length} form(s)`));
    console.log(chalk.gray('  Saved to: debug-output/form-structure.json'));

    // Display input summary
    formData.forEach((form, idx) => {
      console.log(chalk.cyan(`\n  Form ${idx}:`));
      form.inputs.forEach((input, inputIdx) => {
        const attrs = [
          input.type ? `type="${input.type}"` : '',
          input.name ? `name="${input.name}"` : '',
          input.id ? `id="${input.id}"` : '',
          input.placeholder ? `placeholder="${input.placeholder}"` : ''
        ].filter(Boolean).join(' ');
        console.log(chalk.gray(`    Input ${inputIdx}: <${input.tagName} ${attrs}>`));
      });
    });

    // =================================================================
    // PHASE 2: SYSTEMATIC SELECTOR TESTING
    // =================================================================
    console.log(chalk.blue('\n' + '='.repeat(70)));
    console.log(chalk.blue('🎯 PHASE 2: SYSTEMATIC SELECTOR TESTING'));
    console.log(chalk.blue('='.repeat(70)));

    const selectorTests = [
      { name: 'type=password', selector: 'input[type="password"]' },
      { name: 'placeholder*=enha', selector: 'input[placeholder*="enha"]' },
      { name: 'placeholder*=senha', selector: 'input[placeholder*="senha"]' },
      { name: 'placeholder*=password', selector: 'input[placeholder*="password"]' },
      { name: 'name=password', selector: 'input[name="password"]' },
      { name: 'name=senha', selector: 'input[name="senha"]' },
      { name: 'name*=pass', selector: 'input[name*="pass"]' },
      { name: 'id*=password', selector: 'input[id*="password"]' },
      { name: 'id*=senha', selector: 'input[id*="senha"]' },
      { name: 'autocomplete=current-password', selector: 'input[autocomplete="current-password"]' },
      { name: 'class*=password', selector: 'input[class*="password"]' },
      { name: 'class*=senha', selector: 'input[class*="senha"]' },
      { name: 'second-input', selector: 'form input:nth-of-type(2)' },
      { name: 'after-username', selector: 'input[type="text"] + input, input[type="text"] ~ input' },
    ];

    console.log(chalk.cyan(`\nTesting ${selectorTests.length} selector strategies...\n`));
    const selectorResults = [];

    for (const test of selectorTests) {
      try {
        const count = await page.locator(test.selector).count();

        if (count > 0) {
          const locator = page.locator(test.selector).first();
          const info = await locator.evaluate(el => ({
            tagName: el.tagName,
            type: el.type,
            name: el.name,
            id: el.id,
            placeholder: el.placeholder,
            visible: el.offsetParent !== null,
            enabled: !el.disabled,
            value: el.value
          }));

          selectorResults.push({
            ...test,
            found: true,
            count,
            elementInfo: info
          });

          console.log(chalk.green(`✓ ${test.name.padEnd(30)} Found ${count} element(s)`));
        } else {
          selectorResults.push({ ...test, found: false, count: 0 });
          console.log(chalk.red(`✗ ${test.name.padEnd(30)} No elements found`));
        }
      } catch (error) {
        selectorResults.push({ ...test, found: false, count: 0, error: error.message });
        console.log(chalk.red(`✗ ${test.name.padEnd(30)} Error: ${error.message}`));
      }
    }

    await fs.writeFile('debug-output/selector-results.json', JSON.stringify(selectorResults, null, 2));
    console.log(chalk.green(`\n✓ Selector test results saved`));
    console.log(chalk.gray('  Saved to: debug-output/selector-results.json'));

    // =================================================================
    // PHASE 3: FILLING METHOD TESTING
    // =================================================================
    console.log(chalk.blue('\n' + '='.repeat(70)));
    console.log(chalk.blue('💉 PHASE 3: FILLING METHOD TESTING'));
    console.log(chalk.blue('='.repeat(70)));

    const fillingMethods = [
      {
        name: 'fill',
        test: async (locator, password) => {
          await locator.fill(password);
          return await locator.inputValue();
        }
      },
      {
        name: 'pressSequentially',
        test: async (locator, password) => {
          await locator.pressSequentially(password, { delay: 50 });
          return await locator.inputValue();
        }
      },
      {
        name: 'click-then-fill',
        test: async (locator, password) => {
          await locator.click();
          await page.waitForTimeout(500);
          await locator.fill(password);
          return await locator.inputValue();
        }
      },
      {
        name: 'focus-then-type',
        test: async (locator, password) => {
          await locator.focus();
          await page.waitForTimeout(300);
          await locator.pressSequentially(password, { delay: 100 });
          return await locator.inputValue();
        }
      },
      {
        name: 'javascript-direct',
        test: async (locator, password) => {
          await locator.evaluate((el, pass) => {
            el.value = pass;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, password);
          return await locator.inputValue();
        }
      },
      {
        name: 'javascript-typing',
        test: async (locator, password) => {
          await locator.evaluate((el, pass) => {
            el.focus();
            el.value = '';
            for (let i = 0; i < pass.length; i++) {
              const char = pass[i];
              el.value += char;
              el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
              el.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
            }
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, password);
          return await locator.inputValue();
        }
      }
    ];

    const testPassword = 'TestPass123!';
    const fillingResults = [];

    const workingSelectors = selectorResults.filter(r => r.found);
    console.log(chalk.cyan(`\nTesting ${fillingMethods.length} filling methods on ${workingSelectors.length} working selectors...\n`));

    for (const selectorResult of workingSelectors) {
      console.log(chalk.cyan(`\n→ Testing selector: ${selectorResult.name}`));

      for (const method of fillingMethods) {
        try {
          const locator = page.locator(selectorResult.selector).first();

          // Clear field
          await locator.clear().catch(() => {});
          await page.waitForTimeout(200);

          // Try filling
          const resultValue = await method.test(locator, testPassword);
          const success = resultValue === testPassword;

          // Screenshot
          await page.screenshot({
            path: `debug-output/fill-${selectorResult.name}-${method.name}.png`
          });

          fillingResults.push({
            selector: selectorResult.name,
            selectorString: selectorResult.selector,
            method: method.name,
            success: success,
            expectedLength: testPassword.length,
            actualLength: resultValue.length,
            matches: success
          });

          if (success) {
            console.log(chalk.green(`  ✓ ${method.name.padEnd(20)} SUCCESS`));
          } else {
            console.log(chalk.yellow(`  ⚠ ${method.name.padEnd(20)} PARTIAL (${resultValue.length}/${testPassword.length} chars)`));
          }

        } catch (error) {
          fillingResults.push({
            selector: selectorResult.name,
            selectorString: selectorResult.selector,
            method: method.name,
            success: false,
            error: error.message
          });
          console.log(chalk.red(`  ✗ ${method.name.padEnd(20)} ERROR - ${error.message.substring(0, 50)}`));
        }
      }
    }

    await fs.writeFile('debug-output/filling-results.json', JSON.stringify(fillingResults, null, 2));
    console.log(chalk.green(`\n✓ Filling test results saved`));
    console.log(chalk.gray('  Saved to: debug-output/filling-results.json'));

    // =================================================================
    // PHASE 4: INTERACTIVE DEBUGGING (if needed)
    // =================================================================
    const workingCombinations = fillingResults.filter(r => r.success);

    if (workingCombinations.length === 0) {
      console.log(chalk.blue('\n' + '='.repeat(70)));
      console.log(chalk.blue('🔍 PHASE 4: INTERACTIVE DEBUGGING MODE'));
      console.log(chalk.blue('='.repeat(70)));
      console.log(chalk.yellow('\n⚠ No automatic solution found. Entering interactive mode.'));
      console.log(chalk.yellow('\nThe browser is now paused. You can:'));
      console.log(chalk.yellow('  1. Inspect elements with DevTools (F12)'));
      console.log(chalk.yellow('  2. Try filling the password field manually'));
      console.log(chalk.yellow('  3. Use the Playwright Inspector'));
      console.log(chalk.yellow('  4. Open Console and use window.debugHelpers'));
      console.log(chalk.yellow('\nHelpers in browser console:'));
      console.log(chalk.yellow('  - window.debugHelpers.getAllInputs()'));
      console.log(chalk.yellow('  - window.debugHelpers.getPasswordFields()'));
      console.log(chalk.yellow('  - window.debugHelpers.testFill(selector, "test")'));

      await page.evaluate(() => {
        window.debugHelpers = {
          getAllInputs: () => {
            return Array.from(document.querySelectorAll('input')).map((el, i) => ({
              index: i,
              type: el.type,
              name: el.name,
              id: el.id,
              placeholder: el.placeholder,
              className: el.className
            }));
          },
          getPasswordFields: () => {
            return Array.from(document.querySelectorAll('input[type="password"], input[placeholder*="senha"]'));
          },
          testFill: (selector, value) => {
            const el = document.querySelector(selector);
            if (!el) return 'Element not found';
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return `Filled: ${el.value}`;
          }
        };
        console.log('%c Debug Helpers Loaded!', 'color: green; font-size: 14px; font-weight: bold');
      });

      await page.pause();
      console.log(chalk.cyan('\n✓ Resumed from interactive mode'));
    }

    // =================================================================
    // PHASE 5: REAL LOGIN VERIFICATION
    // =================================================================
    console.log(chalk.blue('\n' + '='.repeat(70)));
    console.log(chalk.blue('🧪 PHASE 5: REAL LOGIN VERIFICATION'));
    console.log(chalk.blue('='.repeat(70)));

    const bestSolution = workingCombinations[0] || {
      selectorString: 'input[type="password"]',
      method: 'pressSequentially'
    };

    if (workingCombinations.length > 0) {
      console.log(chalk.green(`\n✓ Found ${workingCombinations.length} working combination(s)`));
      console.log(chalk.cyan(`  Using: ${bestSolution.selector} + ${bestSolution.method}`));
    } else {
      console.log(chalk.yellow('\n⚠ No working combination found - using fallback'));
      console.log(chalk.cyan(`  Fallback: ${bestSolution.selectorString} + ${bestSolution.method}`));
    }

    const credentials = decryptCredentials();
    console.log(chalk.cyan(`\nUsername: ${credentials.gabineteUsername}`));
    console.log(chalk.cyan(`Password length: ${credentials.gabinetePassword.length} characters`));

    console.log(chalk.cyan('\nReloading page for fresh state...'));
    await page.goto('https://www.gabineteonline1.com.br/flaviovalle/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    // Fill username
    console.log(chalk.cyan('\nFilling username...'));
    const usernameField = page.locator('input[name="txtusuario"], input[id="txtusuario"], input[type="text"], input[placeholder*="suário"]').first();
    await usernameField.waitFor({ state: 'visible', timeout: 5000 });
    await usernameField.fill(credentials.gabineteUsername);
    console.log(chalk.green('✓ Username filled'));

    // Fill password using best solution
    console.log(chalk.cyan(`\nFilling password (method: ${bestSolution.method})...`));
    const passwordField = page.locator(bestSolution.selectorString).first();
    await passwordField.waitFor({ state: 'visible', timeout: 5000 });

    if (bestSolution.method === 'fill') {
      await passwordField.fill(credentials.gabinetePassword);
    } else if (bestSolution.method === 'pressSequentially') {
      await passwordField.pressSequentially(credentials.gabinetePassword, { delay: 100 });
    } else if (bestSolution.method === 'click-then-fill') {
      await passwordField.click();
      await page.waitForTimeout(500);
      await passwordField.fill(credentials.gabinetePassword);
    } else if (bestSolution.method === 'focus-then-type') {
      await passwordField.focus();
      await page.waitForTimeout(300);
      await passwordField.pressSequentially(credentials.gabinetePassword, { delay: 100 });
    } else if (bestSolution.method === 'javascript-direct') {
      await passwordField.evaluate((el, pass) => {
        el.value = pass;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, credentials.gabinetePassword);
    } else if (bestSolution.method === 'javascript-typing') {
      await passwordField.evaluate((el, pass) => {
        el.focus();
        el.value = '';
        for (let i = 0; i < pass.length; i++) {
          const char = pass[i];
          el.value += char;
          el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        }
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, credentials.gabinetePassword);
    }

    // Verify filled
    const passwordValue = await passwordField.inputValue();
    if (passwordValue.length === credentials.gabinetePassword.length) {
      console.log(chalk.green(`✓ Password filled (${passwordValue.length} characters)`));
    } else {
      console.log(chalk.red(`✗ Password NOT filled correctly (${passwordValue.length}/${credentials.gabinetePassword.length} characters)`));
    }

    // Screenshot
    await page.screenshot({ path: 'debug-output/before-submit.png', fullPage: true });
    console.log(chalk.gray('  Screenshot: debug-output/before-submit.png'));

    // Submit
    console.log(chalk.cyan('\nClicking submit button...'));
    const submitButton = page.locator('button:has-text("Entrar"), button[type="submit"]').first();
    await submitButton.click();
    console.log(chalk.green('✓ Submit clicked'));

    // Wait and check result
    console.log(chalk.cyan('\nWaiting for result...'));
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'debug-output/after-submit.png', fullPage: true });
    console.log(chalk.gray('  Screenshot: debug-output/after-submit.png'));

    const finalUrl = page.url();
    console.log(chalk.cyan(`\nCurrent URL: ${finalUrl}`));

    // Check success
    const stillOnLogin = finalUrl.includes('login') || finalUrl === 'https://www.gabineteonline1.com.br/flaviovalle/';
    const hasErrorModal = await page.locator('text=/erro|error|campo.*obrigatório/i').count() > 0;

    console.log(chalk.blue('\n' + '='.repeat(70)));

    if (!stillOnLogin && !hasErrorModal) {
      console.log(chalk.green('✅ LOGIN SUCCESS!'));
      console.log(chalk.blue('='.repeat(70)));

      const workingSolution = {
        timestamp: new Date().toISOString(),
        url: 'https://www.gabineteonline1.com.br/flaviovalle/',
        passwordSelector: bestSolution.selectorString,
        passwordFillingMethod: bestSolution.method,
        usernameSelector: 'input[type="text"], input[placeholder*="suário"]',
        submitSelector: 'button:has-text("Entrar"), button[type="submit"]',
        verifiedWorking: true,
        finalUrl: finalUrl
      };

      await fs.writeFile('debug-output/WORKING-SOLUTION.json', JSON.stringify(workingSolution, null, 2));
      console.log(chalk.green('\n✓ Working solution saved to: debug-output/WORKING-SOLUTION.json'));
      console.log(chalk.cyan('\n🎯 Browser will stay open. Press Ctrl+C to close.'));
      await new Promise(() => {});

    } else {
      console.log(chalk.red('❌ LOGIN FAILED'));
      console.log(chalk.blue('='.repeat(70)));
      console.log(chalk.red(`Still on login page: ${stillOnLogin}`));
      console.log(chalk.red(`Error modal visible: ${hasErrorModal}`));
      console.log(chalk.yellow('\n⚠ Browser will stay open for inspection. Press Ctrl+C to close.'));
      await new Promise(() => {});
    }

  } catch (error) {
    console.error(chalk.red('\n💥 ERROR:'), error.message);
    console.error(chalk.gray(error.stack));

    if (page) {
      await page.screenshot({ path: 'debug-output/error.png', fullPage: true });
      console.log(chalk.gray('\nError screenshot: debug-output/error.png'));
    }

    console.log(chalk.yellow('\nBrowser will stay open for inspection. Press Ctrl+C to close.'));
    await new Promise(() => {});

  } finally {
    // Don't close - keep open for inspection
  }
}

main().catch(console.error);
