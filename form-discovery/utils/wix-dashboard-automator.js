const WIX_LOGIN_URL = 'https://users.wix.com/signin';
const WIX_DASHBOARD_URL = 'https://manage.wix.com/dashboard/';
const WIX_EDITOR_URL = 'https://editor.wix.com/html/editor/web/renderer/edit/';
const DEFAULT_TIMEOUT = 30000;

/**
 * Logs into Wix Dashboard using email/password.
 * @param {import('playwright').Page} page - Playwright page object
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function loginToWix(page, credentials) {
  try {
    await page.goto(WIX_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT });

    // Fill email
    const emailField = page.locator('input[type="email"], input[name="email"], #loginEmail').first();
    await emailField.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    await emailField.fill(credentials.email);

    // Fill password
    const passwordField = page.locator('input[type="password"], input[name="password"], #loginPassword').first();
    await passwordField.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    await passwordField.fill(credentials.password);

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Log In")').first();
    await submitButton.click();

    // Wait for redirect to dashboard
    await page.waitForLoadState('domcontentloaded', { timeout: DEFAULT_TIMEOUT });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('signin') || currentUrl.includes('login')) {
      return { success: false, error: 'Login failed — still on login page' };
    }

    return { success: true, url: currentUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Duplicates a Wix site via the Dashboard UI.
 * @param {import('playwright').Page} page - Playwright page (must be logged in)
 * @param {{siteId: string, newName: string}} options
 * @returns {Promise<{success: boolean, newName: string, error?: string}>}
 */
export async function duplicateSite(page, options) {
  try {
    // Navigate to the site's dashboard
    await page.goto(`${WIX_DASHBOARD_URL}${options.siteId}`, {
      waitUntil: 'domcontentloaded',
      timeout: DEFAULT_TIMEOUT,
    });
    await page.waitForTimeout(2000);

    // Open Site Actions menu (more actions / three dots)
    const siteActions = page.getByText('Site Actions').first();
    await siteActions.click();
    await page.waitForTimeout(1000);

    // Click "Duplicate Site"
    const duplicateOption = page.getByText('Duplicate Site').first();
    await duplicateOption.click();
    await page.waitForTimeout(1000);

    // Fill in the new site name
    const nameInput = page.locator('input[placeholder*="site name"], input[name="siteName"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    await nameInput.fill(options.newName);

    // Confirm duplication
    const confirmButton = page.getByText('Duplicate').first();
    await confirmButton.click();

    // Wait for duplication to complete
    await page.waitForTimeout(5000);

    return { success: true, newName: options.newName };
  } catch (error) {
    return { success: false, newName: options.newName, error: error.message };
  }
}

/**
 * Enables Velo Dev Mode on a Wix site via the Editor.
 * @param {import('playwright').Page} page - Playwright page (must be logged in)
 * @param {{siteId: string}} options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function enableVelo(page, options) {
  try {
    // Navigate to the Editor for this site
    await page.goto(`${WIX_EDITOR_URL}${options.siteId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(5000);

    // Click "Dev Mode" in the top bar
    const devModeMenu = page.getByText('Dev Mode').first();
    await devModeMenu.click();
    await page.waitForTimeout(1000);

    // Click "Turn on Dev Mode"
    const enableButton = page.getByText('Turn on Dev Mode').first();
    await enableButton.click();
    await page.waitForTimeout(3000);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Runs the full setup: login → duplicate → enable Velo.
 * Aborts early if login fails.
 * @param {import('playwright').Page} page
 * @param {{email: string, password: string, siteId: string, devSiteName: string}} config
 * @returns {Promise<{login: object, duplicate?: object, velo?: object, steps: string[]}>}
 */
export async function runSetup(page, config) {
  if (!config.email || !config.password) {
    throw new Error('Missing required credentials: email and password');
  }

  const steps = [];

  // Step 1: Login
  steps.push('login');
  const login = await loginToWix(page, {
    email: config.email,
    password: config.password,
  });

  if (!login.success) {
    return { login, steps };
  }

  // Step 2: Duplicate site
  steps.push('duplicate');
  const duplicate = await duplicateSite(page, {
    siteId: config.siteId,
    newName: config.devSiteName,
  });

  // Step 3: Enable Velo on the new site
  steps.push('velo');
  const velo = await enableVelo(page, {
    siteId: duplicate.newSiteId || config.siteId,
  });

  return { login, duplicate, velo, steps };
}
