# Wix Registration Gate — Implementation Plan

**Generated:** 2026-02-10
**Status:** Draft
**Supersedes:** `.claude/plans/wix-registration-system.md` (legacy, archived to `docs/legacy/`)
**Discovery Source:** `.claude/clarify-session.md` (56+25 questions, archived to `docs/legacy/`)

---

## 1. Executive Summary

Build a registration gate on flaviovalle.com that intercepts WhatsApp contact attempts, collects constituent data via a Wix form, and automatically syncs registrations to gabineteonline1.com.br in the background. This eliminates manual data entry by office staff, reducing ~30% data entry errors and saving ~20 staff hours per week.

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

### 2.4 Explicitly Out of Scope

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
│                     flaviovalle.com (Wix)                       │
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

### 3.2 Data Flow

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

### 3.3 Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend pages | Wix Pages (visual editor) | Already on Wix, no migration needed |
| Frontend logic | Wix Velo (JavaScript) | Built-in, no extra cost, first-party integration |
| Backend logic | Wix Velo Web Modules (.jsw) | Server-side functions within Wix ecosystem |
| Database | Wix Data Collections | Built-in, no extra cost, indexed queries |
| Credentials | Wix Secrets Manager | Encrypted storage, Wix-native |
| Form Discovery | Playwright + stealth plugin | Browser automation for gabineteonline inspection |
| Local credentials | AES-256 encryption + .env | Secure local storage for development scripts |
| Monitoring | Wix Logs + SMS/WhatsApp alerts | No paid services required |

### 3.4 Integration Points

| System | Direction | Protocol | Notes |
|--------|-----------|----------|-------|
| **gabineteonline1.com.br** | Wix → gabinete | HTTP POST (form submit) | Session cookie auth, login first, then POST to cadastro form |
| **WhatsApp** | Wix → WhatsApp | URL redirect | Existing implementation, DO NOT MODIFY |
| **SMS/WhatsApp Alerts** | Wix → Phone | TBD (Wix built-in or external API) | Alert staff on sync failures |

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
- [x] 187 form fields discovered and categorized
- [x] JSON schema generated (`gabineteonline-schema.json`)
- [x] Form submission mechanism identified (HTTP POST)

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F2-T1 | Build stealth browser automation and discover gabineteonline form fields | F1-T2 | L | ✅ Done |

**Deliverables (completed):**
- `form-discovery/utils/browser-setup-stealth.js` — stealth Playwright login
- `form-discovery/output/exploration-form-structure.json` — 187 fields discovered
- Integration plan documenting the HTTP POST approach

**Key Discovery:** gabineteonline uses standard HTML form POST (not xajax), making Direct HTTP POST approach highly feasible for background sync.

---

### Feature 3: Wix Frontend (F3)

**User Story:** As a constituent visiting flaviovalle.com, I want to register via a simple form so that I can access WhatsApp contact without office staff intervention.

**Acceptance Criteria:**
- [ ] Wix dev site (`flaviovalle-dev`) set up with Velo enabled
- [ ] Wix database collection `Registros` created with proper schema and indexes
- [ ] Phone lookup page correctly routes returning vs new users
- [ ] Welcome back page shows user name and offers WhatsApp access or edit
- [ ] Registration form collects all required fields from gabineteonline schema
- [ ] WhatsApp button clicks intercepted and routed through registration flow
- [ ] All pages work on mobile + desktop

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F3-T1 | Create Wix development environment (duplicate site, enable Velo, set up Secrets Manager) | F1-T2 | M | ⬜ |
| F3-T2 | Create Wix database collection `Registros` with fields, permissions, and indexes | F3-T1, F2-T1 | S | ⬜ |
| F3-T3 | Build Phone Lookup page (`/registro-telefone`) with phone input, format validation, and DB query routing | F3-T2 | M | ⬜ |
| F3-T4 | Build Welcome Back page (`/bem-vindo`) with returning user greeting, WhatsApp button, and edit button | F3-T3 | M | ⬜ |
| F3-T5 | Build Registration Form page (`/cadastro`) with all required fields, validation, edit mode, and submission | F3-T2, F2-T1 | L | ⬜ |
| F3-T6 | Intercept WhatsApp button/widget clicks site-wide via masterPage.js | F3-T3 | M | ⬜ |

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

### Feature 4: Integration & Backend Sync (F4)

**User Story:** As an office staff member, I want registrations to automatically appear in gabineteonline so that I don't have to manually enter data.

