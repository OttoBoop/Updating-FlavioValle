# Wix Registration Gate — Implementation Plan

**Generated:** 2026-02-10
**Revised:** 2026-02-11 (v2 — dev workflow rewrite)
**Status:** Draft
**Supersedes:** `.claude/plans/wix-registration-system.md` (legacy, archived to `docs/legacy/`)
**Discovery Sources:**
- `.claude/clarify-session.md` (56+25 questions, archived to `docs/legacy/`)
- Discovery session 2026-02-11 (dev workflow, 6 categories, all answered)

---

## 1. Executive Summary

Build a registration gate on flaviovalle.com that intercepts WhatsApp contact attempts, collects constituent data via a Wix form, and automatically syncs registrations to gabineteonline1.com.br in the background. This eliminates manual data entry by office staff, reducing ~30% data entry errors and saving ~20 staff hours per week.

**v2 Changes:** Restructured to use Wix CLI + duplicated dev site for automated development workflow (matching the Render project pattern). Pure logic modules extracted for parallel TDD. Node.js reference implementations deprecated in favor of Wix Velo ports.

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
- [ ] Background sync succeeds ≥95% of attempts
- [ ] Alerts sent when sync fails (SMS/WhatsApp to technical contact)
- [ ] < 5 blocking issues in first week post-launch
- [ ] Live site (flaviovalle.com) not broken during deployment
- [ ] Dev workflow enables Claude Code to develop, preview, and verify features via CLI

### 2.4 Explicitly Out of Scope

- Deploying to the PRODUCTION site (flaviovalle.com) — separate future `/discover` cycle
- User account management (password resets, profile editing)
- SMS verification for phone numbers
- Detailed analytics/usage tracking (basic logging only for v1)
- Email notifications/confirmations (v2)
- Custom admin dashboard (use Wix built-in database viewer)
- Multi-language support (Portuguese only)
- Modifying the existing WhatsApp redirect (only intercept before it)

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  flaviovalle-dev (Wix DUPLICATE)                 │
│                  (Development & Staging Site)                    │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ Phone Lookup │ -> │ Welcome Back │ -> │   WhatsApp   │     │
│  │    Page      │    │     Page     │    │   Redirect   │     │
│  └──────┬───────┘    └──────────────┘    └──────────────┘     │
│         │                                                      │
│         └──────> ┌──────────────┐                              │
│                  │ Registration │                              │
│                  │     Form     │                              │
│                  └──────┬───────┘                              │
│                         │                                      │
│                         v                                      │
│                  ┌──────────────┐                              │
│                  │   Wix DB     │ (Source of Truth)            │
│                  │ "Registros"  │                              │
│                  └──────┬───────┘                              │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ Background Sync (async, 3 retries)
                          v
                 ┌────────────────────┐
                 │ gabineteonline1    │
                 │ .com.br            │
                 │ (Secondary)        │
                 └────────────────────┘
```

### 3.2 Development Workflow

```
flaviovalle.com (LIVE — DO NOT TOUCH)
       ↓ duplicate (one-time, automated via Playwright)
flaviovalle-dev (DEV SITE — our staging)
       ↓ Wix CLI auth
Local IDE (write Velo code here)
       ↓ wix preview / wix publish
flaviovalle-dev (verify features live)
       ↓ journey agent (visual verification)
Confirmed working on dev site
       ↓ (FUTURE: copy to production — separate plan)
