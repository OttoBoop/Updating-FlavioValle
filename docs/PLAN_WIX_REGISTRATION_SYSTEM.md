# Wix Registration Gate — Implementation Plan

**Generated:** 2026-02-10
**Revised:** 2026-02-12 (v3 — single-page architecture, live site with previews)
**Status:** Draft
**Supersedes:** v2 (dev site approach), v1 (3-page flow)
**Discovery Sources:**
- Discovery session 2026-02-11 (dev workflow, 6 categories)
- Site exploration 2026-02-11 (live site structure, WhatsApp mapping)
- Deep exploration 2026-02-12 (/participe form mapping, Velo API research)
- Discovery session 2026-02-12 (v3 — single-page, live previews, sync strategy)

---

## 1. Executive Summary

Enhance the existing `/participe` page on flaviovalle.com to intercept WhatsApp contact attempts, collect constituent data via an expanded registration form, save to Wix DB, and batch-sync registrations to gabineteonline1.com.br. This eliminates manual data entry by office staff, reducing ~30% data entry errors and saving ~20 staff hours per week.

**v3 Changes:** Single-page architecture on existing `/participe` (not 3 new pages). Develop on LIVE site with Wix previews (not blank dev site). All gabineteonline fields supported with hidden toggle. Batch sync (hours, not real-time). Try Wix `.jsw` sync first, Render proxy as fallback. xajax protocol discovery corrects F2 assumptions.

---

## 2. Requirements Summary

### 2.1 Problem Statement

The vereador office at **flaviovalle.com** has a manual, error-prone registration process:
- Constituents click WhatsApp button/widget → contact office directly
- Staff manually register constituents afterward at **gabineteonline1.com.br**
- Results in ~30% data entry errors, ~40% missed registrations, 20 staff hours/week wasted

### 2.2 Target Users

| User | Skill Level | Needs |
|------|-------------|-------|
| **Constituents** (primary) | LOW — mixed ages, many struggle with basic web forms | Simple UI, clear guidance, mobile-friendly, Portuguese only |
| **Office Staff** (secondary) | Basic — 2-5 people | Sync status visibility, failure alerts, no manual data entry |
| **Site Maintainer** (tertiary) | User (project owner), new to Wix | Clear documentation, maintainable code |

### 2.3 Success Criteria

- [ ] Registration form works on mobile + desktop + major browsers
- [ ] Data appears in Wix database AND gabineteonline admin panel
- [ ] Returning users recognized by phone number (no re-registration)
- [ ] Form completion < 2 minutes
- [ ] Background sync succeeds ≥95% of attempts (batch, within hours)
- [ ] Alerts sent when sync fails (SMS/WhatsApp to technical contact)
- [ ] < 5 blocking issues in first week post-launch
- [ ] Live site (flaviovalle.com) not broken — use previews for testing
- [ ] All gabineteonline fields available (hidden by default, toggleable)

### 2.4 Explicitly Out of Scope

- Building on the blank `flaviovalle-dev` site (saved for future major overhauls)
- SMS verification for phone numbers
- Detailed analytics/usage tracking (basic logging only for v1)
- Email notifications/confirmations (v2)
- Custom admin dashboard (use Wix built-in database viewer)
- Multi-language support (Portuguese only)
- Footer form redesign (pending design team discussion — see Section 12)

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    flaviovalle.com (LIVE SITE)                       │
│                    Development via Wix preview                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │              /participe (SINGLE PAGE)                    │       │
│  │                                                         │       │
│  │  ┌─────────────┐    ┌────────────────────────┐         │       │
│  │  │ Phone Input │ -> │ Returning? Welcome Back │ -> WhatsApp
│  │  └──────┬──────┘    └────────────────────────┘         │       │
│  │         │                                               │       │
│  │         └──> ┌──────────────────────────────┐          │       │
│  │              │ Registration Form             │          │       │
│  │              │ (all gabinete fields,         │          │       │
│  │              │  hidden toggle for extras)    │          │       │
│  │              └──────────┬───────────────────┘          │       │
│  │                         │                               │       │
│  │                         v                               │       │
│  │              ┌──────────────────┐                      │       │
│  │              │ Wix DB "Registros"│ (Source of Truth)    │       │
│  │              └──────────┬───────┘                      │       │
│  └─────────────────────────┼───────────────────────────────┘       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              │ Batch Sync (hours, 3 retries)
                              │ Try: Wix .jsw → Fallback: Render proxy
                              v
                     ┌────────────────────┐
                     │ gabineteonline1    │
                     │ .com.br            │
                     │ (xajax protocol)   │
                     │ (Turnstile CAPTCHA)│
                     └────────────────────┘
