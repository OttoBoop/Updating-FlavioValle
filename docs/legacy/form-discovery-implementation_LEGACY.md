# Phase 2 (P2): Form Discovery Implementation Plan

**Phase**: P2 - Form Discovery
**Project**: Wix Registration System (flaviovalle)
**Created**: 2026-02-10
**Based on**: Phase 2A Clarification (25 questions)
**Workflow**: TDD (RED → GREEN → REFACTOR)
**Status**: Ready for implementation

---

## Context Summary

**Problem Statement:**
The Wix form must automatically feed data to gabineteonline in the background. This form discovery automation is essential to enable that automatic submission.

**Previous Failure Points:**
1. **Credential property mismatch** - Code uses `credentials.gabineteEmail` but actual property may be `credentials.gabineteUsername`
2. **Bot detection** - Standard Playwright gets blocked by Cloudflare/CAPTCHA
3. **Missing stealth plugins** - playwright-extra and puppeteer-extra-plugin-stealth not installed
4. **Path issues** - decrypt-credentials.js may be looking for .env in wrong location

**Core Requirements:**
- Discover ALL form fields (required + optional) with correct labels
- Generate JSON schema for automatic Wix → gabineteonline submission
- Bypass Cloudflare/CAPTCHA using free stealth techniques
- Create Wix mapping document showing field-to-field connections

---

## TDD Workflow Overview

Each step follows the TDD cycle:

**🔴 RED Phase**: Write failing tests first
```bash
npm test
# Tests should FAIL (expected)
```

**🟢 GREEN Phase**: Write minimal code to pass tests
```bash
npm test
# Tests should PASS
```

**🔵 REFACTOR Phase**: Improve code quality while keeping tests green
```bash
npm test
# Tests should still PASS
```

---

## Implementation Steps (TDD)

### Step 0: Investigation (No TDD - Just Verification)

**Objective**: Determine actual property names in decrypted credentials

**Commands**:
```bash
cd C:\Users\Admin\.vscode\flaviovalle\form-discovery
node --input-type=module -e "import('./utils/decrypt-credentials.js').then(m => { const c = m.decryptCredentials(); console.log('Properties:', Object.keys(c)); console.log('Has gabineteEmail:', 'gabineteEmail' in c); console.log('Has gabineteUsername:', 'gabineteUsername' in c); })"
```

**Expected Output**:
```
Properties: [ 'wixEmail', 'wixPassword', 'gabineteEmail' OR 'gabineteUsername', 'gabinetePassword' ]
Has gabineteEmail: true OR false
Has gabineteUsername: true OR false
```

**Decision**: Based on output, determine if code needs updating (gabineteEmail → gabineteUsername)

---

### Step 1: Install Stealth Dependencies
**Objective**: Determine actual property names in decrypted credentials

**Action**:
```bash
cd C:\Users\Admin\.vscode\form-discovery
node --input-type=module -e "import('./utils/decrypt-credentials.js').then(m => { const c = m.decryptCredentials(); console.log('Properties:', Object.keys(c)); console.log('Values (masked):', Object.keys(c).reduce((acc, k) => ({ ...acc, [k]: typeof c[k] }), {})); })"
```

**Expected outcome**: List of actual property names (wixEmail, wixPassword, gabineteEmail OR gabineteUsername, gabinetePassword)

**Decision point**: If properties are correct, no changes needed. If `gabineteUsername` instead of `gabineteEmail`, update all references.

### Step 2: Install Stealth Dependencies
**Directory**: `C:\Users\Admin\.vscode\form-discovery`

**Command**:
```bash
cd C:\Users\Admin\.vscode\form-discovery
npm install playwright-extra puppeteer-extra-plugin-stealth --save
```

**Expected outcome**:
- `package.json` updated with new dependencies
- `node_modules` contains playwright-extra and stealth plugin

**Verification**:
```bash
npm list playwright-extra puppeteer-extra-plugin-stealth
```

### Step 3: Create Stealth-Enhanced Browser Setup
**File**: `C:\Users\Admin\.vscode\form-discovery\utils\browser-setup-stealth.js` (new file)

**Purpose**: Replace standard Playwright with stealth-enhanced version

**Key features**:
- Import playwright-extra (not standard playwright)
- Add StealthPlugin
- Retry logic with exponential backoff (5s, 10s, 20s)
- Screenshot milestones
- Login verification

**Structure**:
```javascript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

export async function loginToGabineteWithStealth(credentials, options = {}) {
  // Retry loop (3 attempts)
  // Launch browser with stealth + anti-detection args
  // Navigate and login
  // Screenshot milestones
  // Verify login success
  // Return { success, browser, page, url } or { success: false, error }
}
```