flaviovalle.com
```

**Key Principle:** All development happens on the DUPLICATE site. The live site is never touched until a dedicated production deployment plan is approved.

**Feature Tracking:** The `Updating-FlavioValle/CLAUDE.md` must track which features are "dev-only" vs "deployed to production" so all agents know the current state.

### 3.3 Data Flow

**Three-Page User Flow:**
1. **Phone Lookup** (`/registro-telefone`): User enters phone number
   - IF existing → Welcome Back page
   - IF new → Registration Form page
2. **Welcome Back** (`/bem-vindo`): "Bem-vindo de volta, [Name]!" + two buttons:
   - "Entrar em contato via WhatsApp" (direct access)
   - "Atualizar Cadastro" (pre-filled edit form)
3. **Registration Form** (`/cadastro`): Collect required fields → save to Wix DB → redirect to WhatsApp
4. **Background**: Wix DB → async HTTP POST → gabineteonline (3 retries, exponential backoff)

**Two-Tier Data Architecture:**
- **Tier 1 (Primary):** Wix Database — source of truth, immediate save on form submission
- **Tier 2 (Secondary):** gabineteonline1.com.br — background sync, 3 retries (1s, 2s, 4s), alert on failure

### 3.4 Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend pages | Wix Pages (visual editor) | Already on Wix, no migration needed |
| Frontend logic | Wix Velo (JavaScript) | Built-in, no extra cost, first-party integration |
| Backend logic | Wix Velo Web Modules (.jsw) | Server-side functions within Wix ecosystem |
| Database | Wix Data Collections | Built-in, no extra cost, indexed queries |
| DB creation | Wix REST API | Automated, TDD-able, no Dashboard needed |
| Credentials | Wix Secrets Manager | Encrypted storage, Wix-native |
| Dev site setup | Playwright (one-time script) | Automate Dashboard tasks (duplicate, enable Velo) |
| CLI development | Wix CLI (`wix dev`, `wix preview`, `wix publish`) | Local dev → staging workflow |
| Local testing | Jest + Wix API mocks | TDD for Velo code without live Wix dependency |
| Form Discovery | Playwright + stealth plugin | Browser automation for gabineteonline inspection |
| Local credentials | AES-256 encryption + .env | Secure local storage for development scripts |
| Monitoring | Wix Logs + SMS/WhatsApp alerts | No paid services required |

### 3.5 Integration Points

| System | Direction | Protocol | Notes |
|--------|-----------|----------|-------|
| **gabineteonline1.com.br** | Wix → gabinete | HTTP POST (form submit) | Session cookie auth via `wix-fetch` in .jsw module |
| **WhatsApp** | Wix → WhatsApp | URL redirect | Existing implementation, DO NOT MODIFY |
| **SMS/WhatsApp Alerts** | Wix → Phone | TBD (Wix built-in or external API) | Alert staff on sync failures |
| **Wix Dashboard** | Playwright → Wix | Browser automation | One-time setup only |
| **Wix REST API** | CLI/scripts → Wix | HTTPS REST | DB collection creation, secrets management |

---

## 4. Feature Breakdown

### Feature 1: Setup & Credentials (F1) ✅ COMPLETE

**User Story:** As a developer, I want secure credential storage so that I can safely automate login to external services.

**Acceptance Criteria:**
- [x] Project directory structure created
- [x] Node.js project initialized with dependencies
- [x] Encrypted credential storage (AES-256) working
- [x] Credentials persist across sessions
- [x] .env in .gitignore

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F1-T1 | Create project directory structure and initialize Node.js | None | S | ✅ Done |
| F1-T2 | Build secure credential collection and encryption system | F1-T1 | M | ✅ Done |

**Deliverables (completed):**
- `scripts/setup-credentials.js` — interactive CLI for credential collection
- `.env` — encrypted credential store (gitignored)
- `package.json` — project dependencies

---

### Feature 2: Form Discovery (F2) ✅ COMPLETE

**User Story:** As a developer, I want to discover all form fields from gabineteonline so that I can build a Wix form that maps to their registration system.

**Acceptance Criteria:**
- [x] Script logs into gabineteonline (bypassing Cloudflare)
- [x] 184 form fields discovered and categorized (38 visible)
- [x] JSON schema generated (`gabineteonline-schema.json`)
- [x] Form submission mechanism identified (HTTP POST)

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F2-T1 | Build stealth browser automation and discover gabineteonline form fields | F1-T2 | L | ✅ Done |

**Deliverables (completed):**
- `form-discovery/utils/browser-setup-stealth.js` — stealth Playwright login
- `form-discovery/quick-extract.js` — fast field extraction via `page.evaluate()`
- `form-discovery/output/gabineteonline-schema.json` — 184 fields (38 visible)
- `form-discovery/output/cadastro-full-page.png` — full-page screenshot

**Key Discovery:** gabineteonline uses standard HTML form POST (not xajax), making Direct HTTP POST approach highly feasible for background sync.

---

### Feature 3: Dev Environment Setup (F3)

**User Story:** As a developer, I want an automated Wix development environment so that I can build, preview, and verify features without touching the live site.

**Acceptance Criteria:**
- [ ] Duplicate dev site exists (separate from flaviovalle.com)
- [ ] Velo Dev Mode enabled on dev site
- [ ] Wix CLI authenticated and `wix dev` functional
- [ ] DB collection `Registros` created via REST API with proper schema
- [ ] Wix API mock library enables local Jest testing of Velo code
- [ ] `wix preview` generates a working preview URL

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F3-T1 | Build one-time Playwright script to duplicate site and enable Velo | F1-T2 | M | ⬜ |
| F3-T2 | Install Wix CLI, authenticate (`wix login`), verify `wix dev` works | F3-T1 | S | ⬜ |
| F3-T3 | Create `Registros` DB collection via Wix REST API (schema, indexes, permissions) | F3-T2 | M | ⬜ |
| F3-T4 | Build Wix API mock library (wix-data, wix-fetch, wix-location, wix-secrets) for Jest | None | M | ✅ Done |

**Tests Required (write BEFORE implementation):**
- [ ] Test: F3-T3 — DB collection created with all required fields (nome, celular, email, etc.)
- [ ] Test: F3-T3 — Collection has proper indexes (phone number for lookup)
- [x] Test: F3-T4 — Mock `wix-data.query()` returns expected results
- [x] Test: F3-T4 — Mock `wix-fetch()` sends correct HTTP requests
- [x] Test: F3-T4 — Mock `wix-secrets.getSecret()` returns stored values

**Notes:**
- F3-T1 uses Playwright to automate Wix Dashboard (similar to gabineteonline stealth login)
- F3-T4 has NO dependencies — can start immediately in parallel with everything else
- After F3-T1 completes, provide links to user for manual verification

---

### Feature 4: Pure Logic Modules (F4)

**User Story:** As a developer, I want tested, portable logic modules so that validation, mapping, and sync work correctly regardless of the runtime environment (Node.js or Wix Velo).

**Acceptance Criteria:**
- [ ] All validation modules work with Jest locally
- [ ] Field mapper + HTTP client ported to Wix Velo format (.jsw)
- [ ] Node.js versions deprecated per deprecation guide (kept as reference, not deleted)
- [ ] Sync worker handles retries, backoff, and status tracking

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F4-T1 | Build backend HTTP client for gabineteonline (Node.js reference) | F2-T1 | L | ✅ Done |
| F4-T2 | Phone format validation module (Brazilian 11-digit + international) | None | S | ✅ Done |
| F4-T3 | Email validation module | None | S | ✅ Done |
| F4-T4 | Suspicious data detection module (fake patterns, spam, CPF algorithm) | None | S | ✅ Done |
| F4-T5 | Port field-mapper + gabinete-client to Wix Velo (.jsw) using wix-fetch; deprecate Node.js versions | F3-T4, F4-T1 | M | ⬜ |
| F4-T6 | Sync worker with retry logic (3 attempts, 1s/2s/4s backoff) and syncStatus tracking | F4-T5 | M | ⬜ |

**Tests Required (write BEFORE implementation):**
- [x] Test: F4-T1 — Login to gabineteonline succeeds and returns session cookie
- [x] Test: F4-T1 — Field mapping correctly translates Wix field names to gabineteonline field names
- [x] Test: F4-T1 — Form submission via HTTP POST returns success indicator
- [x] Test: F4-T2 — Phone validation accepts `(11)98765-4321`, `11987654321`, `+5511987654321`
- [x] Test: F4-T2 — Phone validation rejects `12345`, `abcdefghijk`, empty string
- [x] Test: F4-T2 — Phone normalization strips formatting to digits-only
- [x] Test: F4-T3 — Email validation accepts `user@example.com`, rejects `not-email`
- [x] Test: F4-T4 — Suspicious detection flags `11111111111`, `00000000000`, `teste@teste.com`
- [x] Test: F4-T4 — Suspicious detection passes normal data through
- [x] Test: F4-T4 — CPF validation uses mod-11 check-digit algorithm
- [ ] Test: F4-T5 — Ported gabinete-client uses `wix-fetch` mock correctly
- [ ] Test: F4-T5 — Ported field-mapper behaves identically to Node.js version
- [ ] Test: F4-T6 — Retry logic attempts 3 times with increasing delays (1s, 2s, 4s)
- [ ] Test: F4-T6 — syncStatus updates correctly (pending → synced | failed)
- [ ] Test: F4-T6 — Sync worker returns failure after 3 failed attempts

**Deprecation Note (F4-T5):**
Per `docs/guides/GENERAL_DEPRECATION_AND_UNIFICATION_GUIDE.md`:
- `utils/field-mapper.js` → deprecated, replaced by Velo `.jsw` version
- `utils/gabinete-client.js` → deprecated, replaced by Velo `.jsw` version
- Keep originals as reference implementations with deprecation comments
- Velo versions must pass ALL existing tests (18 tests) using Wix mocks

---

### Feature 5: Wix Frontend Pages (F5)

**User Story:** As a constituent visiting flaviovalle.com, I want to register via a simple form so that I can access WhatsApp contact without office staff intervention.

**Acceptance Criteria:**
- [ ] Phone lookup page correctly routes returning vs new users
- [ ] Welcome back page shows user name and offers WhatsApp access or edit
- [ ] Registration form collects all required fields from gabineteonline schema
- [ ] WhatsApp button clicks intercepted and routed through registration flow
- [ ] All pages work on mobile + desktop

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F5-T1 | Build Phone Lookup page (`/registro-telefone`) with phone input, validation, and DB query routing | F3-T3, F4-T2 | M | ⬜ |
| F5-T2 | Build Welcome Back page (`/bem-vindo`) with returning user greeting, WhatsApp button, and edit button | F5-T1 | M | ⬜ |
| F5-T3 | Build Registration Form page (`/cadastro`) with all required fields, validation, edit mode, and submission | F3-T3, F4-T2 | L | ⬜ |
| F5-T4 | Intercept WhatsApp button/widget clicks site-wide via masterPage.js | F5-T1 | M | ⬜ |

**Tests Required (write BEFORE implementation):**
- [ ] Test: Phone format validation accepts Brazilian (11 digits) and international formats
- [ ] Test: Phone lookup returns correct routing (existing → welcome, new → register)
- [ ] Test: Registration form validates required fields before submission
- [ ] Test: Email format validation rejects invalid patterns
- [ ] Test: Suspicious data detection flags fake phone patterns (e.g., 11111111111)
- [ ] Test: Edit mode pre-fills all existing user data
- [ ] Test: WhatsApp redirect fires after successful registration (2s delay)
- [ ] Test: Error state preserves form data for retry

---

### Feature 6: Testing & Verification (F6)

**User Story:** As a developer, I want comprehensive tests and visual verification so that I can confirm features work on the dev site before considering production deployment.

**Acceptance Criteria:**
- [ ] Integration tests verify Wix DB and gabineteonline sync on dev site
- [ ] UI tests (Playwright) cover all pages on dev site
- [ ] Journey agent runs successfully against dev site
- [ ] All test patterns match Render project conventions

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F6-T1 | Integration tests for Wix DB operations and gabineteonline sync | F4-T6, F5-T3 | M | ⬜ |
| F6-T2 | UI tests (Playwright) for all pages on dev site | F5-T4 | M | ⬜ |
| F6-T3 | Journey agent verification on dev site (investor + tester personas) | F6-T2 | M | ⬜ |

**Tests Required (write BEFORE implementation):**
- [ ] Test: New user full flow (WhatsApp click → register → Wix DB → gabineteonline → WhatsApp)
- [ ] Test: Returning user direct access (phone lookup → welcome → WhatsApp)
- [ ] Test: Returning user edit flow (phone lookup → welcome → edit → update → WhatsApp)
- [ ] Test: Network failure during submission (error shown, data preserved)
- [ ] Test: gabineteonline down (Wix save succeeds, user gets WhatsApp, sync retries in background)

---

### Feature 7: Production Deployment (F7) — DEFERRED

**Status:** OUT OF SCOPE for this plan. Requires a separate `/discover` cycle.

**When to trigger:** After all features are verified working on the dev site (F6-T3 complete).

**What it will cover:**
- Strategy for copying features from `flaviovalle-dev` to `flaviovalle.com`
- Rollback plan
- First-registration monitoring
- CLAUDE.md update to mark features as "live"

---

## 5. Test Strategy

### 5.1 Testing Pyramid (Matching Render Patterns)

```
tests/
├── unit/           # Pure logic, no external calls (Jest + Wix mocks)
│   ├── phone-validation.test.js
│   ├── email-validation.test.js
│   ├── suspicious-data.test.js
│   ├── field-mapper.test.js        # Existing (18 tests)
│   └── gabinete-client.test.js     # Existing (18 tests)
│
├── integration/    # External services (Wix REST API, gabineteonline)
│   ├── wix-db.test.js
│   └── gabineteonline-sync.test.js
│
├── ui/             # Playwright browser tests on dev site
│   ├── phone-lookup.test.js
│   ├── registration-form.test.js
│   └── whatsapp-intercept.test.js
│
└── journey/        # Journey agent configs for dev site
    └── tester-checklists/
