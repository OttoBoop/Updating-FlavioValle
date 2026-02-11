# Phase 2 (P2): Form Discovery - TDD Implementation Plan

**Phase**: P2 - Form Discovery
**Project**: Wix Registration System (flaviovalle)
**Created**: 2026-02-10
**Based on**: Phase 2A Clarification (25 questions)
**Workflow**: TDD (RED → GREEN → REFACTOR)

---

## TDD Workflow

Each step follows strict TDD:

**🔴 RED**: Write failing tests → Run `npm test` → Tests FAIL
**🟢 GREEN**: Write minimal code → Run `npm test` → Tests PASS
**🔵 REFACTOR**: Improve code → Run `npm test` → Tests STILL PASS

---

## Step 0: Investigation (No TDD)

**Verify credential property names before starting**

```bash
cd C:\Users\Admin\.vscode\flaviovalle\form-discovery
node --input-type=module -e "import('./utils/decrypt-credentials.js').then(m => { const c = m.decryptCredentials(); console.log('Properties:', Object.keys(c)); })"
```

**Expected**: Shows if property is `gabineteEmail` or `gabineteUsername`
**Decision**: Update code if property name is wrong

---

## Step 1: Install Dependencies (No TDD)

```bash
cd C:\Users\Admin\.vscode\flaviovalle\form-discovery
npm install playwright-extra puppeteer-extra-plugin-stealth --save
```

**Verify**:
```bash
npm list playwright-extra puppeteer-extra-plugin-stealth
```

---

## Step 2: Create Output Directory (No TDD)

```bash
cd C:\Users\Admin\.vscode\flaviovalle\form-discovery
mkdir output
```

---

## Step 3: Stealth Browser Setup (TDD)

### 🔴 RED Phase

**Create test**: `__tests__/browser-setup-stealth.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import { loginToGabineteWithStealth } from '../utils/browser-setup-stealth.js';

describe('Stealth Browser Setup', () => {
  it('should export loginToGabineteWithStealth function', () => {
    expect(loginToGabineteWithStealth).toBeDefined();
    expect(typeof loginToGabineteWithStealth).toBe('function');
  });

  it('should accept credentials and options parameters', async () => {
    const mockCredentials = {
      username: 'test@example.com',
      password: 'testpass'
    };

    // This will fail initially - just testing function signature
    expect(() => loginToGabineteWithStealth(mockCredentials, {})).not.toThrow();
  });
});
```

**Run tests**:
```bash
npm test
```

**Expected**: ❌ Tests FAIL (module not found)

### 🟢 GREEN Phase

**Create**: `utils/browser-setup-stealth.js`

```javascript
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
      await page.goto(baseUrl, { timeout, waitUntil: 'networkidle' });

      // Screenshot milestone
      await page.screenshot({ path: 'output/01-landing-page.png', fullPage: true });

      // Find and fill login form
      const usernameField = await page.locator('input[type="text"], input[name="username"], input[name="email"]').first();
      const passwordField = await page.locator('input[type="password"]').first();

      await usernameField.fill(credentials.username);
      await passwordField.fill(credentials.password);

      // Submit
      const submitButton = await page.locator('button[type="submit"], input[type="submit"]').first();
      await submitButton.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle', { timeout });

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
```

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests PASS

### 🔵 REFACTOR Phase

**Improve code** (add error handling, better logging, etc.)

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests STILL PASS

---

## Step 4: Form Navigator (TDD)

### 🔴 RED Phase

**Create test**: `__tests__/form-navigator.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import { findRegistrationForm } from '../utils/form-navigator.js';

describe('Form Navigator', () => {
  it('should export findRegistrationForm function', () => {
    expect(findRegistrationForm).toBeDefined();
    expect(typeof findRegistrationForm).toBe('function');
  });

  it('should search for registration keywords', () => {
    // Mock page object
    const mockPage = {
      locator: () => ({ all: async () => [], count: async () => 0 }),
      url: () => 'https://example.com'
    };

    expect(async () => await findRegistrationForm(mockPage)).not.toThrow();
  });
});
```

**Run tests**:
```bash
npm test
```

**Expected**: ❌ Tests FAIL (module not found)

### 🟢 GREEN Phase

