#!/usr/bin/env node

import { decryptCredentials } from './utils/decrypt-credentials.js';
import { loginToGabineteWithStealth } from './utils/browser-setup-stealth.js';
import { findRegistrationForm } from './utils/form-navigator.js';
import { generateWixMapping } from './utils/wix-mapper.js';
import { Logger } from './utils/logger.js';
import fs from 'fs/promises';
import chalk from 'chalk';

// Parse CLI arguments
const args = process.argv.slice(2);
const headless = args.includes('--headless');
const headful = args.includes('--headful');
const logLevelArg = args.find(arg => arg.startsWith('--log-level='));
const logLevel = logLevelArg ? logLevelArg.split('=')[1] : 'debug';

// Initialize logger
const logger = new Logger(logLevel);

async function main() {
  let browser = null;
  let page = null;

  try {
    await logger.log(chalk.blue('='.repeat(60)), 'standard');
    await logger.log(chalk.blue('  Form Discovery: gabineteonline → Wix Integration'), 'standard');
    await logger.log(chalk.blue('='.repeat(60)), 'standard');

    // Step 1: Load credentials
    await logger.log('\n📋 Step 1: Loading encrypted credentials...', 'standard');
    const credentials = decryptCredentials();
    await logger.log(chalk.green('✓ Credentials loaded successfully'), 'standard');
    await logger.log(`  - Using credentials for: ${credentials.gabineteUsername}`, 'debug');

    // Step 2: Launch browser and login
    await logger.log('\n🌐 Step 2: Launching stealth browser and logging in...', 'standard');
    const loginResult = await loginToGabineteWithStealth(
      {
        username: credentials.gabineteUsername,
        password: credentials.gabinetePassword
      },
      {
        headless: headless ? true : (headful ? false : false), // Default headful
        timeout: 30000,
        retries: 3
      }
    );

    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }

    browser = loginResult.browser;
    page = loginResult.page;
    await logger.log(chalk.green('✓ Login successful'), 'standard');
    await logger.log(`  - Current URL: ${loginResult.url}`, 'debug');

    // Step 3: Find registration form
    await logger.log('\n🔍 Step 3: Searching for registration form...', 'standard');
    const formResult = await findRegistrationForm(page);

    if (!formResult.success) {
      await logger.log(chalk.yellow('⚠ Could not find registration form automatically'), 'standard');
      await logger.log('Available navigation links:', 'debug');
      formResult.availableLinks?.forEach(link => {
        logger.log(`  - ${link}`, 'debug');
      });
      throw new Error('Registration form not found. Check available links in logs.');
    }

    await logger.log(chalk.green('✓ Registration form found'), 'standard');
    await logger.log(`  - Keyword: "${formResult.keyword}"`, 'debug');
    await logger.log(`  - Form URL: ${formResult.url}`, 'debug');

    // Screenshot of form page
    await page.screenshot({ path: 'output/03-registration-form.png', fullPage: true });
    await logger.log('  - Screenshot saved: output/03-registration-form.png', 'debug');

    // Step 4: Extract form fields
    await logger.log('\n📝 Step 4: Extracting form fields...', 'standard');

    const forms = await page.locator('form').all();
    const allFields = [];

    for (const form of forms) {
      const inputs = await form.locator('input, select, textarea').all();

      for (const input of inputs) {
        try {
          const name = await input.getAttribute('name');
          const type = await input.getAttribute('type') || 'text';
          const required = await input.getAttribute('required') !== null;
          const maxLength = await input.getAttribute('maxlength');
          const pattern = await input.getAttribute('pattern');
          const placeholder = await input.getAttribute('placeholder');

          // Try to find label
          const id = await input.getAttribute('id');
          let label = '';
          if (id) {
            const labelElement = await form.locator(`label[for="${id}"]`).first();
            label = await labelElement.textContent().catch(() => '');
          }
          if (!label) {
            label = placeholder || name || type;
          }

          if (name) {
            allFields.push({
              name,
              type,
              label: label.trim(),
              required,
              maxLength: maxLength ? parseInt(maxLength) : null,
              pattern: pattern || null,
              placeholder: placeholder || null
            });
          }
        } catch (error) {
          // Skip fields that can't be processed
          await logger.log(`  - Skipped field: ${error.message}`, 'debug');
        }
      }
    }

    if (allFields.length === 0) {
      throw new Error('No form fields found on the page');
    }

    await logger.log(chalk.green(`✓ Extracted ${allFields.length} fields`), 'standard');

    const requiredCount = allFields.filter(f => f.required).length;
    const optionalCount = allFields.length - requiredCount;
    await logger.log(`  - Required: ${requiredCount}`, 'debug');
    await logger.log(`  - Optional: ${optionalCount}`, 'debug');

    // Step 5: Generate JSON schema
    await logger.log('\n💾 Step 5: Generating JSON schema...', 'standard');

    const schema = {
      discoveredAt: new Date().toISOString(),
      url: formResult.url,
      metadata: {
        totalFields: allFields.length,
        requiredFields: requiredCount,
        optionalFields: optionalCount
      },
      fields: allFields
    };

    const schemaPath = 'output/gabineteonline-schema.json';
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf8');
    await logger.log(chalk.green(`✓ Schema saved: ${schemaPath}`), 'standard');

    // Step 6: Generate Wix mapping document
    await logger.log('\n📄 Step 6: Generating Wix mapping document...', 'standard');

    const mapping = generateWixMapping(schema);
    const mappingPath = 'output/wix-mapping.md';
    await fs.writeFile(mappingPath, mapping, 'utf8');
    await logger.log(chalk.green(`✓ Mapping saved: ${mappingPath}`), 'standard');

    // Step 7: Summary
    await logger.log('\n' + chalk.blue('='.repeat(60)), 'standard');
    await logger.log(chalk.green('✅ Form Discovery Complete!'), 'standard');
    await logger.log(chalk.blue('='.repeat(60)), 'standard');
    await logger.log(`\n📊 Summary:`, 'standard');
    await logger.log(`  - Total fields discovered: ${allFields.length}`, 'standard');
    await logger.log(`  - Required fields: ${requiredCount}`, 'standard');
    await logger.log(`  - Optional fields: ${optionalCount}`, 'standard');
    await logger.log(`  - Schema: ${schemaPath}`, 'standard');
    await logger.log(`  - Wix mapping: ${mappingPath}`, 'standard');
    await logger.log(`\n🎯 Next steps:`, 'standard');
    await logger.log(`  1. Review ${mappingPath} for field mappings`, 'standard');
    await logger.log(`  2. Create Wix form with required fields`, 'standard');
    await logger.log(`  3. Implement automatic Wix → gabineteonline submission`, 'standard');

  } catch (error) {
    await logger.error('Form discovery failed', error);

    // Take error screenshot
    if (page) {
      try {
        await page.screenshot({ path: 'output/04-error.png', fullPage: true });
        await logger.log('Error screenshot saved: output/04-error.png', 'standard');
      } catch (screenshotError) {
        // Ignore screenshot errors
      }
    }

    process.exit(1);
  } finally {
    // Clean up
    if (browser) {
      await logger.log('\n🧹 Closing browser...', 'debug');
      await browser.close();
      await logger.log(chalk.green('✓ Browser closed'), 'debug');
    }
  }
}

// Run main function
main().catch(async (error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