```

### 3.2 Development Workflow

```
flaviovalle.com (LIVE SITE — work here with previews)
       ↓ Wix CLI auth
Local IDE (write Velo code here)
       ↓ wix preview (generates preview URL)
Preview URL (test features without publishing)
       ↓ journey agent (visual verification on preview)
User approval
       ↓ wix publish (goes live)
flaviovalle.com (changes visible to public)
```

**Key Principle:** Work directly on the live site using `wix preview` for testing. DO NOT publish until preview + journey agent + user approval are all complete.

**Note:** `flaviovalle-dev` (blank site) is preserved for future major overhauls but NOT used for this iteration.

### 3.3 Data Flow

**Single-Page User Flow on `/participe`:**
1. User clicks WhatsApp widget → redirected to `/participe` (configured in Wix Editor)
2. `/participe` page code checks if user is returning (phone in DB)
   - IF returning → show "Bem-vindo de volta, [Apelido]!" + direct WhatsApp link + "Atualizar Cadastro" option
   - IF new → show enhanced registration form
3. User fills form (required: Nome Completo, Apelido, Celular; optional: everything else)
4. On submit:
   - Save to Wix DB "Registros" (immediate, source of truth)
   - Mark `syncStatus: "pending"`
   - Redirect to WhatsApp (`wa.me/5521978919938`)
5. Background batch job syncs pending records to gabineteonline (hours cadence)

**Two-Tier Data Architecture:**
- **Tier 1 (Primary):** Wix Database — source of truth, immediate save on form submission
- **Tier 2 (Secondary):** gabineteonline1.com.br — batch sync, 3 retries, alert on failure

### 3.4 Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend page | Existing `/participe` on flaviovalle.com | Already exists, has form fields, avoids creating new pages |
| Frontend logic | Wix Velo (JavaScript) | Built-in, no extra cost, first-party integration |
| Backend logic | Wix Velo Web Modules (.jsw) | Server-side functions within Wix ecosystem |
| Database | Wix Data Collections | Built-in, no extra cost, indexed queries |
| Credentials | Wix Secrets Manager | Encrypted storage, Wix-native |
| Development | Wix CLI (`wix preview`) on live site | Preview without publishing, user approves before publish |
| Local testing | Jest + Wix API mocks | TDD for Velo code without live Wix dependency |
| Sync (primary) | Wix `.jsw` via `wix-fetch` | Try direct sync from Wix backend first |
| Sync (fallback) | Render proxy (`ia-educacao-v2.onrender.com`) | Python endpoint if Wix can't handle xajax/CAPTCHA |
| Monitoring | Wix Logs + SMS/WhatsApp alerts | No paid services required |

### 3.5 Integration Points

| System | Direction | Protocol | Notes |
|--------|-----------|----------|-------|
| **gabineteonline1.com.br** | Wix → gabinete | xajax over HTTP POST | Session cookie auth. Try `wix-fetch` in .jsw, fallback to Render proxy |
| **WhatsApp** | Wix → WhatsApp | URL redirect | `wa.me/5521978919938`. Widget link changed to `/participe` in Wix Editor |
| **Render backend** | Wix → Render | HTTPS REST | Fallback sync proxy at `/api/gabinete-sync` if Wix .jsw can't handle xajax |
| **SMS/WhatsApp Alerts** | Wix → Phone | TBD (Wix Automations or webhook) | Alert staff on sync failures |

### 3.6 Critical Technical Context

**gabineteonline uses xajax protocol (NOT simple HTTP POST):**
```
Request format:
  POST /flaviovalle/cadastroclientes_dados.php
  Content-Type: application/x-www-form-urlencoded
  Body: xajax=CadastrarClienteDados&xajaxr=[timestamp]&xajaxargs[]=[encoded-form-data]

Response format:
  XML with <xjx> root containing <cmd> elements
```

**gabineteonline login has Cloudflare Turnstile CAPTCHA:**
- Sitekey: `0x4AAAAAAA6QJue2Fkes3Jsu`
- Honeypot field: `input#current-password` (must NOT be filled)
- Login fields: `input#txtusuario`, `input#txtsenha`, `button.btn-login`
- Success indicator: URL contains `index.php`