**Expected outcome**: Browser bypasses Cloudflare/CAPTCHA using stealth techniques

### Step 4: Create Form Navigation Utility
**File**: `C:\Users\Admin\.vscode\form-discovery\utils\form-navigator.js` (new file)

**Purpose**: Search for registration form using multiple keywords

**Keywords to search**:
- "Cadastro" or "Cadastrar"
- "Novo cliente" or "Novo usuário"
- "Adicionar" or "+"

**Structure**:
```javascript
export async function findRegistrationForm(page) {
  // Loop through keywords
  // Find links/buttons matching keyword
  // Click first match
  // Check if form exists on page
  // Return { success, keyword, url } or { success: false, availableLinks }
}
```

**Expected outcome**: Form found via keyword search

### Step 5: Create Wix Mapping Generator
**File**: `C:\Users\Admin\.vscode\form-discovery\utils\wix-mapper.js` (new file)

**Purpose**: Generate human-readable mapping document

**Structure**:
```javascript
export function generateWixMapping(schema) {
  // Separate required vs optional fields
  // Generate markdown with:
  //   - Summary (field counts)
  //   - Required fields table
  //   - Optional fields list
  // Return markdown string
}
```

**Output format**:
- Markdown table for required fields (Wix field name | gabineteonline field | Type | Validation)
- List for optional fields
- Clear and human-readable

**Expected outcome**: `form-discovery/output/wix-mapping.md` created

### Step 6: Create Logging Utility
**File**: `C:\Users\Admin\.vscode\form-discovery\utils\logger.js` (new file)

**Purpose**: Centralized logging with configurable verbosity

**Log levels**: minimal, standard, verbose, debug (default: debug during development)

**Features**:
- Console logging with chalk colors
- File logging to `output/discovery.log`
- Error logging to `output/error.log`
- Remove color codes when writing to files

**Expected outcome**: Detailed logs for debugging

### Step 7: Update Main Discovery Script
**File**: `C:\Users\Admin\.vscode\form-discovery\discover-gabineteonline-fields.js`

**Changes**:
1. Import stealth browser setup instead of standard
2. Use correct credential property (from Step 1)
3. Add CLI flag parsing (--headless/--headful, --log-level)
4. Integrate form navigator
5. Integrate Wix mapper
6. Integrate logger
7. Add error handling with screenshots
8. Generate both JSON schema and Wix mapping

**CLI arguments**:
- `--headless` or `--headful` (default: headful during dev)
- `--log-level=minimal|standard|verbose|debug` (default: debug)

**Expected outcome**: Complete discovery script with all features

### Step 8: Update Tests (if credential property changed)
**Files** (only if property names need changing):
- `C:\Users\Admin\.vscode\form-discovery\__tests__\decrypt-credentials.test.js`
- `C:\Users\Admin\.vscode\form-discovery\__tests__\browser-login.test.js`

**Changes**: Update property names from `gabineteEmail` to `gabineteUsername` (if needed)

**Expected outcome**: All tests pass

### Step 9: Create Output Directory
**Command**:
```bash
cd C:\Users\Admin\.vscode\form-discovery
mkdir -p output
```

**Expected outcome**: `output/` directory exists for screenshots, logs, and schema

### Step 10: Integration Test - Full Discovery Run
**Command**:
```bash
cd C:\Users\Admin\.vscode\form-discovery
npm run discover -- --headful --log-level=debug
```

**Expected observable outcomes**:
1. ✅ Console shows loaded credentials
2. ✅ Browser opens in headful mode (visible)
3. ✅ Navigates to gabineteonline
4. ✅ Login succeeds (screenshot: `output/02-after-login.png`)
5. ✅ Finds registration form (keyword match logged)
6. ✅ Screenshot: `output/03-registration-form.png`
7. ✅ Fields extracted (console shows count)
8. ✅ Files generated:
   - `output/gabineteonline-schema.json`
   - `output/wix-mapping.md`
   - `output/discovery.log`
9. ✅ Console summary (field counts)
10. ✅ Browser closes automatically

---

## Dependencies

### New Packages to Install
```json
{
  "playwright-extra": "^4.3.6",
  "puppeteer-extra-plugin-stealth": "^2.11.2"
}
```

### Existing Packages (already installed)
- `playwright: ^1.40.0`
- `dotenv: ^16.3.1`
- `chalk: ^5.3.0`

---

## Output Structure

### Primary Output: JSON Schema
**File**: `form-discovery/output/gabineteonline-schema.json`

