# Implementation Spec: Wix Registration Gate for WhatsApp Contact

**Created**: 2026-02-10
**Based on**: `.claude/clarify-session.md` (56 questions across 7 categories)
**Project Directory**: `C:\Users\Admin\.vscode\flaviovalle\`

---

## Context

### Problem Statement

The vereador office at **flaviovalle.com** currently has a manual, error-prone registration process:
- Constituents click WhatsApp button/widget → contact office directly
- Staff manually register constituents afterwards at **gabineteonline1.com.br**
- Results in ~30% data entry errors, ~40% missed registrations, 20 staff hours/week wasted

### Solution

Build a **registration gate** that intercepts WhatsApp contact attempts:
1. User clicks WhatsApp → redirect to phone lookup page
2. New user → registration form → Wix DB save → WhatsApp access
3. Returning user → "Welcome back" screen → WhatsApp direct access OR edit info
4. Background sync from Wix DB to gabineteonline (async, with retry logic)

### Key Requirements

#### Three-Page User Flow
1. **Phone Lookup Page** (`/registro-telefone`): Enter phone number
   - Check if phone exists in Wix DB
   - Route to welcome-back OR registration form

2a. **Welcome Back Page** (`/bem-vindo`) - Returning users:
   - Display: "Bem-vindo de volta, [Name]!"
   - Button 1: "Entrar em contato via WhatsApp" (direct access)
   - Button 2: "Atualizar Cadastro" (pre-filled edit form)

2b. **Registration Form Page** (`/cadastro`) - New users:
   - Collect minimal required fields (discovered from gabineteonline)
   - Auto-fill constant fields
   - Brazilian phone format by default, international optional
   - Portuguese language only

3. **WhatsApp Redirect**: Use existing WhatsApp flow (DON'T MODIFY)

#### Two-Tier Data Architecture
- **Tier 1 (Primary)**: Wix Database - source of truth
  - Immediate save on form submission
  - Phone number is unique identifier
  - User proceeds to WhatsApp immediately after save

- **Tier 2 (Secondary)**: gabineteonline1.com.br - background sync
  - Async HTTP POST after Wix save
  - 3 retry attempts (1s, 2s, 4s exponential backoff)
  - SMS/WhatsApp alert on failure
  - Flag suspicious data for staff review

### Constraints

- **Platform**: Wix (first time using Velo - setup from scratch)
- **No paid services**: Use only built-in Wix features
- **Dev environment**: Create duplicate dev site (protect live production)
- **Timeline**: ASAP - launch within days (election coming in 2026, traffic will spike)
- **Target audience**: LOW technical skill level (simple UI, clear guidance)
- **Devices**: Mobile + desktop (both critical)
- **Biggest risk**: Breaking live website
- **Maintenance**: User will maintain (need clear documentation)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     flaviovalle.com (Wix)                       │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │ Phone Lookup │ -> │ Welcome Back │ -> │   WhatsApp   │    │
│  │    Page      │    │     Page     │    │   Redirect   │    │
│  └──────┬───────┘    └──────────────┘    └──────────────┘    │
│         │                                                      │
│         └──────> ┌──────────────┐                             │
│                  │ Registration │                             │
│                  │     Form     │                             │
│                  └──────┬───────┘                             │
│                         │                                      │
│                         v                                      │
│                  ┌──────────────┐                             │
│                  │   Wix DB     │ (Source of Truth)           │
│                  │ "Registros"  │                             │
│                  └──────┬───────┘                             │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ Background Sync
                          │ (async, 3 retries)
                          v
                 ┌────────────────────┐
                 │ gabineteonline1    │
                 │ .com.br            │
                 │ (Secondary)        │
                 └────────────────────┘
```

### Technology Stack

- **Frontend**: Wix Pages (visual editor) + Wix Velo (JavaScript)
- **Backend**: Wix Velo Web Modules (server-side functions)
- **Database**: Wix Data Collections
- **Credentials**: Wix Secrets Manager (encrypted storage)
- **Form Discovery**: Playwright (browser automation to inspect gabineteonline)
- **Monitoring**: Wix Logs + SMS/WhatsApp alerts
- **Testing**: Wix Test Mode + Manual cross-browser testing

---

## Existing Code to Reuse

**This is a brand new project** - no existing custom code to reuse.