**Evidence files:**
- `general_scraper/xajax_request.txt` — captured real xajax request
- `general_scraper/xajax_response.txt` — captured real xajax XML response
- `general_scraper/cadastrar_cliente_func.js` — client-side validation function
- `general_scraper/profiles/gabineteonline.yaml` — full login profile with CAPTCHA info

---

## 4. Feature Breakdown

### Feature 1: Setup & Credentials (F1) ✅ COMPLETE

**Tasks:**
| ID | Task | Status |
|----|------|--------|
| F1-T1 | Create project directory structure and initialize Node.js | ✅ Done |
| F1-T2 | Build secure credential collection and encryption system | ✅ Done |

---

### Feature 2: Form Discovery (F2) ✅ COMPLETE (with corrections)

**Tasks:**
| ID | Task | Status |
|----|------|--------|
| F2-T1 | Discover gabineteonline form fields (184 fields, 38 visible) | ✅ Done |

**CORRECTION (2026-02-12):** F2 originally stated "gabineteonline uses standard HTML form POST." **WRONG.** It uses **xajax protocol** (XML-based AJAX). The `CadastrarClienteDados` JS function serializes form data and sends via xajax. This affects the sync approach in F4-T5/F4-T6.

---

### Feature 3: Wix Environment Setup (F3) — REVISED

**User Story:** As a developer, I want the Wix CLI connected to flaviovalle.com so that I can write Velo code locally and preview it.

**Acceptance Criteria:**
- [ ] Wix CLI authenticated and connected to flaviovalle.com
- [ ] `wix preview` generates a working preview URL
- [ ] DB collection `Registros` created with proper schema
- [ ] Wix API mock library enables local Jest testing

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F3-T1 | ~~Dashboard automation~~ **REVISED:** Install Wix CLI, authenticate (`wix login`), connect to flaviovalle.com, verify `wix preview` works | F1-T2 | S | ⬜ Needs redo |
| F3-T2 | Create `Registros` DB collection via Wix Dashboard or REST API (all gabineteonline fields, syncStatus, indexes on celular) | F3-T1 | M | ⬜ |
| F3-T3 | Build Wix API mock library (wix-data, wix-fetch, wix-location, wix-secrets) for Jest | None | M | ✅ Done (34 tests) |

**Notes:**
- F3-T1 is simplified: just CLI setup, no Dashboard automation script needed
- F3-T2 `Registros` schema must include ALL gabineteonline fields (see Section 4.4 for field list)
- Old F3-T1 (wix-dashboard-automator.js, 13 tests) is preserved as reference but not used

---

### Feature 4: Pure Logic Modules (F4) — PARTIALLY COMPLETE

**User Story:** As a developer, I want tested, portable logic modules so that validation, mapping, and sync work correctly regardless of runtime.

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F4-T1 | Backend HTTP client for gabineteonline (Node.js reference) | F2-T1 | L | ✅ Done (18 tests) |
| F4-T2 | Phone format validation module | None | S | ✅ Done (21 tests) |
| F4-T3 | Email validation module | None | S | ✅ Done (41 tests) |
| F4-T4 | Suspicious data detection module (CPF mod-11) | None | S | ✅ Done (51 tests) |
| F4-T5 | Port field-mapper + gabinete-client to Wix Velo (.jsw) using wix-fetch | F3-T3, F4-T1 | M | ⬜ |
| F4-T6 | Sync worker: try Wix .jsw xajax sync first, track syncStatus. If xajax fails from wix-fetch, document failure for Render fallback decision | F4-T5 | M | ⬜ |

**Tests for remaining tasks:**
- [ ] Test: F4-T5 — Ported gabinete-client uses `wix-fetch` mock correctly
- [ ] Test: F4-T5 — Ported field-mapper maps ALL gabineteonline fields (not just original 15)
- [ ] Test: F4-T5 — Field mapper handles `nome` + `sobrenome` → concatenated `nome` for gabineteonline
- [ ] Test: F4-T6 — Sync worker formats xajax request correctly (xajax=CadastrarClienteDados&xajaxr=...)
- [ ] Test: F4-T6 — Retry logic attempts 3 times with increasing delays
- [ ] Test: F4-T6 — syncStatus updates correctly (pending → synced | failed)
- [ ] Test: F4-T6 — Sync worker returns failure after 3 failed attempts