```

- **Unit Tests:** Phone formatting, email validation, suspicious data detection, field mapping, Wix mock behavior. Target: 100% of pure utility functions.
- **Integration Tests:** Wix DB insert/query/update via REST API, gabineteonline login + form submission, retry logic with simulated failures.
- **UI Tests:** Playwright against `flaviovalle-dev` — page navigation, form submission, WhatsApp redirect.
- **Journey Agent:** Visual verification with `tester` persona against dev site URL.

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

# Run in watch mode
npm test -- --watch

# UI tests (requires dev site running)
npx playwright test tests/ui/
```

### 5.4 Wix Mock Library (F3-T4)

Local Jest tests mock these Wix APIs:
- `wix-data` — `.query()`, `.insert()`, `.update()`, `.get()`
- `wix-fetch` — `fetch()` with headers, body, cookies
- `wix-location` — `.to()`, `.query`, `.path`
- `wix-secrets` — `.getSecret()`

---

## 6. Implementation Phases

### Phase Dependency Graph

```
Phase 1 (F1, F2) ─── DONE
F4-T1 ─── DONE
       │
       ├──> PARALLEL GROUP A (no dependencies — start NOW):
       │    ├── F3-T4: Wix mock library
       │    ├── F4-T2: Phone validation
       │    ├── F4-T3: Email validation
       │    └── F4-T4: Suspicious data detection
       │
       ├──> SEQUENTIAL GROUP B (one-time setup):
       │    F3-T1 (Dashboard automation) → F3-T2 (CLI setup) → F3-T3 (DB collection)
       │
       ├──> GROUP C (needs A + B complete):
       │    ├── F4-T5: Port to Wix Velo (needs F3-T4 mocks + F4-T1 reference)
       │    └── F4-T6: Sync worker (needs F4-T5)
       │
       └──> GROUP D (needs B + C complete):
            ├── F5-T1..T4: Wix pages (needs F3-T3 DB + F4-T2 validation)
            └── F6-T1..T3: Testing & verification (needs F5 pages)
```

