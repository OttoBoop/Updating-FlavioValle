#!/usr/bin/env node
/**
 * One-time Wix site setup runner.
 *
 * Runs with visible browser so user can see progress.
 *
 * Steps:
 *   1. Login to Wix with stored credentials
 *   2. Navigate to site dashboard
 *   3. Duplicate the site as "flaviovalle-dev"
 *   4. Enable Velo Dev Mode on the new site
 *
 * Usage:
 *   node run-wix-setup.js
 *   node run-wix-setup.js --headless    (no browser window)
 *   node run-wix-setup.js --skip-velo   (only duplicate, skip Velo enable)
 */

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { decryptCredentials } from './utils/decrypt-credentials.js';

chromium.use(StealthPlugin());

const HEADLESS = process.argv.includes('--headless');
const SKIP_VELO = process.argv.includes('--skip-velo');
const DEV_SITE_NAME = 'flaviovalle-dev';
const TIMEOUT = 60000;

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

async function main() {
  console.log('\n=== Wix Site Setup Runner ===\n');

  // Step 0: Load credentials
  log('INIT', 'Loading credentials...');
  const creds = decryptCredentials();
  log('INIT', `Email: ${creds.wixEmail}`);

  // Step 1: Launch browser and login
  log('LOGIN', 'Launching browser...');
  const browser = await chromium.launch({
    headless: HEADLESS,
    slowMo: 500,  // Slow down so Wix JS can keep up
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // Navigate to Wix login
    log('LOGIN', 'Navigating to Wix login...');
    await page.goto('https://users.wix.com/signin', {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'output/wix-01-login-page.png' });

    // Fill email (Wix uses a plain text input, not type="email")
    log('LOGIN', 'Filling email...');
    const emailField = page.locator('input').first();
    await emailField.waitFor({ state: 'visible', timeout: TIMEOUT });
    await emailField.fill(creds.wixEmail);
    await page.waitForTimeout(500);

    // Click "Continue with Email" to proceed to password step
    log('LOGIN', 'Clicking Continue with Email...');
    const continueBtn = page.locator('button:has-text("Continue with Email"), button:has-text("Continue"), button:has-text("Next"), button[data-testid="submit"]');
    await continueBtn.first().click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'output/wix-01b-after-email.png' });

    // Fill password (appears after clicking Continue)
    log('LOGIN', 'Filling password...');
    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.waitFor({ state: 'visible', timeout: TIMEOUT });
    await passwordField.fill(creds.wixPassword);
    await page.waitForTimeout(500);

    // Submit login
    log('LOGIN', 'Submitting login...');
    const loginButton = page.locator('button:has-text("Continue with Email"), button[type="submit"], button:has-text("Log In")').first();
    await loginButton.click();

    // Wait for redirect away from login
    log('LOGIN', 'Waiting for redirect...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'output/wix-02-after-login.png' });

    const afterLoginUrl = page.url();
    log('LOGIN', `Current URL: ${afterLoginUrl}`);

    if (afterLoginUrl.includes('signin') || afterLoginUrl.includes('login')) {
      log('LOGIN', 'ERROR: Still on login page. Check credentials or CAPTCHA.');
      log('LOGIN', 'Screenshot saved to output/wix-02-after-login.png');
      await browser.close();
      process.exit(1);
    }

    log('LOGIN', 'Login successful!');

    // Step 2: Go to site list and find flaviovalle
    log('SITES', 'Navigating to site list...');
    await page.goto('https://manage.wix.com/account/sites', {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'output/wix-03-site-list.png' });
    log('SITES', 'Screenshot saved. Looking for site list...');

    // List all visible site names for debugging
    const siteNames = await page.locator('[class*="site-name"], [data-hook*="site-name"], a[href*="dashboard"]').allTextContents();
    log('SITES', `Found sites: ${JSON.stringify(siteNames.filter(s => s.trim()))}`);

    // Step 3: Find and click the site actions menu for flaviovalle
    log('DUPLICATE', 'Looking for flaviovalle site...');

    // Try to find the site card or list item
    const siteLink = page.locator('text=flaviovalle').first();
    if (await siteLink.count() === 0) {
      log('DUPLICATE', 'Cannot find "flaviovalle" in site list. Taking screenshot for debugging.');
      await page.screenshot({ path: 'output/wix-04-no-site-found.png', fullPage: true });

      // Try alternate approach — look for site action buttons
      const allText = await page.locator('body').textContent();
      log('DUPLICATE', `Page contains "${allText.substring(0, 500)}..."`);

      await browser.close();
      process.exit(1);
    }

    // Look for the actions menu (three dots / more actions) near the site
    log('DUPLICATE', 'Found flaviovalle. Looking for Site Actions...');

    // Try hovering over the site card to reveal actions
    await siteLink.hover();
    await page.waitForTimeout(1000);

    // Look for "..." or "More Actions" button
    const moreActions = page.locator('button[aria-label*="action"], button[data-hook*="action"], [class*="more-action"]').first();
    if (await moreActions.count() > 0) {
      await moreActions.click();
      await page.waitForTimeout(1000);
    }

    // Click Duplicate
    log('DUPLICATE', 'Clicking Duplicate Site...');
    const duplicateButton = page.getByText('Duplicate Site').first();
    await duplicateButton.waitFor({ state: 'visible', timeout: 10000 });
    await duplicateButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'output/wix-05-duplicate-dialog.png' });

    // Fill new site name
    log('DUPLICATE', `Setting new name: ${DEV_SITE_NAME}`);
    const nameInput = page.locator('input').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.clear();
    await nameInput.fill(DEV_SITE_NAME);
    await page.waitForTimeout(500);

    // Confirm
    const confirmBtn = page.locator('button:has-text("Duplicate"), button:has-text("OK"), button[data-hook*="confirm"]').first();
    await confirmBtn.click();
    log('DUPLICATE', 'Duplication triggered! Waiting for completion...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'output/wix-06-after-duplicate.png' });

    log('DUPLICATE', 'Site duplicated (check screenshot wix-06)');

    // Step 4: Enable Velo (if not skipped)
    if (!SKIP_VELO) {
      log('VELO', 'Navigating to site list to find dev site...');
      await page.goto('https://manage.wix.com/account/sites', {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUT,
      });
      await page.waitForTimeout(5000);

      // Find the dev site
      const devSiteLink = page.locator(`text=${DEV_SITE_NAME}`).first();
      if (await devSiteLink.count() > 0) {
        log('VELO', 'Found dev site. Navigating to editor...');

        // Go to the editor for this site
        await devSiteLink.click();
        await page.waitForTimeout(3000);

        // Click "Edit Site" to open the editor
        const editButton = page.locator('a:has-text("Edit Site"), button:has-text("Edit Site")').first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(10000); // Editor takes a while to load
        }

        await page.screenshot({ path: 'output/wix-07-editor.png' });

        // Click Dev Mode in the top bar
        log('VELO', 'Looking for Dev Mode toggle...');
        const devModeBtn = page.getByText('Dev Mode').first();
        if (await devModeBtn.count() > 0) {
          await devModeBtn.click();
          await page.waitForTimeout(2000);

          const turnOnBtn = page.getByText('Turn on Dev Mode').first();
          if (await turnOnBtn.count() > 0) {
            await turnOnBtn.click();
            await page.waitForTimeout(3000);
            log('VELO', 'Dev Mode enabled!');
          } else {
            log('VELO', 'Dev Mode might already be on, or button not found.');
          }
        } else {
          log('VELO', 'Dev Mode button not found in editor. Check screenshot.');
        }

        await page.screenshot({ path: 'output/wix-08-velo-enabled.png' });
      } else {
        log('VELO', `Could not find "${DEV_SITE_NAME}" in site list. Skipping Velo setup.`);
      }
    } else {
      log('VELO', 'Skipped (--skip-velo flag)');
    }

    // Done
    console.log('\n=== Setup Complete ===');
    console.log('Screenshots saved to output/wix-*.png');
    console.log('Review them to verify each step worked.');
    console.log(`\nNext steps:`);
    console.log(`  1. Verify "${DEV_SITE_NAME}" exists in your Wix account`);
    console.log(`  2. Run: npx wix login`);
    console.log(`  3. Run: npx wix dev`);

  } catch (error) {
    log('ERROR', error.message);
    await page.screenshot({ path: 'output/wix-error.png' });
    log('ERROR', 'Error screenshot saved to output/wix-error.png');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