**IMPORTANT for F4-T5:** The field mapper must be updated to handle:
- `nome` (Wix) + `sobrenome` (Wix) → concatenated `nome` (gabineteonline)
- `apelido` from "Como gostaria de ser chamado?" field
- ALL gabineteonline fields (not just the original 15 from v1)

---

### Feature 5: `/participe` Page Enhancement (F5) — REWRITTEN

**User Story:** As a constituent visiting flaviovalle.com, I want to register on `/participe` so I can access WhatsApp contact. As a returning user, I want to be recognized and skip registration.

**Acceptance Criteria:**
- [ ] `/participe` page handles phone lookup (returning vs new user)
- [ ] New users see registration form with required fields visible
- [ ] "Nome Completo" label (maps to gabineteonline `nome`)
- [ ] "Como gostaria de ser chamado?" field for apelido (required)
- [ ] All gabineteonline fields available, non-essential hidden by default (toggleable in code)
- [ ] Returning users see welcome message + WhatsApp link + "Atualizar Cadastro"
- [ ] After submission → redirect to WhatsApp (`wa.me/5521978919938`)
- [ ] Works on mobile + desktop

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F5-T1 | Enhance `/participe` form: rename nome→"Nome Completo", add "Como gostaria de ser chamado?" (apelido), add all gabineteonline fields as hidden-by-default toggleable sections | F3-T2 | L | ⬜ |
| F5-T2 | Add phone lookup logic: on page load or phone input blur, query Registros DB. If returning → show welcome back state. If new → show full form | F3-T2, F4-T2 | M | ⬜ |
| F5-T3 | Add form submission handler: validate → save to Wix DB with syncStatus:"pending" → redirect to WhatsApp | F5-T1, F5-T2, F4-T3, F4-T4 | M | ⬜ |
| F5-T4 | Change WhatsApp widget link to `/participe` in Wix Editor. Add masterPage.js code for returning-user bypass (registered users go directly to WhatsApp) | F5-T2 | M | ⬜ |

**Tests:**
- [ ] Test: Phone lookup returns correct routing (existing → welcome, new → register)
- [ ] Test: Registration form validates required fields (Nome Completo, Apelido, Celular)
- [ ] Test: "Nome Completo" + "Sobrenome" concatenated before save
- [ ] Test: Hidden fields can be toggled visible via code flag
- [ ] Test: Form data saved to Wix DB with syncStatus: "pending"
- [ ] Test: WhatsApp redirect fires after successful registration
- [ ] Test: Returning user sees welcome message with their apelido
- [ ] Test: Error state preserves form data for retry

### 4.4 Registros DB Schema (for F3-T2 and F5)

**Required fields (always visible on form):**

| Wix Field | Label (Portuguese) | gabineteonline Field | Type | Max | Required |
|-----------|-------------------|---------------------|------|-----|----------|
| `nomeCompleto` | "Nome Completo" | `nome` | text | 200 | ✅ |
| `apelido` | "Como gostaria de ser chamado?" | `apelido` | text | 30 | ✅ |
| `celular` | "Celular" | `celular` | text | 14 | ✅ |
| `email` | "Email" | `email` | text | 5000 | ✅ |
| `bairro` | "Bairro" | `id_bairro` | dropdown | — | ✅ |

**Optional fields (hidden by default, toggleable):**

| Wix Field | Label (Portuguese) | gabineteonline Field | Type | Max |
|-----------|-------------------|---------------------|------|-----|
| `cpf` | "CPF" | `cpf` | text | 14 |
| `sexo` | "Sexo" | `sexo` | select (1=M, 2=F) | — |
| `dataNascimento` | "Data de Nascimento" | `datanascimento` | text | 10 |
| `telefone` | "Telefone Fixo" | `telefone` | text | 13 |
| `cep` | "CEP" | `cep` | text | 9 |
| `endereco` | "Endereço" | `endereco` | text | 200 |
| `numero` | "Número" | `numero` | text | 100 |
| `complemento` | "Complemento" | `complemento` | text | 200 |
| `uf` | "Estado" | `uf` | select (27 UFs) | — |
| `observacao` | "Observações" | `observacao` | textarea | 500 |
| `titulo` | "Título de Eleitor" | `titulo` | text | 50 |
| `sessao` | "Seção Eleitoral" | `sessao` | text | 30 |