### Phase 1: Foundation ✅ COMPLETE
**Goal:** Secure credentials and discover gabineteonline form structure
**Completed:** F1-T1, F1-T2, F2-T1, F4-T1

### Phase 2: Parallel Pure Logic + Setup
**Goal:** Build all testable logic modules while setting up the dev environment

**Can run in parallel:**
- [x] F3-T4: Wix mock library ✅ (unblocks F4-T5)
- [x] F4-T2: Phone validation ✅ (21 tests)
- [x] F4-T3: Email validation ✅ (41 tests)
- [x] F4-T4: Suspicious data detection ✅ (51 tests, CPF algorithm)
- [ ] F3-T1: Dashboard automation script (one-time)
- [ ] F3-T2: CLI setup + auth
- [ ] F3-T3: DB collection via REST API

### Phase 3: Wix Integration
**Goal:** Port to Velo, build sync worker, wire everything together

**Sequential:**
- [ ] F4-T5: Port field-mapper + gabinete-client to Wix Velo
- [ ] F4-T6: Sync worker with retry logic

### Phase 4: Frontend Pages
**Goal:** Build all user-facing pages on the dev site

- [ ] F5-T1: Phone Lookup page
- [ ] F5-T2: Welcome Back page
- [ ] F5-T3: Registration Form page
- [ ] F5-T4: WhatsApp intercept

