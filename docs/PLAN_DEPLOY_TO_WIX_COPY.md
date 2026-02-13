# Deploy to Wix Copy — Implementation Plan

**Generated:** 2026-02-12
**Status:** Draft
**Supersedes:** PLAN_WIX_REGISTRATION_SYSTEM.md sections F3-T1/T2, F5-T4, F7-T1 (those assumed `wix preview` CLI which doesn't exist)
**Discovery source:** Discovery session 2026-02-12 (7/7 categories answered)
**Prerequisite plans:**
- `docs/PLAN_WIX_REGISTRATION_SYSTEM.md` — the code modules (345 Jest tests, all passing)
- `general_scraper/docs/PLAN_GENERAL_SCRAPER.md` — the scraper tool (785 tests, all passing)
- `general_scraper/docs/PLAN_WIX_SAFE_EXPLORATION.md` — editor sightseeing (COMPLETE)

---

## 1. Executive Summary

Duplicate flaviovalle.com into a safe copy, then deploy all 7 tested modules to the copy via the scraper's interactive driver. Configure the Registros DB, Secrets Manager, and WhatsApp link redirects. Verify the full registration flow in preview. No changes to the live site.

**Why a copy?** Working on the live site — even with preview mode — risks accidental publishes, editor lock conflicts, and stress. A duplicate site is completely disposable and gives us freedom to experiment.

**Key architectural change:** The original plan (v3) assumed `wix preview` CLI, which doesn't exist in modern Wix. We now use the general scraper's IPC-based interactive driver with saved session state (`data/wix_storage_state.json`). This is actually more capable — it can navigate the full Wix Editor, write Velo code, create DB collections, and capture screenshots.

---

## 2. Requirements Summary

### 2.1 Problem Statement

We have 7 production-ready modules (345 Jest tests) sitting in the `Updating-FlavioValle/form-discovery/utils/` directory, unable to be deployed. The Wix CLI doesn't support `wix preview` for live sites, and working directly on the live flaviovalle.com is too risky for initial deployment. We need a safe copy to deploy to, test, and iterate on.

### 2.2 Target Users

| User | Role | Needs |
|------|------|-------|
| Developer (you) | Deploys code, reviews preview | Safe environment, clear verification |
| Claude Code (bot) | Operates scraper, writes code | IPC commands, selectors, session persistence |
| Future: Constituents | Use the /participe form | Working form, WhatsApp redirect |

### 2.3 Success Criteria

- [x] ~~flaviovalle.com duplicated into a copy site~~ **SKIPPED** — site owned by different account (fa380038-...), our account (9bf5cd59-...) is contributor only. Cannot duplicate via UI or API. Working directly on live site with Publish safeguard.
- [ ] Registros DB collection created on live site with correct schema + test data
- [ ] Secrets Manager configured on live site with gabineteonline credentials
- [ ] All 7 backend/page modules deployed to live site via `velo_write`
- [ ] WhatsApp widget + OG button redirected to /participe on live site
- [ ] masterPage.js returning-user bypass deployed on live site
- [ ] /participe registration flow works in Test Site preview (new user + returning user)
- [ ] Journey agent passes against Test Site preview URL
- [ ] User manually approves preview screenshots

### 2.4 Explicitly Out of Scope

- Publishing anything to the live flaviovalle.com
- Background sync to gabineteonline (F6 — separate phase, after preview approval)
- Footer form redesign (F8 — pending design team decision)
- Installing or using Wix CLI (replaced by scraper)
- Creating new Wix pages (work within existing /participe)

---

## 3. Technical Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT ENVIRONMENT                    │
│                                                               │
│  general_scraper/                                            │
│  ├── interactive_driver.py     ← IPC browser control          │
│  ├── profiles/flaviovalle.yaml ← selectors, pages, forms     │
│  └── data/wix_storage_state.json ← saved Wix session         │
│                                                               │
│  Updating-FlavioValle/form-discovery/utils/                  │
│  ├── velo-field-mapper.js       ← backend .jsw (345 tests)   │
│  ├── velo-gabinete-client.js    ← backend .jsw               │
│  ├── sync-worker.js             ← backend .jsw               │
│  ├── wix-db-operations.js       ← backend .jsw               │
│  ├── participe-form-config.js   ← page code                  │
│  ├── phone-lookup.js            ← page code                  │
│  └── form-submission-handler.js ← page code                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ IPC commands (velo_write, navigate_wix, etc.)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│            COPY SITE (duplicated from flaviovalle.com)        │
│                                                               │
│  Wix Dashboard ──→ CMS: Registros collection                │
│                 ──→ Secrets Manager: gabinete creds           │
│                                                               │
│  Wix Editor ────→ Velo IDE: .jsw backend modules             │
│              ────→ Page code: /participe logic                │
│              ────→ masterPage.js: returning-user bypass       │
│              ────→ WhatsApp widget: link → /participe         │
│                                                               │
│  Test Site ─────→ Preview URL: verify full flow              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Development Workflow

```
1. Launch scraper with saved session
2. Navigate to Wix Dashboard
3. Duplicate flaviovalle.com → "flaviovalle-copy"
4. Open copy site's Editor
5. Create Registros DB collection via CMS
6. Configure Secrets Manager
7. Deploy .jsw modules via velo_write
8. Deploy page code via velo_write
9. Edit WhatsApp widget links in Editor
10. Add masterPage.js bypass code
11. Click "Test Site" → verify in preview tab
12. Run journey agent against preview URL
13. Take screenshots for user review
14. User approves → ready for live deployment (separate plan)
```

**Key difference from original plan:** No `wix preview` CLI. No `wix publish`. Everything happens through the browser via the scraper's IPC commands.

### 3.3 Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Browser control | general_scraper interactive_driver.py | Already built, 785 tests, full Wix Editor support |
| Session persistence | storage_state.json | Avoids re-login, proven in previous sessions |
| Code deployment | `velo_write` IPC command | Writes directly to Wix Velo IDE via browser automation |
| DB creation | Dashboard CMS UI via scraper | No API needed, scraper can navigate CMS dashboard |
| Secrets config | Dashboard Secrets Manager via scraper | Same approach as DB creation |
| Preview | "Test Site" button (Dev Mode ON) | Opens `?rc=test-site` tab, isolated from live |
| Verification | Journey agent + screenshots | Automated UX testing + manual review |

### 3.4 Integration Points

| System | Direction | Method | Notes |
|--------|-----------|--------|-------|
| Wix Dashboard | Scraper → Wix | Browser automation | CMS, Secrets Manager |
| Wix Editor | Scraper → Wix | IPC commands (velo_write, navigate_wix) | Code deployment |
| Copy site preview | Scraper → Browser | Test Site tab | Verification |
| Journey agent | Python → Browser | Playwright | Automated UX testing |

---

## 4. Feature Breakdown

### Feature 1: Site Duplication (F1)

**User Story:** As a developer, I want a safe copy of flaviovalle.com so that I can deploy and test code without affecting the live site.

**Cross-feature impact:** F1 is the root dependency — every other feature requires the copy site to exist. F1-T2 (verify copy) is the single gate that unblocks Wave 3 (five parallel tasks across F1/F2/F3/F5).

**Acceptance Criteria:**
- [ ] flaviovalle.com duplicated via Wix Dashboard or Editor
- [ ] Copy site accessible in Wix Dashboard
- [ ] Copy site's Editor opens with same pages + structure as live
- [ ] Profile YAML updated with copy site URLs (dashboard, editor)

**Tasks:**

| ID | Task | Dependencies | Wave | Effort | Status |
|----|------|--------------|------|--------|--------|
| F1-T1 | Launch scraper session, navigate to Dashboard, attempt site duplication via Site Actions menu. If blocked, try Editor → Site → Duplicate Site. If still blocked, research alternatives (Studio workspace, page-by-page copy). Document what works. | None | **1** | M | ⬜ |
| F1-T2 | Verify copy site: open its Dashboard, confirm pages match live (16 pages), check CMS (should have 0 custom collections — same as live). Screenshot the copy's Editor. | F1-T1 | **2** | S | ⬜ |
| F1-T3 | Create `profiles/flaviovalle-copy.yaml` with copy site's URLs (new site ID, new editor URL, same selectors). Or update existing profile with copy site section. | F1-T2 | **3** | S | ⬜ |

**Tests Required:**
- N/A — this is interactive browser work, not testable code. Verification is visual (screenshots).

**Fallback strategies for F1-T1 (in order):**
1. Dashboard → Site Actions → Duplicate Site
2. Editor → Site menu → Duplicate Site
3. Studio workspace → Site Actions → Duplicate
4. Transfer site to another account and back (forces workspace selection)
5. Create blank site + copy pages individually

---

### Feature 2: Wix Infrastructure Setup (F2)

**User Story:** As a developer, I want the Registros DB collection and Secrets Manager configured on the copy site so that deployed code can actually function.

**Cross-feature impact:** F2-T1 (DB creation) feeds into MC-1, which gates F4 (page logic). F2-T3 (Secrets) is independent — needed for gabinete sync but not for form to render. Both start in Wave 3 alongside F3-T1 and F5-T1.

**Acceptance Criteria:**
- [ ] Registros collection created with ALL fields from plan Section 4.4
- [ ] Required fields: nomeCompleto, apelido, celular, email, bairro
- [ ] Optional fields: cpf, sexo, dataNascimento, telefone, cep, endereco, numero, complemento, uf, observacao, titulo, sessao
- [ ] System fields: syncStatus, syncError, syncAttempts, gabineteId, lastSyncAt
- [ ] Index on `celular` field (for phone lookup performance)
- [ ] Test data seeded (2-3 records with known phone numbers)
- [ ] Secrets Manager: GABINETE_USERNAME and GABINETE_PASSWORD configured

**Tasks:**

| ID | Task | Dependencies | Wave | Effort | Status |
|----|------|--------------|------|--------|--------|
| F2-T1 | Navigate to copy site's CMS. Create "Registros" collection. Add all required, optional, and system fields with correct types. Add index on `celular`. | F1-T2 | **3** | M | ⬜ |
| F2-T2 | Seed test data: insert 2-3 records with known phone numbers (for phone-lookup testing). Include one "returning user" (celular="21999888777", apelido="Teste", syncStatus="synced") and one "pending" user. | F2-T1 | **4** | S | ⬜ |
| F2-T3 | Navigate to copy site's Secrets Manager. Add `GABINETE_USERNAME` and `GABINETE_PASSWORD` secrets with values from .env file. | F1-T2 | **3** | S | ⬜ |

**Tests Required:**
- N/A — interactive setup. Verification: `velo_read` to confirm collection exists, screenshot Secrets Manager page.

---

### Feature 3: Backend Module Deployment (F3)

**User Story:** As a developer, I want all backend .jsw modules deployed to the copy site's Velo IDE so that the registration system's server-side logic is in place.

**Cross-feature impact:** F3-T1 starts in Wave 3 (parallel with F2-T1, F2-T3, F1-T3, F5-T1). F3-T4 (import verification) feeds into MC-1, which gates F4 (page logic). The F3 chain is the longest path to MC-1: T1 → T2/T3 → T4.

**Acceptance Criteria:**
- [ ] `velo-field-mapper.js` deployed as .jsw backend module
- [ ] `velo-gabinete-client.js` deployed as .jsw backend module
- [ ] `sync-worker.js` deployed as .jsw backend module
- [ ] `wix-db-operations.js` deployed as .jsw backend module
- [ ] All modules appear in the Velo file tree
- [ ] `velo_read` confirms content matches local files
- [ ] No import errors in Velo IDE console

**Tasks:**

| ID | Task | Dependencies | Wave | Effort | Status |
|----|------|--------------|------|--------|--------|
| F3-T1 | Open copy site's Editor. Navigate to Velo IDE. Deploy `velo-field-mapper.js` via `velo_write`. Verify with `velo_read`. | F1-T2 | **3** | M | ⬜ |
| F3-T2 | Deploy `velo-gabinete-client.js`, `sync-worker.js`, `wix-db-operations.js` via `velo_write`. Verify each. | F3-T1 | **4** | M | ⬜ |
| F3-T3 | Deploy shared dependencies: `phone-validation.js`, `email-validation.js`, `suspicious-data.js`, `constants.js` as backend modules. These are imported by the page/backend code. | F3-T1 | **4** | M | ⬜ |
| F3-T4 | Check Velo IDE console for import errors. Fix any path issues (Wix .jsw import paths differ from local Node.js). Screenshot the file tree. | F3-T2, F3-T3 | **5** | S | ⬜ |

**Tests Required:**
- N/A — deployment is interactive. Verification: `velo_read` round-trip confirms content.

**Import path mapping (local → Wix Velo):**
```
Local:  import { mapFields } from './velo-field-mapper.js'
Wix:    import { mapFields } from 'backend/velo-field-mapper.jsw'

Local:  import { validatePhone } from './phone-validation.js'
Wix:    import { validatePhone } from 'public/phone-validation.js'
```

**NOTE:** Import paths will likely need adjustment. F3-T4 catches these issues.

---

### Feature 4: Page Logic Deployment (F4)

**User Story:** As a developer, I want the /participe page code deployed to the copy site so that the registration form handles phone lookup, validation, and submission.

**Cross-feature impact:** F4 is gated by MC-1 (DB + backend ready). Both F2-T2 and F3-T4 must complete before F4-T1 can start. F4-T2 then unblocks F5-T2 (masterPage.js), which feeds into MC-2 (the final gate before verification).

**Acceptance Criteria:**
- [ ] `participe-form-config.js` deployed as page code for /participe
- [ ] `phone-lookup.js` deployed (queries Registros DB)
- [ ] `form-submission-handler.js` deployed (validate → save → redirect)
- [ ] Page code wired to form elements ($w selectors)
- [ ] Form submission triggers the handler

**Tasks:**

| ID | Task | Dependencies | Wave | Effort | Status |
|----|------|--------------|------|--------|--------|
| F4-T1 | Navigate to /participe page in Velo IDE. Write page code that imports from backend modules and wires to form elements. This is a NEW file (Participe.js page code), not a direct copy of existing utils. | MC-1 (F2-T2 + F3-T4) | **6** | L | ⬜ |
| F4-T2 | Write the `$w.onReady()` handler: bind phone input blur → phone lookup, bind submit button → form-submission-handler, configure returning-user UI state. | F4-T1 | **6** | M | ⬜ |

**Tests Required:**
- Existing: 20 tests (participe-form-config), 17 tests (phone-lookup), 22 tests (form-submission-handler) — all pass locally
- NEW (TDD): Integration test for the Participe.js page code that ties everything together
  - [ ] Test: Page code imports all required modules without errors
  - [ ] Test: `$w.onReady` binds phone lookup to phone input blur event
  - [ ] Test: `$w.onReady` binds submission handler to submit button click
  - [ ] Test: Returning user state hides form and shows welcome message
  - [ ] Test: New user state shows full form

---

### Feature 5: UI Changes (F5)

**User Story:** As a developer, I want the WhatsApp links redirected to /participe and the masterPage.js bypass working so that the full user flow is complete.

**Cross-feature impact:** F5 has two independent tracks that converge at MC-2. F5-T1 (WhatsApp links) starts early in Wave 3 alongside F2/F3 — it has no code dependencies. F5-T2 (masterPage.js) starts late in Wave 7, depends on F4-T2. Both must complete before MC-2 gates F6 (verification).

**Acceptance Criteria:**
- [ ] WhatsApp floating widget (`comp-m6ryux73`) link changed from `wa.me/...` to `/participe`
- [ ] WhatsApp OG button (`comp-m6rymfn3`) link changed from `wa.me/...` to `/participe`
- [ ] masterPage.js checks if user is registered (phone in localStorage or cookie)
- [ ] Registered users clicking WhatsApp link bypass form → go directly to `wa.me/...`

**Tasks:**

| ID | Task | Dependencies | Wave | Effort | Status |
|----|------|--------------|------|--------|--------|
| F5-T1 | In copy site's Editor, find WhatsApp floating widget (`comp-m6ryux73`) and change its link href from `https://wa.me/5521978919938` to `/participe`. Do the same for OG button (`comp-m6rymfn3`). Use the preview frame to verify links changed. | F1-T2 | **3** | M | ⬜ |
| F5-T2 | Write masterPage.js code: on page load, check localStorage for `registeredPhone`. If found and user clicks a WhatsApp link, redirect directly to `wa.me/5521978919938` instead of `/participe`. Deploy via `velo_write` to masterPage.js. | F4-T2 | **7** | M | ⬜ |

**Tests Required (TDD):**
- [ ] Test: masterPage.js redirects registered user directly to WhatsApp
- [ ] Test: masterPage.js lets unregistered user proceed to /participe
- [ ] Test: localStorage key `registeredPhone` is checked on page load
- [ ] Test: Form submission handler sets `registeredPhone` in localStorage after successful registration

---

### Feature 6: Preview Verification (F6)

**User Story:** As a developer, I want to verify the full registration flow works on the copy site before considering it ready for live deployment.

**Cross-feature impact:** F6 is the terminal feature — gated by MC-2 (all code + UI deployed). All 5 preceding features must be complete. F6 itself is fully sequential (each test builds on previous results).

**Acceptance Criteria:**
- [ ] Test Site preview shows /participe with enhanced form
- [ ] New user flow: fill form → save to Registros → redirect to WhatsApp
- [ ] Returning user flow: phone recognized → welcome back → direct WhatsApp
- [ ] WhatsApp widget click → redirects to /participe (not wa.me)
- [ ] Journey agent completes full flow without errors
- [ ] User approves screenshots

**Tasks:**

| ID | Task | Dependencies | Wave | Effort | Status |
|----|------|--------------|------|--------|--------|
| F6-T1 | Click "Test Site" in copy site's Editor. Navigate to /participe in preview tab. Screenshot the form. Test new user registration: fill form, submit, verify DB record created, verify WhatsApp redirect. | MC-2 (F5-T1 + F5-T2) | **8** | M | ⬜ |
| F6-T2 | Test returning user flow: use the seeded test phone number, verify welcome back message, verify direct WhatsApp link. | F6-T1 | **8** | S | ⬜ |
| F6-T3 | Run journey agent against copy site's Test Site URL with tester persona. Goal: "Verify registration flow on /participe — new user + returning user + WhatsApp redirect". | F6-T2 | **8** | M | ⬜ |
| F6-T4 | Take final screenshots of all key states for user review. Save to `Updating-FlavioValle/screenshots/`. | F6-T3 | **8** | S | ⬜ |

**Tests Required:**
- Journey agent report (automated)
- Manual screenshot review (user approval)

---

## 5. Test Strategy

### 5.1 Testing Pyramid

```
         / Journey Agent (F6-T3) \        ← Automated UX on preview
        /  Manual Screenshots (F6-T4)  \
       /                                 \
      /    Integration (F4-T1 NEW)        \    ← Page code wiring
     /                                     \
    /      Unit Tests (345 existing)         \  ← All modules tested
   /__________________________________________ \
```

- **Unit Tests (345):** Already complete. Run before deployment to confirm nothing broke.
- **Integration Tests (NEW, F4-T1):** Test the Participe.js page code that wires everything together.
- **E2E / Journey:** Run against copy site's Test Site preview URL.

### 5.2 TDD Checklist

Only F4-T1, F4-T2, F5-T2 are TDD-able (they produce new code). All other tasks are interactive browser work.

```
For F4 and F5 TDD tasks:
1. [ ] Write failing test describing expected behavior
2. [ ] Verify test fails for the RIGHT reason
3. [ ] Commit failing test: "test: [description]"
4. [ ] Write MINIMUM code to pass test
5. [ ] Verify test passes
6. [ ] Refactor if needed (tests stay green)
7. [ ] Commit: "feat: [description]"
```

### 5.3 Testing Commands

```bash
# Existing unit tests (run BEFORE deployment)
cd Updating-FlavioValle/form-discovery && npm test

# Specific module
npm test -- participe-form-config.test.js

# General scraper tests (ensure driver still works)
cd general_scraper && python -m pytest tests/ -v

# Journey agent (AFTER deployment to copy site)
cd IA_Educacao_V2/backend && python -m tests.ui.investor_journey_agent \
    --persona tester \
    --url "[COPY_SITE_PREVIEW_URL]" \
    --goal "Verify: 1) /participe form loads 2) New user registration works 3) Returning user recognized 4) WhatsApp redirect works" \
    --max-steps 20
```

---

## 6. Dependency & Parallelism Analysis

### 6.1 Task Dependency Graph

```
WAVE 1 ─────────────────────────────────────────────────────────────────
  F1-T1 (Duplicate site)

WAVE 2 ─────────────────────────────────────────────────────────────────
  F1-T2 (Verify copy)

WAVE 3 ── 5 tasks, NO code dependencies between them ──────────────────
  F1-T3 (Profile YAML)  ║  F2-T1 (DB create)  ║  F2-T3 (Secrets)  ║  F3-T1 (Deploy mapper)  ║  F5-T1 (WhatsApp links)
                         ║       │              ║                    ║       │                  ║       │
WAVE 4 ── 3 tasks ──────║───────┼──────────────║────────────────────║───────┼──────────────────║───────┼──
                         ║  F2-T2 (Seed data)   ║                    ║  F3-T2 (Deploy .jsw)    ║       │
                         ║       │              ║                    ║       │                  ║       │
                         ║       │              ║                    ║  F3-T3 (Deploy shared)   ║       │
                         ║       │              ║                    ║       │                  ║       │
WAVE 5 ─────────────────║───────┼──────────────║────────────────────║───────┼──────────────────║───────┼──
                         ║       │              ║                    ║  F3-T4 (Fix imports)     ║       │
                         ║       │              ║                    ║       │                  ║       │
MC-1 ════════════════════║═══════╧══════════════║════════════════════║═══════╧══════════════════║       │
  ⊕ DB + backend ready (needs F2-T2 + F3-T4)                                                  ║       │
         │                                                                                     ║       │
WAVE 6 ──┼─────────────────────────────────────────────────────────────────────────────────────║───────┼──
  F4-T1 (Page code — TDD)                                                                     ║       │
         │                                                                                     ║       │
  F4-T2 (Wire $w events — TDD)                                                                ║       │
         │                                                                                     ║       │
WAVE 7 ──┼─────────────────────────────────────────────────────────────────────────────────────║───────┼──
  F5-T2 (masterPage.js — TDD)                                                                 ║       │
         │                                                                                     ║       │
MC-2 ════╧═════════════════════════════════════════════════════════════════════════════════════════════╧══
  ⊕ All code + UI deployed (needs F5-T1 + F5-T2)
         │
WAVE 8 ──┼──────────────────────────────────────────────────────────────────────────────────────────────
  F6-T1 (Test new user) → F6-T2 (Test returning) → F6-T3 (Journey agent) → F6-T4 (Screenshots)
```

### 6.2 Wave Summary

| Wave | Tasks | Features | Parallel? | What happens | Blockers cleared |
|------|-------|----------|-----------|--------------|------------------|
| **1** | F1-T1 | F1 | No | Duplicate the site | — |
| **2** | F1-T2 | F1 | No | Verify copy exists and matches live | Unblocks 5 tasks |
| **3** | F1-T3, F2-T1, F2-T3, F3-T1, F5-T1 | F1, F2, F3, F5 | **Yes** — 5 independent tasks across 4 features | Profile YAML + DB create + Secrets + first .jsw deploy + WhatsApp links | One browser session, interleaved |
| **4** | F2-T2, F3-T2, F3-T3 | F2, F3 | **Yes** — 3 independent writes | Seed data + deploy remaining .jsw + deploy shared deps | — |
| **5** | F3-T4 | F3 | No | Fix all import paths, verify zero errors | Feeds MC-1 |
| **MC-1** | — | F2 + F3 convergence | Gate | Verify DB + backend ready | Unblocks F4 |
| **6** | F4-T1, F4-T2 | F4 | No (sequential within) | TDD: page code + $w event wiring | — |
| **7** | F5-T2 | F5 | No | TDD: masterPage.js bypass | Feeds MC-2 |
| **MC-2** | — | F5-T1 + F5-T2 convergence | Gate | Verify all code + UI deployed | Unblocks F6 |
| **8** | F6-T1 → F6-T4 | F6 | No (sequential) | Full preview verification + journey agent | — |

### 6.3 Parallelism Reasoning

| Wave | Why parallel or sequential? |
|------|----------------------------|
| **Wave 3** | F1-T3 (YAML), F2-T1 (CMS), F2-T3 (Secrets), F3-T1 (Velo IDE), F5-T1 (editor links) touch **5 different parts of the Wix UI** with zero shared state. In practice they run in a single browser session, but can be queued back-to-back without waiting for "settle" time. |
| **Wave 4** | F2-T2 (insert rows), F3-T2 (write .jsw files), F3-T3 (write .js files) target **3 different surfaces** — CMS data panel, Velo backend folder, Velo public folder. No conflicts. |
| **Wave 5** | F3-T4 must run AFTER all deploys land (F3-T2 + F3-T3) because it checks the Velo console for import errors across ALL deployed files. |
| **Wave 6** | F4-T1 and F4-T2 are logically one unit (write page code, then wire events). TDD cycle handles both. |
| **Wave 7** | F5-T2 depends on F4-T2 because masterPage.js's returning-user bypass needs to know the exact localStorage key that the form handler (F4) writes. |
| **MC-2** | F5-T1 (WhatsApp links) started early in Wave 3 and is likely done by now. F5-T2 finishes here. Both must be complete for verification to test the full flow. |

**Critical path:** F1-T1 → F1-T2 → F3-T1 → F3-T2/T3 → F3-T4 → MC-1 → F4-T1 → F4-T2 → F5-T2 → MC-2 → F6 (12 sequential steps on the longest path).

**Early-finish path:** F5-T1 (WhatsApp links) can complete as early as Wave 3 and waits at MC-2. F2-T3 (Secrets) and F1-T3 (YAML) also finish early with no downstream dependents.

### 6.4 Task Dependency Table

> **Source of truth for `/tdd` workflow.** After completing a task, `/tdd` reads this table to determine which tasks are newly unblocked.

| Task | Description | Depends On | Unblocks | Wave | Status |
|------|-------------|------------|----------|------|--------|
| F1-T1 | Duplicate flaviovalle.com | None | F1-T2 | 1 | ⬜ |
| F1-T2 | Verify copy site | F1-T1 | F1-T3, F2-T1, F2-T3, F3-T1, F5-T1 | 2 | ⬜ |
| F1-T3 | Create copy site profile YAML | F1-T2 | — | 3 | ⬜ |
| F2-T1 | Create Registros DB collection | F1-T2 | F2-T2 | 3 | ⬜ |
| F2-T2 | Seed test data | F2-T1 | MC-1 | 4 | ⬜ |
| F2-T3 | Configure Secrets Manager | F1-T2 | — | 3 | ⬜ |
| F3-T1 | Deploy velo-field-mapper.js | F1-T2 | F3-T2, F3-T3 | 3 | ⬜ |
| F3-T2 | Deploy remaining .jsw modules | F3-T1 | F3-T4 | 4 | ⬜ |
| F3-T3 | Deploy shared dependencies | F3-T1 | F3-T4 | 4 | ⬜ |
| F3-T4 | Fix import paths, verify no errors | F3-T2, F3-T3 | MC-1 | 5 | ⬜ |
| F5-T1 | Change WhatsApp links to /participe | F1-T2 | MC-2 | 3 | ⬜ |
| MC-1 | ⊕ DB + backend modules all ready | F2-T2, F3-T4 | F4-T1 | — | ⬜ |
| F4-T1 | Write Participe.js page code (TDD) | MC-1 | F4-T2 | 6 | ⬜ |
| F4-T2 | Wire $w events to handlers (TDD) | F4-T1 | F5-T2 | 6 | ⬜ |
| F5-T2 | Deploy masterPage.js bypass (TDD) | F4-T2 | MC-2 | 7 | ⬜ |
| MC-2 | ⊕ All code + UI changes deployed | F5-T1, F5-T2 | F6-T1 | — | ⬜ |
| F6-T1 | Test new user flow in preview | MC-2 | F6-T2 | 8 | ⬜ |
| F6-T2 | Test returning user flow | F6-T1 | F6-T3 | 8 | ⬜ |
| F6-T3 | Run journey agent | F6-T2 | F6-T4 | 8 | ⬜ |
| F6-T4 | Final screenshots for user approval | F6-T3 | — | 8 | ⬜ |

---

## 7. Implementation Phases

### Phase 1: Site Duplication (Waves 1–2 — sequential, interactive)

**Features involved:** F1 only
**Type:** Interactive browser work

| Batch | Tasks | Wave | Parallel? | Rationale |
|-------|-------|------|-----------|-----------|
| A | F1-T1, F1-T2 | 1, 2 | No | Must duplicate first, then verify |

- [ ] F1-T1: Duplicate flaviovalle.com (try dashboard, editor, studio, fallbacks)
- [ ] F1-T2: Verify copy site matches live (16 pages, 0 custom collections)

**Exit criterion:** Copy site loads in Editor, pages match live.

### Phase 2: Infrastructure + First Deploys (Wave 3 — 5 parallel tasks across 4 features)

**Features involved:** F1 (profile), F2 (DB + Secrets), F3 (first deploy), F5 (WhatsApp links)
**Type:** Interactive browser work — one session, interleaved execution

| Batch | Tasks | Wave | Parallel? | Rationale |
|-------|-------|------|-----------|-----------|
| B | F1-T3, F2-T1, F2-T3, F3-T1, F5-T1 | 3 | **Yes** | 5 independent Wix UI surfaces — no shared state |

- [ ] F1-T3: Create copy site profile YAML
- [ ] F2-T1: Create Registros DB collection with full schema
- [ ] F2-T3: Configure Secrets Manager
- [ ] F3-T1: Deploy velo-field-mapper.js (first module test)
- [ ] F5-T1: Change WhatsApp widget + OG button links

**Exit criterion:** DB exists, Secrets configured, first .jsw verified via `velo_read`, WhatsApp links point to /participe.

### Phase 3: Complete Deployment (Waves 4–5 — parallel batch then verification gate)

**Features involved:** F2 (seed), F3 (remaining deploys + import fix)
**Type:** Interactive browser work

| Batch | Tasks | Wave | Parallel? | Rationale |
|-------|-------|------|-----------|-----------|
| C | F2-T2, F3-T2, F3-T3 | 4 | **Yes** | 3 independent writes to CMS, backend/, public/ |
| D | F3-T4 | 5 | No | Must verify ALL deploys before proceeding |

- [ ] F2-T2: Seed test data (2-3 records)
- [ ] F3-T2: Deploy remaining .jsw backend modules
- [ ] F3-T3: Deploy shared dependencies (validation, constants)
- [ ] F3-T4: Fix import paths, verify Velo IDE has no errors

**Exit criterion (MC-1):** Velo console shows zero errors, DB has test records, all .jsw files verified via `velo_read`.

### Phase 4: Page Logic (Waves 6–7 — TDD, sequential)

**Features involved:** F4 (page code), F5 (masterPage.js)
**Type:** TDD — RED/GREEN/REFACTOR cycles

| Batch | Tasks | Wave | Parallel? | Rationale |
|-------|-------|------|-----------|-----------|
| E | F4-T1, F4-T2 | 6 | No | Page code then event wiring (one TDD cycle) |
| F | F5-T2 | 7 | No | masterPage.js needs the localStorage key from F4 |

- [ ] F4-T1: Write Participe.js page code (TDD — RED/GREEN/REFACTOR)
- [ ] F4-T2: Wire $w events to handlers (TDD)
- [ ] F5-T2: Deploy masterPage.js returning-user bypass (TDD)

**Exit criterion (MC-2):** All code deployed, WhatsApp links changed (F5-T1 done since Wave 3), masterPage.js live on copy. 345 existing tests + new integration tests all green.

### Phase 5: Verification (Wave 8 — sequential, interactive)

**Features involved:** F6 only
**Type:** Interactive preview testing + journey agent

| Batch | Tasks | Wave | Parallel? | Rationale |
|-------|-------|------|-----------|-----------|
| G | F6-T1 → F6-T4 | 8 | No | Each test builds on previous verification |

- [ ] F6-T1: Test new user registration in preview
- [ ] F6-T2: Test returning user recognition
- [ ] F6-T3: Run journey agent
- [ ] F6-T4: Final screenshots for user approval

**Exit criterion:** User approves screenshots. Journey agent report shows no critical issues.

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Site duplication fails (Studio workspace issue) | Medium | High | 5 fallback strategies documented in F1-T1. Worst case: blank site + copy pages individually |
| Velo import paths differ from local Node.js | High | Medium | F3-T4 specifically catches this. Known mapping: `./module.js` → `backend/module.jsw` |
| Wix form elements have different IDs on copy | Medium | Medium | IDs like `comp-m4wplov41` may change on duplication. Rediscover with scraper. |
| Copy site doesn't copy Velo Dev Mode state | Low | Low | Re-enable Dev Mode manually. Already know the selectors. |
| Secrets Manager not available on free/copy site | Low | High | If Secrets Manager requires premium, hardcode credentials for testing (copy only). |
| wix-data API behaves differently on copy | Low | Medium | Seed data + manual verification confirms DB operations work |
| Session expires mid-deployment | Medium | Low | Storage state auto-saves. Re-login takes ~15s via rapid login workflow. |

---

## 9. Open Questions

- [ ] **Component IDs on copy:** Do Wix component IDs (`comp-m6ryux73`, `comp-m4wplov41`) survive duplication, or do they get new IDs?
- [ ] **Premium features on copy:** Does the copy inherit premium features (custom domain, Secrets Manager, Velo backend)?
- [ ] **Wix .jsw file creation:** Can `velo_write` create NEW .jsw files, or only edit existing ones? May need to create files via Velo IDE UI first.
- [ ] **Bairro → id_bairro mapping:** Still need the numeric ID mapping table for gabineteonline. Deferred to F6 (sync phase).
- [ ] **Form checkbox:** The existing /participe checkbox purpose is still unknown. Keep it for now.

---

## 10. Approval Checklist

- [ ] Requirements reviewed by: _____________ Date: _________
- [ ] Architecture reviewed by: _____________ Date: _________
- [ ] Plan approved by: _____________ Date: _________

---

## 11. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-12 | Initial plan created from discovery session (7/7 categories). Copy-first strategy replaces live-site-with-preview approach. Scraper replaces Wix CLI. | Claude Opus 4.6 |
| 2026-02-12 | Revised: Added Wave column to every feature task table, cross-feature impact notes per feature, Wave Summary table (Section 6.2), critical path analysis, exit criteria per phase, expanded dependency graph with wave lanes. | Claude Opus 4.6 |

---

## Appendix A: Files Ready for Deployment

| Local Path | Wix Target | Type | Tests |
|------------|------------|------|-------|
| `utils/velo-field-mapper.js` | `backend/velo-field-mapper.jsw` | Backend module | 17 |
| `utils/velo-gabinete-client.js` | `backend/velo-gabinete-client.jsw` | Backend module | 16 |
| `utils/sync-worker.js` | `backend/sync-worker.jsw` | Backend module | 14 |
| `utils/wix-db-operations.js` | `backend/wix-db-operations.jsw` | Backend module | 17 |
| `utils/phone-validation.js` | `public/phone-validation.js` | Shared (public) | 21 |
| `utils/email-validation.js` | `public/email-validation.js` | Shared (public) | 41 |
| `utils/suspicious-data.js` | `public/suspicious-data.js` | Shared (public) | 51 |
| `utils/constants.js` | `public/constants.js` | Shared (public) | — |
| `utils/participe-form-config.js` | `public/participe-form-config.js` | Shared (public) | 20 |
| `utils/phone-lookup.js` | Page code import | Page helper | 17 |
| `utils/form-submission-handler.js` | Page code import | Page helper | 22 |
| NEW: `Participe.js` | `/participe` page code | Page code | TBD (F4) |
| EDIT: `masterPage.js` | Site-wide page code | Global code | TBD (F5-T2) |

## Appendix B: Registros DB Schema

(Identical to PLAN_WIX_REGISTRATION_SYSTEM.md Section 4.4 — included here for deployment reference)

**Required fields (5):**

| Wix Field | Type | Max | Index |
|-----------|------|-----|-------|
| `nomeCompleto` | text | 200 | — |
| `apelido` | text | 30 | — |
| `celular` | text | 14 | ✅ (unique lookup) |
| `email` | text | 5000 | — |
| `bairro` | text | — | — |

**Optional fields (12):**
cpf, sexo, dataNascimento, telefone, cep, endereco, numero, complemento, uf, observacao, titulo, sessao

**System fields (5):**

| Wix Field | Type | Default |
|-----------|------|---------|
| `syncStatus` | text | `"pending"` |
| `syncError` | text | `null` |
| `syncAttempts` | number | `0` |
| `gabineteId` | text | `null` |
| `lastSyncAt` | text | `null` |

## Appendix C: Scraper Quick Start

```bash
# Launch scraper with saved session
cd general_scraper
powershell -Command "python interactive_driver.py --profile flaviovalle --mode storage_state --stealth-mode stealth-js"

# Key IPC commands for this plan:
# Navigate to copy site dashboard
python _cmd.py <IPC_DIR> navigate url=https://manage.wix.com/dashboard/<COPY_SITE_ID>

# Open copy site editor
python _cmd.py <IPC_DIR> navigate url=<COPY_EDITOR_URL>

# Deploy a .jsw module
python _cmd.py <IPC_DIR> velo_write filename=backend/velo-field-mapper.jsw content="<file_content>"

# Read back to verify
python _cmd.py <IPC_DIR> velo_read filename=backend/velo-field-mapper.jsw

# Navigate to /participe in editor
python _cmd.py <IPC_DIR> navigate_wix section=page page=Participe

# Screenshot
python _cmd.py <IPC_DIR> screenshot label=participe_form
```