**System fields (not shown on form):**

| Wix Field | Purpose | Default |
|-----------|---------|---------|
| `syncStatus` | Sync tracking | `"pending"` |
| `syncError` | Last error message | `null` |
| `syncAttempts` | Retry counter | `0` |
| `gabineteId` | ID in gabineteonline after sync | `null` |
| `lastSyncAt` | Timestamp of last sync attempt | `null` |

---

### Feature 6: Background Sync to Gabineteonline (F6) — REWRITTEN

**User Story:** As office staff, I want constituent registrations from the website to automatically appear in gabineteonline so I don't have to enter them manually.

**Acceptance Criteria:**
- [ ] Pending records batch-synced to gabineteonline (within hours)
- [ ] Sync handles xajax protocol correctly
- [ ] Failed syncs retry 3 times then alert staff
- [ ] syncStatus tracked per record (pending → synced | failed)

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F6-T1 | Build Wix .jsw sync module: login to gabineteonline via wix-fetch, submit via xajax protocol. Test if wix-fetch can handle cookies + xajax | F4-T5, F4-T6 | L | ⬜ |
| F6-T2 | If F6-T1 fails (wix-fetch can't handle xajax/CAPTCHA): Build Render proxy endpoint (`/api/gabinete-sync`) on IA_Educacao_V2 that receives form data and uses Python to sync | F6-T1 (if failed) | L | ⬜ (contingency) |
| F6-T3 | Build batch sync trigger: Wix scheduled job or manual trigger that queries Registros where syncStatus="pending" and syncs each | F6-T1 or F6-T2 | M | ⬜ |
| F6-T4 | Alert system: notify staff (SMS/WhatsApp) when sync fails after 3 retries | F6-T3 | S | ⬜ |

**Tests:**
- [ ] Test: Sync module formats correct xajax request body
- [ ] Test: Sync module handles login cookies correctly
- [ ] Test: Batch trigger processes all pending records
- [ ] Test: Failed sync increments syncAttempts and retries
- [ ] Test: syncStatus transitions: pending → synced (on success)
- [ ] Test: syncStatus transitions: pending → failed (after 3 failures)
- [ ] Test: Alert fires when record reaches failed state

---

### Feature 7: Verification & Publishing (F7)

**User Story:** As a developer, I want to verify everything works on preview before publishing to the live site.

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F7-T1 | Run journey agent against preview URL (tester persona, verify full flow) | F5-T4, F6-T3 | M | ⬜ |
| F7-T2 | Get user approval on preview | F7-T1 | S | ⬜ |
| F7-T3 | Publish to live site (`wix publish`) and verify | F7-T2 | S | ⬜ |

---

### Feature 8: Footer Form Redesign Options (F8) — DESIGN PROPOSAL ONLY

**Status:** NOT implementing. Creating options document for design team discussion.

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F8-T1 | Document footer form redesign options: (A) delete entirely, (B) wire to same Registros backend, (C) expand fields to match /participe. Include mockups/descriptions for design team review | F5-T3 | S | ⬜ |

---

## 5. Test Strategy

### 5.1 Testing Pyramid

```
tests/
├── unit/           # Pure logic, no external calls (Jest + Wix mocks)
│   ├── phone-validation.test.js      ✅ 21 tests
│   ├── email-validation.test.js      ✅ 41 tests
│   ├── suspicious-data.test.js       ✅ 51 tests
│   ├── field-mapper.test.js          ✅ 18 tests
│   ├── gabinete-client.test.js       ✅ 18 tests
│   ├── wix-mocks.test.js             ✅ 34 tests
│   ├── wix-dashboard-automator.test.js ✅ 13 tests (reference only)
│   ├── sync-worker.test.js           ⬜ (F4-T6)
│   └── velo-field-mapper.test.js     ⬜ (F4-T5)
│
├── integration/    # Against preview URL or real services
│   ├── gabinete-xajax-sync.test.js   ⬜ (F6-T1)
│   └── wix-db-operations.test.js     ⬜ (F3-T2)
│
├── ui/             # Playwright against preview URL
│   ├── participe-form.test.js        ⬜ (F7-T1)
│   └── whatsapp-redirect.test.js     ⬜ (F7-T1)
│
└── journey/        # Journey agent against preview URL
    └── registration-flow.md          ⬜ (F7-T1)
```

**Current status:** 196 unit tests passing (committed), 32 additional passing (MockDataGenerator, uncommitted in general_scraper).

### 5.2 TDD Checklist (Per Task)

```
For EACH task, BEFORE writing implementation:
1. [ ] Write failing test describing expected behavior
2. [ ] Verify test fails for the RIGHT reason
3. [ ] Commit failing test with message: "test: [description]"
4. [ ] Write MINIMUM code to pass test
5. [ ] Verify test passes
6. [ ] Refactor if needed (tests MUST stay green)
7. [ ] Commit with message: "feat: [description]"
```

### 5.3 Testing Commands

```bash
# Navigate to project
cd Updating-FlavioValle/form-discovery

# Run all tests (Jest)
npm test

# Run specific test file
npm test -- field-mapper.test.js

# Run with coverage
npm test -- --coverage

# UI tests against preview URL
npx playwright test tests/ui/ --config=preview.config.js
```

### 5.4 Definition of Done (Before Publishing)

1. ✅ All unit tests pass (Jest)
2. ✅ Preview URL works correctly
3. ✅ Journey agent passes with tester persona
4. ✅ User manually approves preview
5. ✅ `wix publish` executed
6. ✅ Live site verified working

---

## 6. Implementation Phases

### Phase Dependency Graph

```
Phase 1 (F1, F2) ─── DONE
F4-T1..T4 ─── DONE (196 tests)
F3-T3 (mocks) ─── DONE (34 tests)
       │
       ├──> Phase 2: CLI + DB Setup
       │    F3-T1 (Wix CLI on live site) → F3-T2 (Registros DB collection)
       │
       ├──> Phase 3: Velo Logic (needs Phase 2 + F4 done)
       │    F4-T5 (port to Velo) → F4-T6 (sync worker)
       │
       ├──> Phase 4: /participe Enhancement (needs Phase 2 + Phase 3)
       │    F5-T1 (form fields) → F5-T2 (phone lookup) →
       │    F5-T3 (submission handler) → F5-T4 (WhatsApp intercept)
       │
       ├──> Phase 5: Background Sync (needs Phase 3 + Phase 4)
       │    F6-T1 (try Wix .jsw) → F6-T2 (Render fallback if needed) →
       │    F6-T3 (batch trigger) → F6-T4 (alerts)
       │
       └──> Phase 6: Verification & Publish (needs Phase 4 + Phase 5)
            F7-T1 (journey agent) → F7-T2 (user approval) → F7-T3 (publish)
            F8-T1 (footer redesign options doc — can run anytime)
```

### Phase 1: Foundation ✅ COMPLETE
**Completed:** F1-T1, F1-T2, F2-T1, F4-T1, F4-T2, F4-T3, F4-T4, F3-T3
**Tests:** 196 passing

### Phase 2: CLI + DB Setup
**Goal:** Connect Wix CLI to live site, create Registros collection
- [ ] F3-T1: Wix CLI setup + auth on flaviovalle.com
- [ ] F3-T2: Create Registros DB collection (all fields from Section 4.4)

### Phase 3: Velo Logic
**Goal:** Port field mapper and sync worker to Wix Velo
- [ ] F4-T5: Port field-mapper + gabinete-client to .jsw (handle nome+sobrenome→nome concatenation)
- [ ] F4-T6: Sync worker with xajax format, retry logic, syncStatus tracking

### Phase 4: /participe Enhancement
**Goal:** Transform /participe into full registration hub
- [ ] F5-T1: Enhance form (Nome Completo, Apelido, hidden toggleable fields)
- [ ] F5-T2: Phone lookup (returning user detection)
- [ ] F5-T3: Form submission handler (validate → save → redirect WhatsApp)
- [ ] F5-T4: WhatsApp widget link change + masterPage.js for registered-user bypass

### Phase 5: Background Sync
**Goal:** Automated batch sync to gabineteonline
- [ ] F6-T1: Try Wix .jsw sync (xajax + cookies via wix-fetch)
- [ ] F6-T2: Render proxy fallback (if F6-T1 fails)
- [ ] F6-T3: Batch sync trigger (scheduled job or manual)
- [ ] F6-T4: Staff alerts on sync failure

### Phase 6: Verification & Publish
**Goal:** Verify everything on preview, get approval, go live
- [ ] F7-T1: Journey agent on preview URL
- [ ] F7-T2: User approval
- [ ] F7-T3: Publish to live
- [ ] F8-T1: Footer redesign options doc (for design team)

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| wix-fetch can't handle xajax + cookies | Medium | High | F6-T2 Render proxy fallback already planned. Python tools exist (upload_teste_contacts.py) |
| Cloudflare Turnstile blocks automated sync | High | High | Batch sync with persistent session. If Wix fails, Render proxy with browser automation |
| Breaking live site during preview development | Low | Critical | `wix preview` is isolated. Never `wix publish` without user approval + journey verification |
| gabineteonline form schema changes | Low | High | Run discovery quarterly. Version schema file. Monitor sync failures |
| User abandons registration (long form) | Medium | High | Required fields are minimal (3). Optional fields hidden by default. Progressive disclosure |
| Election traffic spike (1000+/day in 2026) | High | Medium | Wix auto-scales. DB indexed on celular. Batch sync handles load smoothly |
| wix-fetch Cookie Support unknown | Medium | High | Research during F4-T5. If cookies don't work, Render proxy is the answer |

---

## 8. Open Questions

- [ ] **wix-fetch Cookie/xajax Support:** Can `wix-fetch` maintain session cookies and send xajax-formatted requests? Critical for F6-T1. If not → Render fallback (F6-T2)
- [ ] **Wix CLI on Live Site:** Can we safely run `wix preview` on the live flaviovalle.com without affecting published content? Verify during F3-T1
- [ ] **gabineteonline Session Expiry:** How long does the session cookie last? If short-lived, sync worker needs re-login logic
- [ ] **Bairro → id_bairro Mapping:** The /participe dropdown has neighborhood names, gabineteonline uses numeric IDs (`id_bairro`). Need a mapping table
- [ ] **Footer Form Decision:** Pending design team discussion. Options documented in F8-T1
- [ ] **Suspicious Data Policy:** Block from gabineteonline entirely, or sync with flag for staff review?
- [ ] **Checkbox Purpose:** The existing checkbox on /participe — what does it do? Consent? Newsletter?
- [ ] **Secrets Manager:** Is Secrets Manager configured on flaviovalle.com? Needed for gabineteonline credentials

---

## 9. Approval Checklist

- [ ] Requirements reviewed by: _____________ Date: _________
- [ ] Architecture reviewed by: _____________ Date: _________
- [ ] Plan approved by: _____________ Date: _________

---

## 10. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-10 | Initial plan created. F1, F2, F4-T1 marked complete | Claude Opus 4.6 |
| 2026-02-11 | **v2 REWRITE:** Restructured F3, extracted F4, added F5/F6. Added Wix CLI workflow, mock library. Deferred production deployment | Claude Opus 4.6 |
| 2026-02-11 | F3-T4, F4-T2, F4-T3, F4-T4, F3-T1 completed via TDD. 196 tests passing | Claude Opus 4.6 |
| 2026-02-11 | Site exploration: mapped live site (7 pages, WhatsApp widget, /participe form). CRITICAL: duplication invalid, /participe is the target | Claude Opus 4.6 |
| 2026-02-12 | Deep exploration: /participe fully mapped, Velo API researched, architecture simplified to single-page | Claude Opus 4.6 |
| 2026-02-12 | **v3 REWRITE:** Single-page architecture on /participe. Live site with previews (not dev site). All gabineteonline fields with hidden toggles. "Nome Completo" + "Como gostaria de ser chamado?" (apelido). Batch sync (hours). Try Wix .jsw first, Render proxy fallback. xajax protocol corrects F2 assumptions. Footer redesign as design proposal only (F8) | Claude Opus 4.6 |

---

## 11. Site Exploration Findings (2026-02-11)

### 11.1 Live Site Structure (flaviovalle.com)

**Navigation (7 pages):**
| Page | URL | Forms | WhatsApp | Notes |
|------|-----|-------|----------|-------|
| Início | `/` | ✅ 2-field footer (nome + phone) | ✅ OG button + floating widget | Main landing page |
| Sobre | `/sobre` | ✅ 1 footer form (`comp-m4uhi0g18`) | ✅ floating widget persists | About page |
| Atuação | `/atuacao` | ✅ 1 footer form (`comp-m4uhi0g18`) | ✅ floating widget persists | Activities page |
| Saiu na Mídia | `/saiunamidia` | ✅ 1 footer form (`comp-m4uhi0g18`) | ✅ floating widget persists | Press page |
| Notícias | `/noticias` | TBD | ✅ floating widget persists | Blog/news |
| **Participe** | **`/participe`** | **✅ 2 forms — MAIN TARGET (see 11.6)** | ✅ floating widget persists | **Registration page** |
| Termos de Uso | `/termos-de-uso-privacidade` | None expected | ✅ floating widget persists | Legal |

### 11.2 WhatsApp Element Map

**Element 1 — Floating Widget (intercept priority: HIGH)**
- **Component ID:** `comp-m6ryux73`
- **Pinned Layer:** `comp-m6ryux73-pinned-layer` (`position: fixed`, covers full viewport 0,0 → 1385x900)
- **Link:** `<a class="j7pOnl" href="https://wa.me/5521978919938">`
- **Intercept strategy:** Change link to `/participe` in Wix Editor

**Element 2 — OG Static Button (intercept priority: MEDIUM)**
- **Component ID:** `comp-m6rymfn3`
- **Link:** `<a class="j7pOnl" href="https://wa.me/5521978919938">`
- **Intercept strategy:** Same as floating widget

**WhatsApp Number:** `+55 21 97891-9938`

### 11.3 Existing Forms — Design Team Decision Pending

**Site-Wide Footer Form (`comp-m4uhi0g18`):**
- Verified on: `/sobre`, `/atuacao`, `/saiunamidia`, `/`
- Fields: `nome-completo` + `phone` + "Enviar" button
- **Decision pending** — see F8-T1 for options document

### 11.4 Plan Corrections Applied in v3

1. ~~Site duplication~~ → Work on live site with previews
2. ~~3 new pages~~ → Single `/participe` page enhancement
3. ~~Simple HTTP POST~~ → xajax protocol (with Turnstile CAPTCHA)
4. ~~Real-time sync~~ → Batch sync (hours)
5. ~~Dev site first~~ → Live site with preview verification

### 11.5 Wix Tools Investigation

**Explored:**
- [x] masterPage.js (runs on ALL pages)
- [x] $w() selector + onClick
- [x] wix-location-frontend
- [x] Backend .jsw modules
- [x] Content Collections (wix-data)
- [x] Secrets Manager (wix-secrets)

**Still needs exploration during F3-T1:**
- [ ] Velo Dev Mode status on live site
- [ ] Existing Data Collections
- [ ] Secrets Manager configuration
- [ ] Page structure in editor (can we add Velo code to /participe?)

### 11.6 `/participe` Page — Deep Form Mapping

**Form 1 — Main Registration Form (`comp-m4wplov41`):**
| # | Field Name | Type | Required | Notes |
|---|-----------|------|----------|-------|
| 1 | `nome` | text | ✅ | Will rename to "Nome Completo" |
| 2 | `sobrenome` | text | ✅ | Last name |
| 3 | `email` | email | ✅ | Email address |
| 4 | `phone` | tel | ✅ | Phone number → maps to `celular` |
| 5 | (checkbox) | checkbox | ❓ | Purpose TBD |
| 6 | `collection_comp-m6z7d0i3` | select | ✅ | Bairro dropdown (Rio neighborhoods) |
| 7 | `textarea_comp-m4wplove4` | textarea | ❓ | Free text → maps to `observacao` |

**Form 2 — Footer Form (`comp-m4uhi0g18`):**
- Same as all pages (2 fields). Decision pending (F8-T1).

---

## 12. Footer Form Redesign Options (for Design Team)

**Current state:** Site-wide footer component `comp-m4uhi0g18` with 2 fields (nome-completo + phone) appears on ALL pages.

**Option A: Delete entirely**
- Remove footer forms from all pages
- `/participe` is the only registration entry point
- Simplest, cleanest

**Option B: Wire to same backend**
- Keep 2-field footer forms but connect to Registros DB
- Creates partial records (nome + phone only, other fields empty)
- Two entry points, one backend

**Option C: Expand to match /participe**
- Add more fields to footer forms (apelido, email, bairro)
- Every page becomes a registration point
- More complex, may feel intrusive

**Recommendation:** Option A or B. Pending design team discussion.