### Phase 5: Verification
**Goal:** Comprehensive testing and visual verification on dev site

- [ ] F6-T1: Integration tests
- [ ] F6-T2: UI tests (Playwright)
- [ ] F6-T3: Journey agent verification

### Phase 6: Production Deployment — DEFERRED
**Goal:** Deploy to live site (separate `/discover` cycle required)

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Breaking live website during deployment | N/A (deferred) | Critical | All dev on duplicate site. Production deployment is a separate plan. |
| Wix Dashboard automation blocked by Cloudflare/CAPTCHA | Medium | Medium | Retry 3 times + alert user. Fall back to manual setup with links. |
| Secrets Manager not configured on original site | Medium | Medium | Check during F3-T1. If missing, configure via Dashboard automation bot. |
| gabineteonline form schema changes | Low | High | Run discovery script quarterly. Version schema file. Monitor sync failures. |
| User abandons registration (low completion) | Medium | High | Keep form minimal (required fields only). Wix built-in styling. |
| Wix Velo mock fidelity issues | Medium | Medium | Compare mock behavior against real API during integration tests. |
| wix-fetch doesn't support session cookies like Node.js fetch | Medium | High | Research wix-fetch cookie handling during F4-T5. May need alternate approach. |
| Election traffic spike (1000+/day in 2026) | High | Medium | Wix auto-scales. Database indexed. Load test before election period. |
| No local dev environment for Wix code | Low (solved) | N/A | Wix CLI + local editor + Jest mocks solve this. |

