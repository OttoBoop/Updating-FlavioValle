#!/usr/bin/env node
/**
 * Quick field extraction — logs in, navigates to cadastro form,
 * takes a full-page screenshot, and extracts all fields in ONE
 * fast page.evaluate() call (no slow locator iteration).
 */

import { decryptCredentials } from './utils/decrypt-credentials.js';
import { loginToGabineteWithStealth } from './utils/browser-setup-stealth.js';
import fs from 'fs/promises';

async function main() {
  let browser = null;

  try {
    // 1. Credentials
    const creds = decryptCredentials();
    console.log('✓ Credentials loaded');

    // 2. Login
    console.log('Logging in...');
    const login = await loginToGabineteWithStealth(
      { username: creds.gabineteUsername, password: creds.gabinetePassword },
      { headless: false, timeout: 30000, retries: 3 }
    );
    if (!login.success) throw new Error(`Login failed: ${login.error}`);
    browser = login.browser;
    const page = login.page;
    console.log('✓ Logged in:', login.url);

    // 3. Navigate to cadastro form
    console.log('Navigating to cadastro...');
    const cadastroLink = page.locator('a:has-text("Cadastro")').first();
    await cadastroLink.click();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✓ On cadastro page:', page.url());

    // 4. Full-page screenshot
    await page.screenshot({ path: 'output/cadastro-full-page.png', fullPage: true });
    console.log('✓ Screenshot saved: output/cadastro-full-page.png');

    // 5. Extract ALL fields in one fast evaluate call
    console.log('Extracting fields...');
    const fields = await page.evaluate(() => {
      const results = [];
      const elements = document.querySelectorAll('input, select, textarea');

      elements.forEach(el => {
        const name = el.name || el.id;
        if (!name) return;
        // Skip hidden CSRF/token fields
        if (name.includes('csrf') || name.includes('token')) return;

        let label = '';
        // Try label[for]
        if (el.id) {
          const lbl = document.querySelector(`label[for="${el.id}"]`);
          if (lbl) label = lbl.textContent.trim();
        }
        // Try parent td/div text
        if (!label && el.closest('td')) {
          const prev = el.closest('td').previousElementSibling;
          if (prev) label = prev.textContent.trim();
        }
        if (!label) label = el.placeholder || name;

        let options = null;
        if (el.tagName === 'SELECT') {
          options = Array.from(el.options).map(o => ({
            value: o.value,
            text: o.textContent.trim()
          }));
        }

        results.push({
          name,
          type: el.type || el.tagName.toLowerCase(),
          label,
          required: el.required || el.classList.contains('required'),
          maxLength: el.maxLength > 0 && el.maxLength < 100000 ? el.maxLength : null,
          placeholder: el.placeholder || null,
          options,
          visible: el.offsetParent !== null,
          tagName: el.tagName
        });
      });

      return results;
    });

    console.log(`✓ Extracted ${fields.length} fields`);

    // 6. Also grab the raw HTML of all forms for reference
    const formHtml = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map((f, i) => ({
        index: i,
        action: f.action,
        method: f.method,
        id: f.id,
        name: f.name,
        fieldCount: f.querySelectorAll('input, select, textarea').length
      }));
    });

    // 7. Build schema
    const required = fields.filter(f => f.required);
    const optional = fields.filter(f => !f.required);
    const visible = fields.filter(f => f.visible);

    const schema = {
      discoveredAt: new Date().toISOString(),
      url: page.url(),
      forms: formHtml,
      metadata: {
        totalFields: fields.length,
        visibleFields: visible.length,
        requiredFields: required.length,
        optionalFields: optional.length
      },
      fields
    };

    await fs.writeFile('output/gabineteonline-schema.json', JSON.stringify(schema, null, 2));
    console.log('✓ Schema saved: output/gabineteonline-schema.json');

    // 8. Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total fields: ${fields.length}`);
    console.log(`Visible: ${visible.length}`);
    console.log(`Required: ${required.length}`);
    console.log(`Optional: ${optional.length}`);
    console.log('\nRequired fields:');
    required.forEach(f => console.log(`  * ${f.label} (${f.name}) [${f.type}]`));
    console.log('\nVisible optional fields:');
    visible.filter(f => !f.required).forEach(f => console.log(`  - ${f.label} (${f.name}) [${f.type}]`));

  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    console.log('\n✓ Browser closed');
  }
}

main();