**Acceptance Criteria:**
- [ ] Backend Web Module logs into gabineteonline and submits form data via HTTP POST
- [ ] Background sync runs asynchronously (user doesn't wait)
- [ ] Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- [ ] Wix DB `syncStatus` updated after each attempt (pending → synced | failed)
- [ ] Alert sent to technical contact on final failure

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F4-T1 | Build backend HTTP client for gabineteonline (login, session management, form submission, field mapping) | F2-T1, F3-T1 | L | ✅ Done |
| F4-T2 | Build sync worker with retry logic (3 attempts, exponential backoff) and failure alert system | F4-T1 | M | ⬜ |

**Tests Required (write BEFORE implementation):**
- [x] Test: Login to gabineteonline succeeds and returns session cookie
- [x] Test: Field mapping correctly translates Wix field names to gabineteonline field names
- [x] Test: Form submission via HTTP POST returns success indicator
- [ ] Test: Retry logic attempts 3 times with increasing delays
- [ ] Test: syncStatus updates correctly in Wix DB after each attempt
- [ ] Test: Alert fires after 3 failed attempts
- [ ] Test: Suspicious data is flagged and skipped from sync

---

### Feature 5: Testing (F5)

**User Story:** As a developer, I want comprehensive tests so that I can deploy with confidence.

**Acceptance Criteria:**
- [ ] Unit tests pass for all utility functions
- [ ] Integration tests verify Wix DB and gabineteonline sync
- [ ] E2E tests cover new user, returning user, and error flows
- [ ] Manual cross-browser testing completed (mobile + desktop)

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F5-T1 | Write unit tests for utilities (phone formatting, email validation, suspicious data detection, field mapping) | F3-T5, F4-T1 | M | ⬜ |
| F5-T2 | Write integration tests for Wix DB operations and gabineteonline API sync | F4-T2 | M | ⬜ |
| F5-T3 | Write E2E tests for full user flows (new user, returning user, error scenarios) | F4-T2 | L | ⬜ |
| F5-T4 | Manual cross-browser and mobile testing (Chrome, Firefox, Edge, Safari, Android, iOS) | F5-T3 | M | ⬜ |

**Tests Required (write BEFORE implementation):**
- [ ] Test: New user full flow (WhatsApp click → register → Wix DB → gabineteonline → WhatsApp)
- [ ] Test: Returning user direct access (phone lookup → welcome → WhatsApp)
- [ ] Test: Returning user edit flow (phone lookup → welcome → edit → update → WhatsApp)
- [ ] Test: Network failure during submission (error shown, data preserved)
- [ ] Test: gabineteonline down (Wix save succeeds, user gets WhatsApp, sync retries in background)
- [ ] Test: International phone number accepted
- [ ] Test: Shared device scenario (independent registrations per phone)

---

### Feature 6: Deployment (F6)

**User Story:** As the site owner, I want to safely deploy to production so that the live site is not broken.

**Acceptance Criteria:**
- [ ] Changes deployed from `flaviovalle-dev` to `flaviovalle.com`
- [ ] First registrations monitored in real-time
- [ ] Sync to gabineteonline verified with real data
- [ ] Rollback plan documented and tested

**Tasks:**
| ID | Task | Dependencies | Effort | Status |
|----|------|--------------|--------|--------|
| F6-T1 | Deploy from dev site to production with feature flag approach, monitor first registrations | F5-T4 | M | ⬜ |
| F6-T2 | Post-launch monitoring: verify sync success rate, check alerts, document issues | F6-T1 | S | ⬜ |

**Tests Required (write BEFORE implementation):**
- [ ] Test: Production deployment doesn't break existing pages
- [ ] Test: First real registration saves to Wix DB
- [ ] Test: First real sync appears in gabineteonline admin panel
- [ ] Test: Rollback procedure restores previous state

---

## 5. Test Strategy

### 5.1 Testing Pyramid

- **Unit Tests:** Phone formatting, email validation, suspicious data detection, Wix↔gabineteonline field mapping. Target: all pure utility functions.
- **Integration Tests:** Wix DB insert/query/update, gabineteonline login + form submission, retry logic with simulated failures.
- **E2E Tests:** New user full flow, returning user flows (direct access + edit), error scenarios (network failure, gabineteonline down).
- **Manual Tests:** Cross-browser (Chrome, Firefox, Edge, Safari), mobile (Android Chrome, iOS Safari), low-tech user testing.

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
npm test -- browser-setup-stealth.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

> **Note:** Wix Velo code testing approach is an open question — see Section 8.

---

## 6. Implementation Phases

### Phase Dependencies

```
Phase 1 (F1, F2) ─── DONE
       │
       ├──> Phase 2A (F3-T1..T2) ─┐
       │                           ├──> Phase 2B (F3-T3..T6, F4) ──> Phase 3 (F5, F6)
       └──> [parallel possible]  ──┘
```

- Phase 1 must complete before Phase 2 (done)
- Within Phase 2, Wix setup (F3-T1, F3-T2) must precede pages and integration
- F3 pages and F4 backend can partially overlap once F3-T2 is done
- Phase 3 requires all of Phase 2

### Phase 1: Foundation ✅ COMPLETE
**Goal:** Secure credentials and discover gabineteonline form structure
**Completed:** F1-T1, F1-T2, F2-T1

### Phase 2: Core Features
**Goal:** Build all Wix pages and backend sync integration
**Effort:** L (largest phase)

- [ ] F3-T1: Create Wix development environment
- [ ] F3-T2: Create Wix database collection
- [ ] F3-T3: Build Phone Lookup page
- [ ] F3-T4: Build Welcome Back page
- [ ] F3-T5: Build Registration Form page
- [ ] F3-T6: Intercept WhatsApp clicks
- [x] F4-T1: Build backend gabineteonline HTTP client
- [ ] F4-T2: Build sync worker with retry and alerts

### Phase 3: Quality & Launch
**Goal:** Verify everything works and deploy safely
**Effort:** M

- [ ] F5-T1: Unit tests
- [ ] F5-T2: Integration tests
- [ ] F5-T3: E2E tests
- [ ] F5-T4: Manual cross-browser testing
- [ ] F6-T1: Production deployment
- [ ] F6-T2: Post-launch monitoring

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Breaking live website during deployment | Medium | Critical | Use `flaviovalle-dev` for all development. Feature flag for deployment. Documented rollback plan. |
| gabineteonline form schema changes | Low | High | Run discovery script quarterly. Version schema file. Monitor sync failures. |
| User abandons registration (low completion) | Medium | High | Keep form minimal (required fields only). Wix built-in styling (familiar UX). Test with low-tech users. |
| Background sync failures unnoticed | Low | Medium | SMS/WhatsApp alerts to technical contact. Wix DB dashboard for sync status. |
| Election traffic spike (1000+/day in 2026) | High | Medium | Wix auto-scales. Database indexed. Load test before election period. |
| Cloudflare/CAPTCHA blocks automated sync | Medium | High | Use stealth techniques. Have manual fallback documented. Monitor for blocks. |
| First-time Wix Velo user (maintainer is new) | N/A | Medium | Clear inline comments. Step-by-step README. Maintenance documentation. |
| No local dev environment for Wix code | High | Medium | Research Wix CLI/local dev options. Fall back to dev site testing. |

---

## 8. Open Questions

- [ ] **TDD for Wix Velo:** How do we test Wix Velo code (`.jsw` files) that depends on `wix-data`, `wix-fetch`, `wix-location`? Options: (a) Mock Wix APIs with Jest locally, (b) Use Wix's built-in test mode, (c) Manual verification only for Wix-specific code. Needs research.
- [ ] **Local Development:** Can Wix sites be cloned/developed locally? The Wix CLI may support this. Needs investigation before F3-T1.
- [ ] **WhatsApp Selectors:** Exact selectors for WhatsApp button and widget on flaviovalle.com are unknown. Must inspect the live site during F3-T6.
- [ ] **WhatsApp Redirect URL:** The current WhatsApp redirect URL needs to be captured from the live site. Placeholder exists in old plans.
- [ ] **Alert System Implementation:** The old plan marked SMS/WhatsApp alerts as "TODO" — exact Wix integration for alerts is unresolved. May use Wix Automations, Twilio, or a simple webhook.
- [ ] **gabineteonline Session Expiry:** How long does the gabineteonline session cookie last? If short-lived, the sync worker needs re-login logic.
- [ ] **Suspicious Data Policy:** Should suspicious data (flagged by pattern detection) be blocked from gabineteonline entirely, or synced with a flag for staff review?

---

## 9. Approval Checklist

- [ ] Requirements reviewed by: _____________ Date: _________
- [ ] Architecture reviewed by: _____________ Date: _________
- [ ] Task ID mapping reviewed by: _____________ Date: _________
- [ ] Plan approved by: _____________ Date: _________

---

## 10. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-10 | Initial plan created (converted from legacy `.claude/plans/` format to standard) | Claude Opus 4.6 |
| 2026-02-10 | Marked F1-T1, F1-T2, F2-T1 as complete (work done in prior sessions) | Claude Opus 4.6 |
| 2026-02-10 | F4-T1 complete via TDD: field-mapper.js (28 field mappings, validation, truncation) + gabinete-client.js (login, form submission). 18 tests passing. | Claude Opus 4.6 |