---

## 8. Open Questions

- [ ] **wix-fetch Cookie Support:** Does `wix-fetch` pass cookies the same way as Node.js `fetch`? Critical for gabineteonline login. Research during F4-T5.
- [ ] **Wix CLI Auth Method:** Does `wix login` support non-interactive auth (API key)? Needed for CI/CD. Research during F3-T2.
- [ ] **WhatsApp Selectors:** Exact selectors for WhatsApp button and widget on flaviovalle.com are unknown. Must inspect the live site during F5-T4.
- [ ] **WhatsApp Redirect URL:** The current WhatsApp redirect URL needs to be captured from the live site.
- [ ] **Alert System Implementation:** SMS/WhatsApp alerts are marked as "TODO" — exact Wix integration unresolved. May use Wix Automations, Twilio, or webhook.
- [ ] **gabineteonline Session Expiry:** How long does the session cookie last? If short-lived, sync worker needs re-login logic.
- [ ] **Suspicious Data Policy:** Should suspicious data be blocked from gabineteonline entirely, or synced with a flag for staff review?
- [ ] **Secrets Manager Status:** Does the original flaviovalle.com site have Secrets Manager configured? Unknown until F3-T1 inspects.

---

## 9. Approval Checklist

- [ ] Requirements reviewed by: _____________ Date: _________
- [ ] Architecture reviewed by: _____________ Date: _________
- [ ] Task ID mapping reviewed by: _____________ Date: _________
- [ ] Parallelism confirmed by: _____________ Date: _________
- [ ] Plan approved by: _____________ Date: _________

---

## 10. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-10 | Initial plan created (converted from legacy `.claude/plans/` format to standard) | Claude Opus 4.6 |
| 2026-02-10 | Marked F1-T1, F1-T2, F2-T1 as complete (work done in prior sessions) | Claude Opus 4.6 |
| 2026-02-10 | F4-T1 complete via TDD: field-mapper.js + gabinete-client.js (18 tests) | Claude Opus 4.6 |
| 2026-02-11 | **v2 REWRITE:** Restructured F3 (dev environment setup), extracted F4 (pure logic), added F5 (pages), F6 (testing). Fixed dependency chain — 7 tasks now runnable in parallel. Added Wix CLI workflow, mock library, deprecation path for Node.js modules. Deferred production deployment to future `/discover` cycle. | Claude Opus 4.6 |
| 2026-02-11 | F3-T4 complete via TDD: wix-mocks.js (4 mock factories: wix-data, wix-fetch, wix-location, wix-secrets). 34 tests passing. | Claude Opus 4.6 |
| 2026-02-11 | F4-T4 complete via TDD: suspicious-data.js with CPF mod-11 check-digit algorithm. 51 tests passing (validateCPF + detectSuspicious). | Claude Opus 4.6 |
| 2026-02-11 | F4-T2 complete via TDD: phone-validation.js (validatePhone + normalizePhone). 21 tests passing. | Claude Opus 4.6 |
| 2026-02-11 | F4-T3 complete via TDD: email-validation.js (validateEmail with normalization, disposable detection, Brazilian TLDs). 41 tests passing. | Claude Opus 4.6 |