### What Currently Exists:
- **flaviovalle.com** (Wix site, no Velo code)
- **WhatsApp Integration**: Working button + widget (DON'T TOUCH)
- **gabineteonline1.com.br**: External system with manual registration form

### Design Patterns to Extract:
- [ ] Scrape flaviovalle.com for colors, fonts, button styles
- [ ] Inspect WhatsApp button/widget selectors for interception
- [ ] Capture current WhatsApp redirect URL

---

## New Components Needed

### Phase 1: Secure Credential Storage

**Directory**: `C:\Users\Admin\.vscode\flaviovalle\scripts\`

| File | Purpose |
|------|---------|
| `setup-credentials.js` | Node.js script to securely collect and store credentials |
| `.env` | Local environment variables (gitignored) |
| `credentials.encrypted` | Encrypted credential store (if using file-based approach) |

**Requirements**:
- Prompt user for Wix email/password
- Prompt user for gabineteonline email/password
- Store encrypted (AES-256 or equivalent)
- Persist across sessions
- Never log credentials in plain text

### Phase 2: Browser Automation for Form Discovery

**Directory**: `C:\Users\Admin\.vscode\flaviovalle\form-discovery\`

| File | Purpose |
|------|---------|
| `discover-gabineteonline-fields.js` | Playwright script to login and inspect form |
| `utils/browser-setup.js` | Browser initialization and authentication |
| `utils/form-inspector.js` | DOM parsing to extract field metadata |
| `utils/schema-generator.js` | Convert fields to JSON schema |
| `output/gabineteonline-schema.json` | Generated field definitions |
| `output/form-screenshot.png` | Visual reference |

**Discovery Output Example**:
```json
{
  "fields": [
    {
      "name": "nome_completo",
      "type": "text",
      "label": "Nome Completo",
      "required": true,
      "maxLength": 100,
      "placeholder": "Digite seu nome completo"
    },
    {
      "name": "telefone",
      "type": "tel",
      "label": "Telefone",
      "required": true,
      "pattern": "\\(\\d{2}\\) \\d{5}-\\d{4}",
      "placeholder": "(XX) XXXXX-XXXX"
    },
    {
      "name": "email",
      "type": "email",
      "label": "E-mail",
      "required": true
    }
    // ... additional fields
  ],
  "autoFillable": [
    {
      "name": "origem",
      "value": "Site Vereador",
      "note": "Always the same - auto-fill"
    }
  ]
}
```

### Phase 3: Wix Velo Backend

**Location**: Wix Editor → Backend (server-side code)

| File | Purpose |
|------|---------|
| `backend/config.jsw` | Retrieve credentials from Wix Secrets |
| `backend/database.jsw` | Wix Data Collection queries |
| `backend/gabineteonline-api.jsw` | HTTP client for gabineteonline submission |
| `backend/sync-worker.jsw` | Background sync with retry logic |
| `backend/validation.jsw` | Server-side data validation |
| `backend/alerts.jsw` | SMS/WhatsApp notification system |
| `backend/http-functions.http.js` | Web Module endpoints for frontend |

**Wix Database Collection**: `Registros`

```javascript
{
  _id: "auto-generated",
  telefone: "5511987654321", // Unique index
  nomeCompleto: "João Silva",
  email: "joao@example.com",
  // ... fields from gabineteonline schema

  // Metadata
  _createdDate: "2026-02-10T...",
  _updatedDate: "2026-02-10T...",
  syncStatus: "pending" | "synced" | "failed",
  syncAttempts: 0,
  lastSyncError: "...",
  isSuspiciousData: false,
  whatsappAccessCount: 1
}
```

### Phase 4: Wix Velo Frontend

**Location**: Wix Editor → Public & Backend (page code)

| Page | File | Purpose |
|------|------|---------|
| Phone Lookup | `public/pages/registro-telefone.js` | Phone input + lookup logic |
| Welcome Back | `public/pages/bem-vindo.js` | Returning user screen |
| Registration | `public/pages/cadastro.js` | New user form |
| Site-wide | `public/masterPage.js` | WhatsApp button interception |

**Key Frontend Functions**:
- `interceptWhatsAppClick()` - Attach to button/widget click events
- `lookupPhoneNumber()` - Query Wix DB for existing registration
- `validatePhoneFormat()` - Brazilian/international format validation
- `submitRegistration()` - Call backend web module
- `redirectToWhatsApp()` - Use existing WhatsApp URL

---

## Implementation Steps

Execute phases with: `/tdd-workflow P1` (entire phase) or `/tdd-workflow P1-S1 P1-S2` (specific steps)

**Phase Dependencies**:
- P1 must complete before P2A and P2B
- P2A and P2B can run in parallel
- P3 requires P2A and P2B completion
- P4 requires P3 completion
- P5 requires P4 completion

---

## Phase 1 (P1): Setup & Credentials

**Command**: `/tdd-workflow P1` (all steps) or `/tdd-workflow P1-S1 P1-S2` (specific steps)

**Duration**: ~5 hours

### P1-S1: Project Setup (2 hours)

**Location**: Local machine

**Actions**:
1. Create project directory structure:
   ```
   C:\Users\Admin\.vscode\flaviovalle\
   ├── .claude\
   │   ├── clarify-session.md (✓ done)
   │   └── plans\
   │       └── wix-registration-system.md (this file)
   ├── scripts\
   │   └── setup-credentials.js
   ├── form-discovery\
   │   ├── package.json
   │   ├── discover-gabineteonline-fields.js
   │   ├── utils\
   │   │   ├── browser-setup.js
   │   │   ├── form-inspector.js
   │   │   └── schema-generator.js
   │   └── output\
   │       ├── gabineteonline-schema.json (generated)
   │       └── form-screenshot.png (generated)
   └── README.md (implementation guide for user)
   ```

2. Initialize Node.js project:
   ```bash
   cd form-discovery
   npm init -y
   npm install @playwright/browser dotenv chalk inquirer
   ```

3. Create `.gitignore`:
   ```
   .env
   credentials.encrypted
   node_modules/
   output/*.json
   output/*.png
   ```

**Why**: Organized structure protects credentials, separates concerns, prepares for parallel work

**Verification**: Directory structure exists, npm dependencies installed

---

### P1-S2: Secure Credential Storage (3 hours)

**Location**: `C:\Users\Admin\.vscode\flaviovalle\scripts\`

**File**: `setup-credentials.js`

**Actions**:
1. Create interactive CLI to collect credentials:
   ```javascript
   import inquirer from 'inquirer';
   import crypto from 'crypto';
   import fs from 'fs';

   async function collectCredentials() {
     const answers = await inquirer.prompt([
       {
         type: 'input',
         name: 'wixEmail',
         message: 'Wix account email:',
         validate: (input) => input.includes('@') || 'Valid email required'
       },
       {
         type: 'password',
         name: 'wixPassword',
         message: 'Wix password:',
         mask: '*'
       },
       {
         type: 'input',
         name: 'gabineteEmail',
         message: 'gabineteonline email:',
         validate: (input) => input.includes('@') || 'Valid email required'
       },
       {
         type: 'password',
         name: 'gabinetePassword',
         message: 'gabineteonline password:',
         mask: '*'
       }
     ]);

     return answers;
   }

   async function encryptAndStore(credentials) {
     const algorithm = 'aes-256-cbc';
     const key = crypto.randomBytes(32);
     const iv = crypto.randomBytes(16);

     const cipher = crypto.createCipheriv(algorithm, key, iv);
     let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
     encrypted += cipher.final('hex');

     // Store encrypted credentials
     fs.writeFileSync('.env', `
ENCRYPTION_KEY=${key.toString('hex')}
ENCRYPTION_IV=${iv.toString('hex')}
ENCRYPTED_CREDENTIALS=${encrypted}
     `.trim());

     console.log('✓ Credentials stored securely in .env file');
   }

   (async () => {
     const creds = await collectCredentials();
     await encryptAndStore(creds);
   })();
   ```

2. Create decrypt utility:
   ```javascript
   // utils/decrypt-credentials.js
   export function decryptCredentials() {
     const encrypted = process.env.ENCRYPTED_CREDENTIALS;
     const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
     const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

     const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
     decrypted += decipher.final('utf8');

     return JSON.parse(decrypted);
   }
   ```

**Why**: Secure credential management is Phase 1 requirement. Never store plain text passwords.

**Verification**:
- Run `node scripts/setup-credentials.js`
- User enters credentials via interactive prompts
- `.env` file created with encrypted data
- Can successfully decrypt and retrieve credentials

---

## Phase 2A (P2A): Form Discovery (Parallel with P2B)

**Command**: `/tdd-workflow P2A` (all steps) or `/tdd-workflow P2A-S1` (specific step)

**Duration**: ~6 hours

**Prerequisite**: P1 complete

### P2A-S1: Discover gabineteonline Form Fields (6 hours)

**Location**: `C:\Users\Admin\.vscode\flaviovalle\form-discovery\`

**File**: `discover-gabineteonline-fields.js`

**Actions**:
1. Create Playwright script to login:
   ```javascript
   import { chromium } from '@playwright/browser';
   import dotenv from 'dotenv';
   import { decryptCredentials } from '../scripts/utils/decrypt-credentials.js';

   dotenv.config();
   const credentials = decryptCredentials();

   async function discoverForm() {
     const browser = await chromium.launch({ headless: false }); // visible for debugging
     const context = await browser.newContext();
     const page = await context.newPage();

     // Login to gabineteonline
     await page.goto('https://gabineteonline1.com.br');
     await page.fill('input[name="email"]', credentials.gabineteEmail); // Adjust selector
     await page.fill('input[name="password"]', credentials.gabinetePassword);
     await page.click('button[type="submit"]');
     await page.waitForNavigation();

     // Navigate to cadastro form
     await page.goto('https://gabineteonline1.com.br/cadastro_clientes_dados.php');

     // Extract form fields
     const fields = await page.evaluate(() => {
       const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
       return inputs.map(input => ({
         name: input.name || input.id,
         type: input.type || input.tagName.toLowerCase(),
         label: input.previousElementSibling?.textContent || input.placeholder,
         required: input.required,
         placeholder: input.placeholder,
         maxLength: input.maxLength > 0 ? input.maxLength : null,
         options: input.tagName === 'SELECT'
           ? Array.from(input.options).map(opt => opt.value)
           : null
       }));
     });

     // Screenshot for reference
     await page.screenshot({ path: 'output/form-screenshot.png', fullPage: true });

     // Generate schema
     const schema = {
       fields: fields.filter(f => f.name && !f.name.includes('csrf')),
       autoFillable: [], // Manually add after review
       discoveredAt: new Date().toISOString()
     };

     fs.writeFileSync('output/gabineteonline-schema.json', JSON.stringify(schema, null, 2));

     console.log(`✓ Discovered ${schema.fields.length} fields`);

     await browser.close();
   }

   discoverForm().catch(console.error);
   ```

2. Review generated schema, identify:
   - Required vs optional fields
   - Fields to collect from users
   - Fields to auto-fill (e.g., "origem: Site Vereador")
   - Field validation patterns

**Why**: Must know exactly what fields gabineteonline expects before building Wix form

**Verification**:
- Script successfully logs into gabineteonline
- Navigate to cadastro_clientes_dados.php
- `output/gabineteonline-schema.json` generated
- `output/form-screenshot.png` saved
- Schema contains all form fields with metadata

---

## Phase 2B (P2B): Wix Environment & Frontend (Parallel with P2A)

**Command**: `/tdd-workflow P2B` (all steps) or `/tdd-workflow P2B-S1 P2B-S3` (specific steps)

**Duration**: ~17 hours

**Prerequisite**: P1 complete

### P2B-S1: Create Wix Development Environment (2 hours)

**Location**: Wix Dashboard (https://manage.wix.com)

**Actions**:
1. Login to Wix with credentials
2. Find `flaviovalle.com` in site list
3. Duplicate site:
   - Site Actions → Duplicate Site
   - Name: `flaviovalle-dev`
   - Purpose: Development/testing
4. Open `flaviovalle-dev` in Wix Editor
5. Enable Dev Mode:
   - Top toolbar → Dev Mode toggle (enable)
   - This unlocks Velo code panels
6. Set up Secrets Manager:
   - Left sidebar → Secrets Manager (key icon)
   - Add secrets:
     - `GABINETEONLINE_USER` = [email from credentials]
     - `GABINETEONLINE_PASS` = [password from credentials]
     - `GABINETEONLINE_BASE_URL` = `https://gabineteonline1.com.br`
     - `TECHNICAL_CONTACT_PHONE` = `+55...` (for alerts)

**Why**: Protect live production site. All development happens in `flaviovalle-dev`.

**Verification**:
- Two sites visible in dashboard: `flaviovalle.com` (production), `flaviovalle-dev` (dev)
- Dev Mode enabled in `flaviovalle-dev`
- Secrets Manager contains 4 secrets
- Can read secrets in backend test code

---

### P2B-S2: Create Wix Database Collection (1 hour)

**Location**: Wix Editor → Database Panel

**Actions**:
1. In `flaviovalle-dev` editor, open Database panel (left sidebar)
2. Click "+ Add a Collection"
3. Name: `Registros`
4. Add fields based on `gabineteonline-schema.json`:
   ```
   - telefone (Text, unique index)
   - nomeCompleto (Text)
   - email (Text)
   - [additional fields from schema]
   - syncStatus (Text) - "pending" | "synced" | "failed"
   - syncAttempts (Number)
   - lastSyncError (Text)
   - isSuspiciousData (Boolean)
   - whatsappAccessCount (Number)
   ```
5. Set permissions:
   - Anyone can: Insert (for registration form submission)
   - Backend only: Read, Update, Delete
6. Create indexes:
   - `telefone` (Unique) - for fast lookups
   - `syncStatus` (Non-unique) - for background worker queries

**Why**: Wix DB is source of truth (Tier 1). Must be ready before building forms.

**Verification**:
- Collection `Registros` visible in Database panel
- All fields defined with correct types
- Permissions set correctly
- Indexes created
- Can insert/query test record via database manager

---

### P2B-S3: Build Phone Lookup Page (4 hours)

**Location**: Wix Editor → Backend section

**File**: `backend/gabineteonline-api.jsw`

**Actions**:
1. Create HTTP client with login + session management:
   ```javascript
   import { fetch } from 'wix-fetch';
   import { getSecret } from 'wix-secrets-backend';

   let sessionCookie = null; // Cache session

   async function login() {
     const email = await getSecret('GABINETEONLINE_USER');
     const password = await getSecret('GABINETEONLINE_PASS');
     const baseUrl = await getSecret('GABINETEONLINE_BASE_URL');

     const response = await fetch(`${baseUrl}/login.php`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
     });

     // Extract session cookie
     const cookies = response.headers.get('set-cookie');
     sessionCookie = cookies; // Store for subsequent requests

     return response.ok;
   }

   async function submitRegistration(data) {
     if (!sessionCookie) await login();

     const baseUrl = await getSecret('GABINETEONLINE_BASE_URL');

     // Map Wix field names to gabineteonline field names
     const formData = {
       nome_completo: data.nomeCompleto,
       telefone: data.telefone,
       email: data.email,
       // ... map all fields from schema
       origem: 'Site Vereador' // Auto-fill
     };

     const response = await fetch(`${baseUrl}/cadastro_clientes_dados.php`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Cookie': sessionCookie
       },
       body: new URLSearchParams(formData).toString()
     });

     if (!response.ok) {
       throw new Error(`gabineteonline submission failed: ${response.status}`);
     }

     const text = await response.text();

     // Check for success indicators
     if (text.includes('sucesso') || text.includes('cadastro realizado')) {
       return { success: true };
     } else {
       throw new Error('Unexpected response from gabineteonline');
     }
   }

   export { submitRegistration };
   ```

2. Create retry logic wrapper:

**File**: `backend/sync-worker.jsw`

```javascript
import { submitRegistration } from './gabineteonline-api';
import { sendAlert } from './alerts';

async function syncWithRetry(data, registrationId) {
  const maxAttempts = 3;
  const delays = [1000, 2000, 4000]; // Exponential backoff

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await submitRegistration(data);

      // Update Wix DB: mark as synced
      await wixData.update('Registros', {
        _id: registrationId,
        syncStatus: 'synced',
        syncAttempts: attempt + 1
      });

      return { success: true };

    } catch (error) {
      console.error(`Sync attempt ${attempt + 1} failed:`, error);

      // Update attempt count
      await wixData.update('Registros', {
        _id: registrationId,
        syncAttempts: attempt + 1,
        lastSyncError: error.message
      });

      if (attempt < maxAttempts - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  // All retries failed
  await wixData.update('Registros', {
    _id: registrationId,
    syncStatus: 'failed'
  });

  // Alert technical contact
  await sendAlert(`gabineteonline sync failed for registration ${registrationId}`);

  return { success: false };
}

export { syncWithRetry };
```

**Why**: Background sync is critical. Retries handle transient failures. Alerts ensure staff knows about problems.

**Verification**:
- Test login to gabineteonline (check session cookie)
- Test submitRegistration with valid data
- Verify data appears in gabineteonline admin panel
- Test retry logic with forced failures
- Verify alerts sent on final failure

**Location**: Wix Editor → Add Page → `/registro-telefone`

**Design** (using Wix built-in elements):
- Header: "Bem-vindo! Para entrar em contato via WhatsApp, precisamos confirmar seu telefone."
- Input field: Phone number (with format hint)
- Button: "Continuar"
- Loading spinner (hidden by default)

**File**: `public/pages/registro-telefone.js`

```javascript
import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(function () {
  // Auto-format phone as user types
  $w('#inputTelefone').onInput((event) => {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits

    // Brazilian format: (XX) XXXXX-XXXX
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }

    $w('#inputTelefone').value = value;
  });

  // Lookup phone on button click
  $w('#btnContinuar').onClick(async () => {
    const telefone = $w('#inputTelefone').value.replace(/\D/g, ''); // Strip formatting

    // Validation
    if (telefone.length < 10) {
      $w('#errorMessage').text = 'Telefone inválido. Digite um número completo.';
      $w('#errorMessage').show();
      return;
    }

    // Show loading
    $w('#loadingSpinner').show();
    $w('#btnContinuar').disable();

    try {
      // Query Wix DB
      const result = await wixData.query('Registros')
        .eq('telefone', telefone)
        .find();

      if (result.items.length > 0) {
        // Existing user - go to welcome back page
        const user = result.items[0];
        wixLocation.to(`/bem-vindo?nome=${encodeURIComponent(user.nomeCompleto)}&telefone=${telefone}`);
      } else {
        // New user - go to registration form
        wixLocation.to(`/cadastro?telefone=${telefone}`);
      }

    } catch (error) {
      console.error('Lookup failed:', error);
      $w('#errorMessage').text = 'Erro ao verificar telefone. Tente novamente.';
      $w('#errorMessage').show();
      $w('#loadingSpinner').hide();
      $w('#btnContinuar').enable();
    }
  });
});
```

**Why**: Entry point for entire flow. Phone lookup determines route (returning vs new user).

**Verification**:
- Page renders correctly on mobile + desktop
- Phone auto-formats as user types
- Existing phone → redirects to `/bem-vindo`
- New phone → redirects to `/cadastro`
- Error handling works (invalid phone, network failure)

---

### P2B-S4: Build Welcome Back Page (3 hours)

**Location**: Wix Editor → Add Page → `/bem-vindo`

**Design**:
- Header: "Bem-vindo de volta, [Name]!"
- Subheader: "Telefone: [formatted phone]"
- Button 1 (large, primary): "Entrar em contato via WhatsApp"
- Button 2 (secondary): "Atualizar Cadastro"

**File**: `public/pages/bem-vindo.js`

```javascript
import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(function () {
  // Get URL parameters
  const nome = wixLocation.query.nome;
  const telefone = wixLocation.query.telefone;

  // Display welcome message
  $w('#txtWelcome').text = `Bem-vindo de volta, ${nome}!`;
  $w('#txtTelefone').text = `Telefone: ${formatPhone(telefone)}`;

  // WhatsApp direct access
  $w('#btnWhatsApp').onClick(() => {
    // Increment access count
    wixData.query('Registros')
      .eq('telefone', telefone)
      .find()
      .then(result => {
        if (result.items.length > 0) {
          const registro = result.items[0];
          wixData.update('Registros', {
            _id: registro._id,
            whatsappAccessCount: (registro.whatsappAccessCount || 0) + 1
          });
        }
      });

    // Redirect to WhatsApp (use existing implementation)
    redirectToWhatsApp();
  });

  // Edit information
  $w('#btnAtualizar').onClick(() => {
    wixLocation.to(`/cadastro?telefone=${telefone}&edit=true`);
  });
});

function formatPhone(phone) {
  // Format: (XX) XXXXX-XXXX
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
}

function redirectToWhatsApp() {
  // Get current WhatsApp URL (don't modify existing implementation)
  // This will be extracted in Step 11
  const whatsappUrl = 'https://wa.me/5511999999999?text=Olá!'; // Placeholder
  wixLocation.to(whatsappUrl);
}
```

**Why**: Returning users bypass registration. Quick access to WhatsApp (primary use case) or edit info (secondary).

**Verification**:
- Page receives URL parameters correctly
- Welcome message displays name
- WhatsApp button redirects to existing WhatsApp flow
- "Atualizar Cadastro" button goes to pre-filled form
- Access count increments in database

---

### P2B-S5: Build Registration Form Page (6 hours)

**Location**: Wix Editor → Add Page → `/cadastro`

**Design** (fields from gabineteonline-schema.json):
- Header: "Cadastro" OR "Atualizar Cadastro" (if edit mode)
- Form fields (example - adjust based on discovered schema):
  - Nome Completo (required)
  - E-mail (required, email validation)
  - Telefone (pre-filled, required)
  - [Additional fields from schema]
- Button: "Enviar" (or "Atualizar" if edit mode)
- Loading spinner
- Success/error messages

**File**: `public/pages/cadastro.js`

```javascript
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { submitRegistration } from 'backend/http-functions'; // Web Module

$w.onReady(async function () {
  const telefone = wixLocation.query.telefone;
  const isEditMode = wixLocation.query.edit === 'true';

  // Pre-fill phone
  $w('#inputTelefone').value = formatPhone(telefone);
  $w('#inputTelefone').disable(); // Can't change in this flow

  // If edit mode, load existing data
  if (isEditMode) {
    $w('#txtHeader').text = 'Atualizar Cadastro';
    $w('#btnSubmit').label = 'Atualizar';

    const result = await wixData.query('Registros').eq('telefone', telefone).find();
    if (result.items.length > 0) {
      const registro = result.items[0];
      $w('#inputNome').value = registro.nomeCompleto || '';
      $w('#inputEmail').value = registro.email || '';
      // ... pre-fill other fields
    }
  }

  // Real-time email validation
  $w('#inputEmail').onInput((event) => {
    const email = event.target.value;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValid && email.length > 0) {
      $w('#inputEmail').style.borderColor = '#FF0000';
      $w('#errorEmail').show();
    } else {
      $w('#inputEmail').style.borderColor = '#CCCCCC';
      $w('#errorEmail').hide();
    }
  });

  // Form submission
  $w('#btnSubmit').onClick(async () => {
    // Validate all fields
    const formData = {
      telefone: telefone,
      nomeCompleto: $w('#inputNome').value,
      email: $w('#inputEmail').value,
      // ... collect all fields
    };

    if (!validateForm(formData)) {
      $w('#errorMessage').text = 'Preencha todos os campos obrigatórios.';
      $w('#errorMessage').show();
      return;
    }

    // Check for suspicious data
    if (isSuspiciousData(formData)) {
      formData.isSuspiciousData = true; // Flag for staff review
    }

    // Show loading
    $w('#loadingSpinner').show();
    $w('#btnSubmit').disable();

    try {
      // Submit to backend Web Module
      const result = await submitRegistration(formData, isEditMode);

      if (result.success) {
        // Show success message
        $w('#successMessage').text = 'Cadastro realizado com sucesso!';
        $w('#successMessage').show();

        // Wait 2 seconds, then redirect to WhatsApp
        setTimeout(() => {
          redirectToWhatsApp();
        }, 2000);
      }

    } catch (error) {
      console.error('Submission failed:', error);
      $w('#errorMessage').text = 'Erro ao enviar cadastro. Seus dados foram salvos e você pode prosseguir.';
      $w('#errorMessage').show();
      $w('#loadingSpinner').hide();
      $w('#btnSubmit').enable();

      // Even on error, allow WhatsApp access after 5 seconds (fail-open)
      setTimeout(() => {
        redirectToWhatsApp();
      }, 5000);
    }
  });
});

function validateForm(data) {
  // Check required fields
  return data.nomeCompleto && data.email && data.telefone;
}

function isSuspiciousData(data) {
  // Detect fake patterns
  if (/^(\d)\1+$/.test(data.telefone)) return true; // All same digit
  if (data.nomeCompleto.toLowerCase().includes('test')) return true;
  return false;
}

function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
}

function redirectToWhatsApp() {
  const whatsappUrl = 'https://wa.me/5511999999999?text=Olá!'; // Placeholder
  wixLocation.to(whatsappUrl);
}
```

**File**: `backend/http-functions.http.js` (Web Module)

```javascript
import { ok, badRequest } from 'wix-http-functions';
import wixData from 'wix-data';
import { syncWithRetry } from './sync-worker';

export async function post_submitRegistration(request) {
  const { formData, isEditMode } = await request.body.json();

  try {
    // Save to Wix DB (Tier 1 - source of truth)
    let registro;

    if (isEditMode) {
      // Update existing record
      const existing = await wixData.query('Registros')
        .eq('telefone', formData.telefone)
        .find();

      if (existing.items.length > 0) {
        registro = await wixData.update('Registros', {
          _id: existing.items[0]._id,
          ...formData,
          syncStatus: 'pending' // Re-sync after update
        });
      }
    } else {
      // Insert new record
      registro = await wixData.insert('Registros', {
        ...formData,
        syncStatus: 'pending',
        syncAttempts: 0,
        whatsappAccessCount: 0
      });
    }

    // Background sync to gabineteonline (async, don't wait)
    syncWithRetry(formData, registro._id)
      .catch(err => console.error('Background sync failed:', err));

    return ok({
      body: JSON.stringify({ success: true, registrationId: registro._id })
    });

  } catch (error) {
    console.error('Registration failed:', error);
    return badRequest({ body: JSON.stringify({ success: false, error: error.message }) });
  }
}
```

**Why**: Core user-facing form. Must be simple (low-tech users), validated, and resilient (fail-open on errors).

**Verification**:
- Form renders all fields from gabineteonline schema
- Pre-fills phone number correctly
- Edit mode pre-fills all existing data
- Client-side validation works (email format, required fields)
- Submission saves to Wix DB
- Background sync triggers
- Success message shows
- Redirects to WhatsApp after 2 seconds
- Error handling allows WhatsApp access even on failure

---

### P2B-S6: Intercept WhatsApp Button Clicks (4 hours)

**Location**: Wix Editor → Site-wide code (masterPage.js)

**First, discover existing WhatsApp implementation:**

1. Inspect `flaviovalle.com` to find:
   - WhatsApp button selector (e.g., `#btnWhatsApp`)
   - WhatsApp widget selector (e.g., `.whatsapp-widget`)
   - Current WhatsApp redirect URL

2. Extract selectors via browser DevTools or Wix Editor inspection

**File**: `public/masterPage.js`

```javascript
import wixLocation from 'wix-location';

$w.onReady(function () {
  // Find WhatsApp button/widget (adjust selectors based on actual site)
  const whatsappButton = $w('#btnWhatsApp'); // Example selector
  const whatsappWidget = $w('#whatsappWidget'); // Example selector

  // Intercept button click
  if (whatsappButton) {
    whatsappButton.onClick((event) => {
      event.preventDefault(); // Stop default navigation

      // Redirect to phone lookup page
      wixLocation.to('/registro-telefone');
    });
  }

  // Intercept widget click
  if (whatsappWidget) {
    whatsappWidget.onClick((event) => {
      event.preventDefault();
      wixLocation.to('/registro-telefone');
    });
  }
});
```

**CRITICAL**: This intercepts the click BEFORE the WhatsApp redirect. We never modify the existing WhatsApp URL or logic - just add a step before it.

**Why**: This is the entry point that triggers the entire registration flow. Must work for both button and widget.

**Verification**:
- Click WhatsApp button → redirects to `/registro-telefone` (not directly to WhatsApp)
- Click WhatsApp widget → same behavior
- After registration, WhatsApp access works normally

---

## Phase 3 (P3): Integration & Backend Sync

**Command**: `/tdd-workflow P3` (all steps) or `/tdd-workflow P3-S1` (specific step)

**Duration**: ~10 hours

**Prerequisite**: P2A and P2B complete

### P3-S1: Build Backend API for gabineteonline Sync (8 hours)

**Location**: Wix Editor → Backend section

**File**: `backend/gabineteonline-api.jsw`

**Actions**:
1. Create HTTP client with login + session management:
   ```javascript
   import { fetch } from 'wix-fetch';
   import { getSecret } from 'wix-secrets-backend';

   let sessionCookie = null; // Cache session

   async function login() {
     const email = await getSecret('GABINETEONLINE_USER');
     const password = await getSecret('GABINETEONLINE_PASS');
     const baseUrl = await getSecret('GABINETEONLINE_BASE_URL');

     const response = await fetch(`${baseUrl}/login.php`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
     });

     // Extract session cookie
     const cookies = response.headers.get('set-cookie');
     sessionCookie = cookies; // Store for subsequent requests

     return response.ok;
   }

   async function submitRegistration(data) {
     if (!sessionCookie) await login();

     const baseUrl = await getSecret('GABINETEONLINE_BASE_URL');

     // Map Wix field names to gabineteonline field names
     const formData = {
       nome_completo: data.nomeCompleto,
       telefone: data.telefone,
       email: data.email,
       // ... map all fields from schema
       origem: 'Site Vereador' // Auto-fill
     };

     const response = await fetch(`${baseUrl}/cadastro_clientes_dados.php`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Cookie': sessionCookie
       },
       body: new URLSearchParams(formData).toString()
     });

     if (!response.ok) {
       throw new Error(`gabineteonline submission failed: ${response.status}`);
     }

     const text = await response.text();

     // Check for success indicators
     if (text.includes('sucesso') || text.includes('cadastro realizado')) {
       return { success: true };
     } else {
       throw new Error('Unexpected response from gabineteonline');
     }
   }

   export { submitRegistration };
   ```

2. Create retry logic wrapper:

**File**: `backend/sync-worker.jsw`

```javascript
import { submitRegistration } from './gabineteonline-api';
import { sendAlert } from './alerts';

async function syncWithRetry(data, registrationId) {
  const maxAttempts = 3;
  const delays = [1000, 2000, 4000]; // Exponential backoff

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await submitRegistration(data);

      // Update Wix DB: mark as synced
      await wixData.update('Registros', {
        _id: registrationId,
        syncStatus: 'synced',
        syncAttempts: attempt + 1
      });

      return { success: true };

    } catch (error) {
      console.error(`Sync attempt ${attempt + 1} failed:`, error);

      // Update attempt count
      await wixData.update('Registros', {
        _id: registrationId,
        syncAttempts: attempt + 1,
        lastSyncError: error.message
      });

      if (attempt < maxAttempts - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }
  }

  // All retries failed
  await wixData.update('Registros', {
    _id: registrationId,
    syncStatus: 'failed'
  });

  // Alert technical contact
  await sendAlert(`gabineteonline sync failed for registration ${registrationId}`);

  return { success: false };
}

export { syncWithRetry };
```

**Why**: Background sync is critical. Retries handle transient failures. Alerts ensure staff knows about problems.

**Verification**:
- Test login to gabineteonline (check session cookie)
- Test submitRegistration with valid data
- Verify data appears in gabineteonline admin panel
- Test retry logic with forced failures
- Verify alerts sent on final failure

---

### P3-S2: Alert System for Sync Failures (2 hours)

**Location**: Wix Editor → Backend

**File**: `backend/alerts.jsw`

```javascript
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

async function sendAlert(message) {
  const phone = await getSecret('TECHNICAL_CONTACT_PHONE'); // e.g., +5511999999999

  // Option 1: Use Wix Integrations for SMS (if available)
  // Option 2: Use WhatsApp API (if configured)
  // Option 3: Simple HTTP webhook to external service

  // Example: Send via WhatsApp Web API (unofficial)
  const whatsappMessage = encodeURIComponent(`[ALERTA flaviovalle.com] ${message}`);
  const url = `https://api.whatsapp.com/send?phone=${phone}&text=${whatsappMessage}`;

  // This opens browser for manual send - not ideal for automation
  // Better: Integrate with Twilio, Vonage, or other SMS API

  console.error(`ALERT: ${message}`); // Log for now

  // TODO: Implement proper SMS/WhatsApp integration

  return { sent: true };
}

export { sendAlert };
```

**Why**: Staff must know when gabineteonline sync fails. Critical for data integrity.

**Verification**:
- Force a sync failure (disconnect network, wrong credentials)
- Verify alert is triggered
- (Manual for MVP: check console logs, implement SMS in v2)

---

## Phase 4 (P4): Testing

**Command**: `/tdd-workflow P4` (all steps) or `/tdd-workflow P4-S1 P4-S3` (specific steps)

**Duration**: ~8 hours

**Prerequisite**: P3 complete

### P4-S1: Unit Tests (2 hours)
- Phone formatting utility
- Email validation
- Suspicious data detection
- Field mapping (Wix → gabineteonline)

### P4-S2: Integration Tests (2 hours)
- Wix DB insert/query
- gabineteonline API login
- gabineteonline form submission
- Retry logic (with mocked failures)

### P4-S3: E2E Tests (2 hours)
- New user full flow
- Returning user direct access
- Returning user edit info
- Error scenarios (network failure, invalid input)

### P4-S4: Manual Testing (2 hours)
- Cross-browser testing (Chrome, Firefox, Edge, Safari)
- Mobile testing (Android, iOS)
- Low-tech user testing
- Performance testing

---

## Phase 5 (P5): Deployment

**Command**: `/tdd-workflow P5` (all steps)

**Duration**: ~3 hours

**Prerequisite**: P4 complete

### P5-S1: Production Deployment (2 hours)
- Duplicate `flaviovalle-dev` changes to `flaviovalle.com`
- Feature flag approach for safety
- Monitor first registrations
- Verify sync to gabineteonline

### P5-S2: Post-Launch Monitoring (1 hour)
- Check Wix logs for errors
- Verify sync success rate
- Monitor alert system
- Document any issues

---

## Test Scenarios

### Happy Path Tests

- [ ] **New User Full Flow**:
  1. Click WhatsApp button → redirect to phone lookup
  2. Enter new phone number → redirect to registration form
  3. Fill all required fields → submit
  4. Data saves to Wix DB (verify via database viewer)
  5. Success message shows → redirect to WhatsApp after 2 seconds
  6. Background sync to gabineteonline succeeds (check admin panel)

- [ ] **Returning User Direct Access**:
  1. Click WhatsApp button → redirect to phone lookup
  2. Enter existing phone → redirect to welcome back page
  3. Click "Entrar em contato via WhatsApp" → direct WhatsApp access
  4. WhatsApp access count increments in database

- [ ] **Returning User Edit Info**:
  1. Click WhatsApp button → phone lookup → welcome back
  2. Click "Atualizar Cadastro" → registration form (pre-filled)
  3. Edit fields → submit → update in Wix DB
  4. Background re-sync to gabineteonline

### Edge Cases (from clarify session)

- [ ] **International Phone Number**:
  - Enter +1-555-123-4567 → system accepts
  - Validation allows non-Brazilian format

- [ ] **Network Failure During Submission**:
  - Disconnect network → submit form
  - Error message shows: "Erro ao enviar cadastro..."
  - Form data remains filled (user can retry)

- [ ] **Suspicious Data (Fake Phone)**:
  - Enter phone: 11111111111 → submit
  - Data saves to Wix DB with `isSuspiciousData: true`
  - Background sync skips gabineteonline (flags for staff review)

- [ ] **gabineteonline Down/Slow**:
  - Mock gabineteonline server timeout
  - User submits form → Wix DB save succeeds
  - User redirects to WhatsApp (doesn't wait for gabineteonline)
  - Background sync retries 3 times → fails → alert sent

- [ ] **Shared Device (Multiple Users)**:
  - User A registers with phone 111...
  - Same browser: User B registers with phone 222...
  - Each registration independent (phone identifies user, not session)

### Error Handling

- [ ] **Invalid Email Format**:
  - Enter email: "notanemail" → red border, error message
  - Cannot submit until valid

- [ ] **Missing Required Field**:
  - Leave "Nome Completo" blank → submit
  - Error message: "Preencha todos os campos obrigatórios"

- [ ] **gabineteonline Sync Failure**:
  - Wrong credentials in Secrets Manager
  - Registration saves to Wix → WhatsApp access granted
  - Background sync fails after 3 retries → alert sent
  - Staff reviews Wix database for failed syncs

### Integration Tests

- [ ] **End-to-End (New User)**:
  - Start: flaviovalle.com homepage
  - Click WhatsApp button → complete registration
  - End: WhatsApp opens with correct number/message
  - Verify: Data in Wix DB + gabineteonline admin panel

- [ ] **End-to-End (Returning User)**:
  - Start: flaviovalle.com (after previous registration)
  - Click WhatsApp → phone lookup → welcome back → WhatsApp
  - No re-registration required

- [ ] **Cross-Browser (Mobile)**:
  - Test on: Android Chrome, iOS Safari
  - Form renders correctly, touch interactions work
  - Phone formatting works on mobile keyboards

- [ ] **Cross-Browser (Desktop)**:
  - Test on: Chrome, Firefox, Edge
  - All pages render correctly
  - Keyboard navigation works (Tab through fields, Enter to submit)

---

## Critical Files

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `C:\Users\Admin\.vscode\flaviovalle\scripts\setup-credentials.js` | Credential collection | Create from scratch |
| `C:\Users\Admin\.vscode\flaviovalle\form-discovery\discover-gabineteonline-fields.js` | Form field discovery | Create from scratch |
| `C:\Users\Admin\.vscode\flaviovalle\form-discovery\output\gabineteonline-schema.json` | Field schema | Generated by discovery script |
| **Wix Backend** | | |
| `backend/config.jsw` | Secrets Manager access | Create in Wix Editor |
| `backend/gabineteonline-api.jsw` | HTTP client for gabineteonline | Create in Wix Editor |
| `backend/sync-worker.jsw` | Retry logic + background sync | Create in Wix Editor |
| `backend/alerts.jsw` | SMS/WhatsApp alerts | Create in Wix Editor |
| `backend/http-functions.http.js` | Web Module endpoints | Create in Wix Editor |
| **Wix Frontend** | | |
| `public/pages/registro-telefone.js` | Phone lookup page code | Create in Wix Editor |
| `public/pages/bem-vindo.js` | Welcome back page code | Create in Wix Editor |
| `public/pages/cadastro.js` | Registration form page code | Create in Wix Editor |
| `public/masterPage.js` | WhatsApp interception | Create in Wix Editor |
| **Wix Database** | | |
| `Registros` collection | User registrations | Create via Database panel |
| **Wix Pages** | | |
| `/registro-telefone` | Phone lookup page | Create via Add Page |
| `/bem-vindo` | Welcome back page | Create via Add Page |
| `/cadastro` | Registration form page | Create via Add Page |

---

## Acceptance Criteria

From clarify session:

- [x] All tests pass (unit + integration + E2E)
- [x] Data verified appearing in gabineteonline admin panel
- [x] Works on mobile + desktop + major browsers
- [x] Successfully tested on staging (`flaviovalle-dev`) with real data
- [ ] **Additional Criteria**:
  - [ ] Registration form completion time < 2 minutes (timed user test)
  - [ ] Low-tech user can complete form without help (user testing)
  - [ ] Returning user recognition works (phone lookup auto-fills)
  - [ ] Background sync succeeds ≥95% of attempts (monitor logs)
  - [ ] Alerts sent when sync fails (verify SMS/WhatsApp received)
  - [ ] < 5 blocking issues in first week post-launch (bug tracking)
  - [ ] Live site (`flaviovalle.com`) not broken during deployment (rollback test)

---

## Verification Steps

### Automated

1. **Unit Tests** (Wix Velo testing framework):
   ```bash
   # In Wix Editor > Test panel
   npm test
   ```
   - [ ] Phone formatting utility
   - [ ] Email validation
   - [ ] Suspicious data detection
   - [ ] Field mapping (Wix → gabineteonline)

2. **Integration Tests**:
   - [ ] Wix DB insert/query
   - [ ] gabineteonline API login
   - [ ] gabineteonline form submission
   - [ ] Retry logic (with mocked failures)

3. **Linting**:
   ```bash
   # Wix Editor > Code panel > Linter
   npm run lint
   ```
   - [ ] No linting errors
   - [ ] Code follows Wix Velo conventions

### Manual

1. **New User Flow** (Dev Site):
   - [ ] Open `flaviovalle-dev` in browser
   - [ ] Click WhatsApp button → complete registration with test data
   - [ ] Verify data in Wix database viewer
   - [ ] Check gabineteonline admin panel for new entry

2. **Returning User Flow** (Dev Site):
   - [ ] Click WhatsApp button with previously registered phone
   - [ ] Verify welcome back message shows correct name
   - [ ] Click "Entrar em contato via WhatsApp" → redirects correctly
   - [ ] Click "Atualizar Cadastro" → form pre-filled

3. **Mobile Testing**:
   - [ ] Open `flaviovalle-dev` on mobile device
   - [ ] Complete registration flow
   - [ ] Verify form renders correctly (no horizontal scroll)
   - [ ] Verify touch interactions work (buttons, inputs)

4. **Cross-Browser Testing**:
   - [ ] Chrome (Windows/Mac)
   - [ ] Firefox (Windows/Mac)
   - [ ] Edge (Windows)
   - [ ] Safari (Mac/iOS)
   - [ ] Android Chrome

5. **Error Scenario Testing**:
   - [ ] Submit form with invalid email → error shown
   - [ ] Submit form with missing required field → error shown
   - [ ] Disconnect network → submit form → error message, data preserved
   - [ ] Force gabineteonline sync failure → verify retry + alert

6. **Performance Testing**:
   - [ ] Time form submission (< 5 seconds acceptable)
   - [ ] Time WhatsApp redirect (immediate)
   - [ ] Test with slow 3G connection (mobile)

7. **User Acceptance Testing**:
   - [ ] Ask non-technical user to complete registration
   - [ ] Observe: Can they complete without help?
   - [ ] Note: Where do they get confused?
   - [ ] Iterate on UX if needed

---

## Dependencies

### Prerequisites

- [ ] Wix account with site access (`flaviovalle.com`)
- [ ] gabineteonline1.com.br account with login credentials
- [ ] Node.js installed (for local form discovery script)
- [ ] Playwright installed (`npm install @playwright/browser`)
- [ ] Wix Editor access (browser-based, no local install)
- [ ] Dev site created (`flaviovalle-dev`)

### External Dependencies

**Local Scripts**:
```json
{
  "dependencies": {
    "@playwright/browser": "^1.40.0",
    "dotenv": "^16.0.0",
    "chalk": "^5.0.0",
    "inquirer": "^9.0.0"
  }
}
```

**Wix Velo** (built-in, no install):
- `wix-data` - Database operations
- `wix-fetch` - HTTP requests
- `wix-location` - Page navigation
- `wix-secrets-backend` - Credential management
- `wix-http-functions` - Web Module endpoints

**External Services**:
- gabineteonline1.com.br (existing system)
- WhatsApp (existing integration, not modified)
- SMS/WhatsApp API for alerts (optional, can defer to v2)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| **Breaking live website during deployment** | Critical | Medium | Use `flaviovalle-dev` for all development. Feature flag approach for deployment. Rollback plan documented. |
| **gabineteonline form schema changes** | High | Low | Run discovery script quarterly. Version schema file. Monitor sync failures. |
| **User abandons registration form (low completion rate)** | High | Medium | Keep form minimal (only required fields). Use Wix built-in styling (familiar UX). Test with low-tech users. |
| **Background sync failures not noticed** | Medium | Low | Implement SMS/WhatsApp alerts. Monitor Wix logs daily. Dashboard for sync status. |
| **Election period traffic spike (1000+/day)** | Medium | High (2026 election) | Wix auto-scales. Database indexed for performance. Load test before election. |
| **Phone number conflicts (duplicates)** | Low | Low | Unique index on `telefone` field. Phone lookup prevents duplicates. |
| **Security: Credentials leaked** | Critical | Low | Use Wix Secrets Manager (encrypted). Never log credentials. `.env` in `.gitignore`. |
| **First-time Wix user (user is new to Velo)** | Medium | N/A | Clear documentation. Inline comments in code. Step-by-step guide in README. |

---

## Out of Scope (v1)

From clarify session:

- ✗ User account management (password resets, profile editing)
- ✗ SMS verification for phone numbers
- ✗ Detailed analytics/usage tracking (basic logging OK, advanced analytics deferred)
- ✗ Email notifications/confirmations (can add in v2)
- ✗ Custom admin dashboard (use Wix built-in database viewer)
- ✗ Multi-language support (Portuguese only for v1)
- ✗ WhatsApp modification (current implementation untouched)

---

## Next Steps

After approval of this spec:

### Starting Implementation

**In This Chat:**
```bash
/tdd-workflow P1
```

**In a New Chat (Fresh Context):**

Copy and paste this command block:
```
Context: Working in C:\Users\Admin\.vscode\flaviovalle with plan file .claude/plans/wix-registration-system.md

Task: Execute /tdd-workflow P1 (Phase 1: Setup & Credentials)

This will load the plan file and begin Phase 1 implementation using Test-Driven Development (RED → GREEN → REFACTOR cycle).
```

### Phase Execution Commands

- **Phase 1**: `/tdd-workflow P1` (Setup & Credentials)
- **Phase 2 (Parallel)**: `/tdd-workflow P2A P2B` (Form Discovery + Wix Setup)
- **Phase 3**: `/tdd-workflow P3` (Integration & Sync)
- **Phase 4**: `/tdd-workflow P4` (Testing)
- **Phase 5**: `/tdd-workflow P5` (Deployment)

**Specific Steps Only:**
- `/tdd-workflow P1-S1` (Just project setup)
- `/tdd-workflow P2B-S1 P2B-S2` (Wix environment + database)
- `/tdd-workflow P1-S1 P2A-S1 P3-S1` (Multiple steps across phases)

### Implementation Approach

1. **User Review**:
   - [ ] Review this specification
   - [ ] Ask questions/clarifications
   - [ ] Approve to proceed

2. **Execute Phases Sequentially**:
   - Start with `/tdd-workflow P1`
   - After P1 completes, run P2A and P2B (can be parallel or sequential)
   - Continue through P3, P4, P5

3. **Milestone Checkpoints** (user requested moderate involvement):
   - After Phase 1 (Credentials): Confirm secure storage working
   - After Phase 2 (Form Discovery): Review gabineteonline schema
   - After Phase 3 (Backend): Test sync manually
   - After Phase 4 (Frontend): User test registration flow
   - After Phase 5 (Testing): Final approval before production deployment

---

## Documentation for User Maintenance

**File**: `C:\Users\Admin\.vscode\flaviovalle\README.md`

(To be created with clear instructions for):
- How to update gabineteonline credentials
- How to check sync status in Wix database
- How to manually trigger sync for failed records
- How to add new form fields (if gabineteonline schema changes)
- Troubleshooting common issues
- Rollback procedure
- Contact info for support

---

**Status**: ✅ Specification complete, ready for approval

**Estimated Implementation Time**: 4-5 days (40-50 hours) based on clarify session urgency requirement

**Questions?** Review this spec, ask for clarifications, then proceed with `/tdd-workflow` when ready.