**Create**: `utils/form-navigator.js`

```javascript
export async function findRegistrationForm(page) {
  const keywords = [
    'Cadastro',
    'Cadastrar',
    'Novo cliente',
    'Novo usuário',
    'Adicionar',
    '+'
  ];

  for (const keyword of keywords) {
    const links = await page.locator(`a:has-text("${keyword}"), button:has-text("${keyword}")`).all();

    if (links.length > 0) {
      console.log(`Found ${links.length} link(s) with keyword "${keyword}"`);
      await links[0].click();
      await page.waitForLoadState('networkidle');

      // Check if form exists
      const formCount = await page.locator('form').count();
      if (formCount > 0) {
        return { success: true, keyword, url: page.url() };
      }
    }
  }

  // Fallback: explore all navigation links
  console.log('Keywords not found - logging all links...');
  const allLinks = await page.locator('nav a, .menu a, .navigation a').allTextContents();
  console.log('Available links:', allLinks);

  return { success: false, availableLinks: allLinks };
}
```

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests PASS

### 🔵 REFACTOR Phase

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests STILL PASS

---

## Step 5: Wix Mapper (TDD)

### 🔴 RED Phase

**Create test**: `__tests__/wix-mapper.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import { generateWixMapping } from '../utils/wix-mapper.js';

describe('Wix Mapper', () => {
  it('should generate markdown mapping document', () => {
    const mockSchema = {
      metadata: { totalFields: 5, requiredFields: 3, optionalFields: 2 },
      fields: [
        { name: 'nome', type: 'text', label: 'Nome', required: true },
        { name: 'email', type: 'email', label: 'Email', required: false }
      ]
    };

    const mapping = generateWixMapping(mockSchema);

    expect(mapping).toContain('# Wix to gabineteonline Field Mapping');
    expect(mapping).toContain('Total fields: 5');
    expect(mapping).toContain('Required fields: 3');
  });
});
```

**Run tests**:
```bash
npm test
```

**Expected**: ❌ Tests FAIL (module not found)

### 🟢 GREEN Phase

**Create**: `utils/wix-mapper.js`

```javascript
export function generateWixMapping(schema) {
  const requiredFields = schema.fields.filter(f => f.required);
  const optionalFields = schema.fields.filter(f => !f.required);

  let markdown = `# Wix to gabineteonline Field Mapping\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- Total fields: ${schema.metadata.totalFields}\n`;
  markdown += `- Required fields: ${schema.metadata.requiredFields}\n`;
  markdown += `- Optional fields: ${schema.metadata.optionalFields}\n\n`;

  markdown += `## Required Fields (Must be in Wix Form)\n\n`;
  markdown += `| Wix Field Name | gabineteonline Field | Type | Validation |\n`;
  markdown += `|----------------|---------------------|------|------------|\n`;

  requiredFields.forEach(field => {
    markdown += `| ${field.label} | ${field.name} | ${field.type} | `;
    if (field.pattern) markdown += `Pattern: ${field.pattern} `;
    if (field.maxLength) markdown += `MaxLength: ${field.maxLength} `;
    markdown += `|\n`;
  });

  markdown += `\n## Optional Fields\n\n`;
  optionalFields.forEach(field => {
    markdown += `- **${field.label}** → \`${field.name}\` (${field.type})\n`;
  });

  return markdown;
}
```

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests PASS

### 🔵 REFACTOR Phase

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests STILL PASS

---

## Step 6: Logger Utility (TDD)

### 🔴 RED Phase

**Create test**: `__tests__/logger.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import { Logger } from '../utils/logger.js';