**Structure**:
```json
{
  "discoveredAt": "2026-02-10T...",
  "url": "https://www.gabineteonline1.com.br/flaviovalle/...",
  "metadata": {
    "totalFields": 15,
    "requiredFields": 8,
    "optionalFields": 7
  },
  "fields": [
    {
      "name": "campo_nome",
      "type": "text",
      "label": "Nome Completo",
      "required": true,
      "maxLength": 100,
      "pattern": null,
      "placeholder": "Digite seu nome"
    }
  ]
}
```

### Secondary Output: Wix Mapping Document
**File**: `form-discovery/output/wix-mapping.md`

**Structure**:
```markdown
# Wix to gabineteonline Field Mapping

**Generated:** 2026-02-10T...

## Summary
- Total fields: 15
- Required fields: 8
- Optional fields: 7

## Required Fields (Must be in Wix Form)
| Wix Field Name | gabineteonline Field | Type | Validation |
|----------------|---------------------|------|------------|
| Nome Completo  | campo_nome          | text | MaxLength: 100 |

## Optional Fields
- **Email** → `campo_email` (email)
- **Telefone** → `campo_telefone` (tel)
```

### Logging Outputs
- `output/discovery.log` - Detailed execution log
- `output/error.log` - Errors only (if any occur)

### Screenshots
- `output/01-landing-page.png` - Initial page load
- `output/02-after-login.png` - After successful login
- `output/03-registration-form.png` - Registration form page
- `output/04-error-*.png` - Error screenshots (if failures occur)

---

## Verification Steps

### 1. Decrypt Credentials
```bash
cd C:\Users\Admin\.vscode\form-discovery
node --input-type=module -e "import('./utils/decrypt-credentials.js').then(m => { const c = m.decryptCredentials(); console.log('Properties:', Object.keys(c)); })"
```
**Expected**: List of property names

### 2. Run Discovery Script
```bash
npm run discover -- --headful --log-level=debug
```
**Expected**: Complete execution with all outputs

### 3. Verify JSON Schema
```bash
node -e "const schema = require('./output/gabineteonline-schema.json'); console.log('Total fields:', schema.metadata.totalFields);"
```
**Expected**: Field count displayed

### 4. Verify Wix Mapping
```bash
cat output/wix-mapping.md
```
**Expected**: Human-readable markdown

### 5. Run Tests
```bash
npm test
```
**Expected**: All tests pass

---

## Success Criteria

✅ Script successfully logs into gabineteonline (bypassing CAPTCHA/Cloudflare)
✅ Navigates to new user registration form
✅ Extracts ALL fields (required + optional) with correct labels
✅ Generates valid JSON schema file (`gabineteonline-schema.json`)
✅ Creates Wix mapping document showing field connections
✅ Console shows summary report
✅ Screenshots captured at key milestones
✅ Browser closes automatically on success
✅ Error handling works (logs + screenshots on failures)

---

## Critical Files

### Files to Create (New)
1. `form-discovery/utils/browser-setup-stealth.js` - Stealth login with retry logic
2. `form-discovery/utils/form-navigator.js` - Keyword-based form search
3. `form-discovery/utils/wix-mapper.js` - Mapping document generator
4. `form-discovery/utils/logger.js` - Centralized logging

### Files to Modify (Existing)
1. `form-discovery/discover-gabineteonline-fields.js` - Main entry point
2. `form-discovery/package.json` - Add stealth dependencies
3. `form-discovery/utils/decrypt-credentials.js` - Fix property names (if needed)
4. `form-discovery/__tests__/*.test.js` - Update tests (if property names change)

### Files to Generate (Output)
1. `form-discovery/output/gabineteonline-schema.json` - Primary output
2. `form-discovery/output/wix-mapping.md` - Secondary output
3. `form-discovery/output/discovery.log` - Execution log
4. `form-discovery/output/error.log` - Error log (if failures)
5. `form-discovery/output/*.png` - Screenshots at milestones

---

## Implementation Order

**Phase 1: Investigation (Step 1)**
- Decrypt credentials and verify property names
- Make decisions on property name changes needed

**Phase 2: Setup (Steps 2, 9)**
- Install stealth dependencies
- Create output directory

**Phase 3: Utilities (Steps 3-6)**
- Create browser-setup-stealth.js
- Create form-navigator.js
- Create wix-mapper.js
- Create logger.js

**Phase 4: Integration (Step 7)**
- Update main discovery script with all utilities
- Add CLI flag parsing
- Integrate all features

**Phase 5: Testing (Steps 8, 10)**
- Update tests if needed
- Run full integration test
- Verify all outputs

---

## Notes

- **Headful by default during development** for easier debugging and Cloudflare bypassing
- **Full debug logging by default** for development purposes
- **Free CAPTCHA bypassing only** - no paid services
- **One-time discovery** - not scheduled/automated
- **Auto-close browser on success** for clean exit