describe('Logger', () => {
  it('should create logger instance with log level', () => {
    const logger = new Logger('debug');
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it('should have log and error methods', () => {
    const logger = new Logger('standard');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});
```

**Run tests**:
```bash
npm test
```

**Expected**: ❌ Tests FAIL (module not found)

### 🟢 GREEN Phase

**Create**: `utils/logger.js`

```javascript
import fs from 'fs/promises';
import chalk from 'chalk';

const LOG_LEVELS = {
  minimal: 0,
  standard: 1,
  verbose: 2,
  debug: 3
};

export class Logger {
  constructor(level = 'debug') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.debug;
    this.logFile = 'output/discovery.log';
  }

  async log(message, level = 'standard') {
    if (LOG_LEVELS[level] <= this.level) {
      console.log(message);
      await this.writeToFile(message);
    }
  }

  async error(message, error) {
    const errorMsg = `${chalk.red('ERROR:')} ${message}\n${error?.stack || error}`;
    console.error(errorMsg);
    await this.writeToFile(errorMsg, 'output/error.log');
  }

  async writeToFile(message, file = this.logFile) {
    const timestamp = new Date().toISOString();
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, ''); // Remove chalk colors
    await fs.appendFile(file, `[${timestamp}] ${cleanMessage}\n`, 'utf8');
  }
}
```

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests PASS

### 🔵 REFACTOR Phase

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests STILL PASS

---

## Step 7: Update Main Script (TDD)

### 🔴 RED Phase

**Update existing tests** in `__tests__/` to expect new behavior

**Run tests**:
```bash
npm test
```

**Expected**: ❌ Some tests FAIL (expected new functionality)

### 🟢 GREEN Phase

**Update**: `discover-gabineteonline-fields.js`

- Import all new utilities
- Add CLI argument parsing
- Use stealth browser
- Generate JSON schema AND Wix mapping
- Full error handling with screenshots

**Run tests**:
```bash
npm test
```

**Expected**: ✅ All tests PASS

### 🔵 REFACTOR Phase

**Run tests**:
```bash
npm test
```

**Expected**: ✅ Tests STILL PASS

---

## Step 8: Integration Test (E2E)

**Run the full discovery**:

```bash
cd C:\Users\Admin\.vscode\flaviovalle\form-discovery
npm run discover -- --headful --log-level=debug
```

**Expected outputs**:

1. ✅ Console shows credentials loaded
2. ✅ Browser opens (visible)
3. ✅ Navigates and logs in
4. ✅ Screenshot: `output/02-after-login.png`
5. ✅ Finds form (keyword logged)
6. ✅ Screenshot: `output/03-registration-form.png`
7. ✅ Fields extracted
8. ✅ Files created:
   - `output/gabineteonline-schema.json`
   - `output/wix-mapping.md`
   - `output/discovery.log`
9. ✅ Console summary
10. ✅ Browser closes

**Verify outputs**:
```bash
# Check JSON
node -e "const s = require('./output/gabineteonline-schema.json'); console.log('Fields:', s.metadata.totalFields);"

# Check mapping
type output\wix-mapping.md

# List all outputs
dir output
```

---

## Step 9: Final Test Run

**Run all tests one last time**:

```bash
npm test
```

**Expected**: ✅ ALL tests PASS (100%)

---

## Quick Command Reference

### Development Commands

```bash
# Navigate to project
cd C:\Users\Admin\.vscode\flaviovalle\form-discovery

# Run all tests
npm test

# Run tests in watch mode (auto-rerun)
npm test -- --watch

# Run specific test
npm test -- browser-setup-stealth.test.js

# Run with coverage
npm test -- --coverage

# Run discovery (headful, debug)
npm run discover -- --headful --log-level=debug

# Run discovery (headless, production)
npm run discover -- --headless --log-level=standard
```

### Verification Commands

```bash
# Check credentials
node --input-type=module -e "import('./utils/decrypt-credentials.js').then(m => console.log(Object.keys(m.decryptCredentials())))"

# Validate JSON schema
node -e "const s = require('./output/gabineteonline-schema.json'); console.log('✓ Valid'); console.log('Fields:', s.metadata.totalFields);"

# View Wix mapping
type output\wix-mapping.md

# List outputs
dir output
```

---

## Success Criteria

✅ All unit tests pass
✅ Script logs into gabineteonline (bypasses CAPTCHA)
✅ Navigates to registration form
✅ Extracts ALL fields (required + optional) with labels
✅ Generates valid JSON schema
✅ Creates Wix mapping document
✅ Screenshots captured at milestones
✅ Browser closes automatically
✅ Error handling works (logs + screenshots on failures)

---

## Ready to Start?

Run this command to begin:

```bash
cd C:\Users\Admin\.vscode\flaviovalle\form-discovery
npm test
```

Follow steps 0-9 in order, running `npm test` after each phase!
