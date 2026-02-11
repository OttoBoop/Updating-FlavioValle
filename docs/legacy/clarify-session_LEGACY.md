# Clarify Session: Wix Registration Gate for WhatsApp Contact

**Topic**: Add registration page before WhatsApp contact on flaviovalle.com, with automatic data submission to gabineteonline1.com.br

**Started**: 2026-02-10

---

## Context from Prior Discussion

- **Current Site**: flaviovalle.com (live production, Wix-hosted)
- **Current Process**: Users click WhatsApp → Staff manually register them later at gabineteonline1.com.br
- **Goal**: Intercept WhatsApp clicks → Show registration form → Auto-submit to gabineteonline1 → Then allow WhatsApp access
- **Technical Constraints**:
  - Wix website (complex Google login for editor)
  - gabineteonline1.com.br requires login (simpler)
  - Must not disrupt live production site during development
- **Approach Discussed**: Wix Velo + browser automation for form discovery

---

## Questions Asked

### Iteration 1 - Core Requirements (Success Criteria)

**Q1**: What defines success for this project?
**A1**: Standard version - validation, error handling, returning user detection (not basic, not over-engineered)

**Q2**: What should happen if the registration system completely fails?
**A2**: Graceful degradation - collect data locally in Wix DB, sync to gabineteonline later in background

**Q3**: Registration frequency?
**A3**: One-time only. Important detail: Users should NOT need to create a login. When they enter their phone number, system should auto-recognize them and fill in their existing data. No traditional login - just phone-based recognition.

---

### Iteration 2 - Core Requirements (Scope Boundaries)

**Q4**: Data collection scope?
**A4**: Discover gabineteonline fields first, then decide if additional fields needed

**Q5**: What's explicitly OUT OF SCOPE?
**A5**:
- OUT: User account management (password resets, profile editing)
- OUT: SMS verification for phone numbers
- UNCLEAR (not marked out): Email confirmations, admin dashboard (may want these)

**Q6**: Definition of "DONE"?
**A6**:
- ✅ All tests pass (unit + integration + E2E)
- ✅ Data verified appearing in gabineteonline admin panel
- ✅ Works on mobile + desktop + major browsers
- ✅ Successfully tested on staging with real data

---

### Iteration 3 - Users & Context (Demographics & Devices)

**Q7**: Who are your typical constituents?
**A7**: Mixed/all age groups - need to accommodate wide range of technical abilities

**Q8**: What devices do they primarily use?
**A8**: Mobile phones (smartphones) AND Desktop computers - must work well on both

**Q9**: Expected technical skill level?
**A9**: LOW - many struggle with basic web forms (need very simple UI, clear instructions, validation hints)

**KEY INSIGHT**: Target audience is non-tech-savvy users on mobile + desktop. Must prioritize simplicity and clear guidance over advanced features.

---

### Iteration 4 - Users & Context (Language & Accessibility)

**Q10**: Language support?
**A10**: Portuguese only (Brazilian Portuguese)

**Q11**: Accessibility requirements?
**A11**: No specific requirements beyond basic best practices (standard web accessibility sufficient)

**Q12**: Usage frequency?
**A12**: Regular (weekly/monthly) - frequent constituent engagement expected

**KEY INSIGHT**: Regular users means returning user recognition (phone-based) is critical for good UX

---

### Iteration 5 - Integration Points (Systems & Data Flow)

**Q13**: gabineteonline API availability?
**A13**: Unknown - need to investigate (form discovery required)

**Q14**: gabineteonline authentication?
**A14**: Simple username/password (session cookies) - straightforward login

**Q15**: Other systems to receive data?
**A15**: No - gabineteonline only (single destination)

---

### Iteration 6 - Integration Points (Data Validation & Sync)

**Q16**: How to handle extra gabineteonline fields?
**A16**: Collect main/required fields only. Auto-fill fields that are always the same or not useful. **Minimize user effort - less is better**.

**Q17**: When to sync to gabineteonline?
**A17**: Background/async - user doesn't need to know about gabineteonline submission. After Wix registration, send to WhatsApp immediately.

**Q18**: Duplicate phone number handling?
**A18**: Phone lookup auto-fills ALL existing data. User can edit (sparse override). **No duplicates possible** - existing phone = pre-populated form that can be updated.

**KEY INSIGHT**: Two-tier system: 1) Wix registration (user-facing), 2) Background sync to gabineteonline (transparent). Phone number is unique identifier.

---

### Iteration 7 - Edge Cases (Failure Scenarios)

**Q19**: Internet connection drops during submission?
**A19**: Show error, keep form data filled (user can retry without re-entering)

**Q20**: Obviously fake data (phone: 111111111)?
**A20**: Flag for staff review before gabineteonline sync (quality control gate)

**Q21**: gabineteonline down or slow (>10 seconds)?
**A21**: **Two-tier system confirmed**:
- User registers in Wix → immediately access WhatsApp
- Background sync to gabineteonline with alerts/warnings if it fails
- Staff gets notified when gabineteonline sync fails

**KEY INSIGHT**: Wix is source of truth. Gabineteonline sync is best-effort with monitoring.

---

### Iteration 8 - Edge Cases (Boundary Conditions & Invalid Input)

**Q22**: Phone number format?
**A22**: Brazilian by default (+55), international optional (allow override)

**Q23**: Minimum age?
**A23**: No restriction - any age can register

**Q24**: Shared device handling?
**A24**: Each registration independent - phone number identifies user, not device

---

### Iteration 9 - Quality Attributes (Performance & Security)

**Q25**: Acceptable response time?
**A25**: < 5 seconds acceptable (show loading indicator)

**Q26**: Expected traffic load?
**A26**: Medium (10-100/day) normally, sometimes low. **IMPORTANT**: Election time coming up THIS YEAR - may need spike handling (100-1000+/day)

**Q27**: Security/privacy concerns?
**A27**: Not really - gabineteonline1 handles compliance (LGPD, encryption, etc.)

**KEY INSIGHT**: Must be ready for election period spike traffic later in 2026.

---

### Iteration 10 - Quality Attributes (Monitoring & Logging)

**Q28**: Who gets notified of issues?
**A28**: SMS/WhatsApp to technical contact (immediate notification)

**Q29**: What to log?
**A29**: Comprehensive logging:
- Every submission attempt (success + failure)
- gabineteonline sync status
- User behavior (clicks, form interactions)

**Q30**: Admin dashboard needed?
**A30**: Yes - use Wix database viewer (built-in, no custom build)

---

### Iteration 11 - Existing Patterns (Current Codebase)

**Q31**: Current Velo usage?
**A31**: Never used Velo - this is first custom code (setup from scratch)

**Q32**: Existing forms for reference?
**A32**: User suggests scraping flaviovalle.com to check. Likely need brand new form. Can note design patterns from site.

**Q33**: WhatsApp buttons implementation?
**A33**:
- Widget button (bottom right) - takes couple seconds to load
- Link on frontpage

**ACTION ITEM**: Scrape flaviovalle.com to check for existing forms and capture design patterns (colors, fonts, spacing, button styles)

---

### Iteration 12 - Existing Patterns (Design & Infrastructure)

**Q34**: Wix database usage?
**A34**: Not sure - **this is user's FIRST TIME using Wix**. Many questions will be answered once we log in and explore.

**Q35**: Dev/testing infrastructure?
**A35**: Need to create dev site duplicate

**Q36**: Wix editor access?
**A36**: Small team (2-5 people)

**KEY INSIGHT**: User is new to Wix. Need discovery/exploration phase once we have login access.

---

### Iteration 13 - Preferences (Approach & Priorities)

**Q37**: Top priority?
**A37**: Speed - launch quickly, iterate later (MVP approach)

**Q38**: UX vs Technical Simplicity?
**A38**: Prioritize technical simplicity (simpler implementation over fancy UX)

**Q39**: Hands-on involvement?
**A39**: Moderate - check-ins at milestones (not every step, not just final result)

---

### Iteration 14 - Preferences (Things to Avoid & Concerns)

**Q40**: Technologies to AVOID?
**A40**: Third-party paid services (prefer free/built-in solutions)

**Q41**: Biggest concern?
**A41**: Breaking the live website (critical - must protect production)

**Q42**: What can be deferred to v2?
**A42**: Analytics / usage tracking (basic logging OK, detailed analytics later)

---

### Iteration 15 - Preferences (Final Questions)

**Q43**: Maintenance ownership?
**A43**: User will maintain - need clear documentation

**Q44**: Design consistency?
**A44**: Use Wix's built-in form styling (no custom design work)

**Q45**: Timeline?
**A45**: ASAP - launch within days (very urgent!)

**KEY INSIGHT**: Urgent MVP with built-in styling, clear documentation for user to maintain.

---

### Iteration 16 - Final Clarifications (Critical Flow Details)

**Q46**: Credentials ready?
**A46**: CORRECTION - Both Wix AND gabineteonline use simple email+password! (User was wrong about Google login complexity)

**Q47**: Auto-fill behavior for returning users?
**A47**: **Multi-step flow** (IMPORTANT):
1. Phone number entry screen (first)
2a. IF existing phone → "Welcome back [Name]" screen with TWO options:
   - Button: "Contact via WhatsApp" (direct access)
   - Button: "Edit my information" (shows pre-filled form for editing)
2b. IF new phone → Registration form (all fields blank)

**Q48**: Form UI pattern?
**A48**: Separate dedicated page (not modal/lightbox)

**KEY INSIGHT**: Three-page flow:
- Page 1: Phone number lookup
- Page 2a (returning): Welcome back with options
- Page 2b (new): Registration form
- Page 3: WhatsApp redirect

---

### Iteration 17 - Final Wrap-up Questions

**Q49**: Retry logic for gabineteonline sync?
**A49**: 3 retries (common pattern) with delays, then alert staff

**Q50**: Phone number immutability?
**A50**: Allow phone number edits (not locked)

**Q51**: "Edit information" button text?
**A51**: "Atualizar Cadastro" (Update Registration) - professional/formal

---

### Iteration 18 - Implementation Specifics

**Q52**: WhatsApp redirect?
**A52**: **CRITICAL**: Current WhatsApp redirect works perfectly - DON'T TOUCH IT. Just intercept BEFORE redirect happens. Add registration page in the middle.

**Q53**: Credentials setup timing?
**A53**: Phase 1 - build secure credential storage FIRST. User will provide credentials safely, stored across sessions.

**Q54**: Work approach (sequential vs parallel)?
**A54**: **CLEAR SEQUENCE**:
- **Phase 1**: Safe credential storage system
- **Phase 2 (PARALLEL)**:
  - Track A: Discover gabineteonline fields/API
  - Track B: Build Wix registration form + backend
- **Phase 3**: Link systems (Wix → gabineteonline sync)
- **Phase 4**: Testing
- **Phase 5**: Deployment

---

### Iteration 19 - Final Question

**Q55**: Post-launch verification?
**A55**: Multi-layered approach:
- User will test manually (fake registration)
- Monitor Wix database for entries
- Check gabineteonline for synced data
- **IMPORTANT**: Claude should autonomously test FULL flow (flaviovalle form → Wix DB → gabineteonline). Claude is first line of verification.

**Q56**: Anything else?
**A56**: User wants to review emerging requirements summary first

---

## Emerging Requirements

### System Architecture

**Three-Page User Flow:**
1. **Phone Lookup Page**: User enters phone number
   - IF existing → Navigate to "Welcome Back" page
   - IF new → Navigate to "Registration Form" page

2a. **Welcome Back Page** (returning users):
   - Display: "Bem-vindo de volta, [Name]!"
   - Button 1: "Entrar em contato via WhatsApp" (direct to WhatsApp)
   - Button 2: "Atualizar Cadastro" (navigate to pre-filled edit form)

2b. **Registration Form Page** (new users):
   - Collect fields discovered from gabineteonline form
   - Minimal fields only (user effort minimized)
   - Auto-fill fields that are always the same
   - Brazilian phone format by default, international optional
   - Portuguese language only
   - Use Wix built-in form styling

3. **WhatsApp Redirect**: After registration/update, redirect to existing WhatsApp flow (DON'T MODIFY CURRENT REDIRECT)

**Two-Tier Data Architecture:**
- **Tier 1 (Primary)**: Wix Database - source of truth for registrations  - User-facing registration saves here immediately
  - Phone number is unique identifier
  - Phone numbers CAN be edited (not immutable)

- **Tier 2 (Secondary)**: gabineteonline1.com.br - background sync
  - Async submission after Wix save (user doesn't wait)
  - 3 retry attempts with exponential backoff (1s, 2s, 4s)
  - If sync fails: SMS/WhatsApp alert to technical contact
  - Suspicious data (fake patterns) flagged for staff review before sync

### Technical Constraints

- **Platform**: Wix (first time using Velo - need setup from scratch)
- **No paid services**: Use built-in Wix features only
- **Dev environment**: Create duplicate dev site for testing (protect live production)
- **Authentication**: Simple email+password for both Wix and gabineteonline
- **Credentials**: Build secure storage system FIRST (Phase 1)
- **No touching**: Current WhatsApp redirect works perfectly - only intercept before redirect

### Implementation Phases

**Phase 1: Secure Credential Storage**
- Build system for user to provide credentials safely
- Store Wix and gabineteonline login info encrypted
- Persist across sessions

**Phase 2 (Parallel Execution):**
- **Track A**: Discover gabineteonline form schema
  - Login to gabineteonline
  - Inspect cadastro_clientes_dados.php form
  - Extract field definitions, types, validation
  - Generate schema for Wix form

- **Track B**: Build Wix registration system
  - Set up Wix Velo (first time)
  - Create 3 pages (phone lookup, welcome back, registration)
  - Build Wix database collection
  - Implement phone number lookup logic
  - Intercept WhatsApp button/widget clicks

**Phase 3: Integration**
- Link Wix → gabineteonline sync
- Background submission with retry logic
- Alert system for failures

**Phase 4: Testing**
- Claude autonomously tests full flow (flaviovalle → Wix → gabineteonline)
- User manually tests as double-check
- Cross-browser testing (mobile + desktop)
- Low-tech user testing (non-tech-savvy audience)

**Phase 5: Deployment**
- Feature flag approach for safety
- Monitor closely for first week
- Rollback plan documented

### User Experience Requirements

- **Target Audience**: Mixed age groups, LOW technical skill level
- **Devices**: Mobile phones + desktop computers (both must work)
- **Usage Frequency**: Regular (weekly/monthly) - returning user recognition critical
- **Performance**: < 5 seconds acceptable (show loading indicator)
- **Language**: Portuguese only
- **Accessibility**: Basic best practices (no special requirements)
- **Design**: Use Wix built-in styling (no custom design)

### Edge Cases & Error Handling

- **Network failure**: Show error, keep form filled (user can retry)
- **Fake data**: Flag for staff review before gabineteonline sync
- **gabineteonline down/slow**: User registers in Wix → WhatsApp access immediately. Background sync with alerts if it fails.
- **Duplicate phone**: Phone lookup auto-fills ALL existing data. User can edit (update operation).
- **Shared devices**: Each registration independent (phone identifies user, not device)
- **International phones**: Brazilian by default, international optional

### Quality Attributes

- **Priority**: Speed of delivery (MVP approach) over feature completeness
- **Tradeoff**: Technical simplicity over fancy UX
- **Scalability**: Medium load normally, but election coming in 2026 - must handle spikes
- **Security**: Covered by gabineteonline (LGPD, encryption)
- **Monitoring**: Comprehensive logging:
  - All submission attempts (success + failure)
  - gabineteonline sync status
  - User behavior (clicks, interactions)
- **Alerting**: SMS/WhatsApp to technical contact for critical issues
- **Dashboard**: Use Wix built-in database viewer (no custom build)

### Out of Scope (v1)

- User account management (password resets, profile editing)
- SMS verification for phone numbers
- Detailed analytics/usage tracking (basic logging only)
- Email notifications/confirmations (can add in v2)
- Custom admin dashboard (use Wix database viewer)

### Maintenance

- **Owner**: User will maintain (need clear documentation)
- **Timeline**: ASAP - launch within days (urgent!)
- **Biggest Concern**: Breaking live website (must protect production)

### Success Metrics (Post-Launch)

- Registration form works on mobile + desktop
- Data appears in Wix database
- Data syncs to gabineteonline (or alerts sent if fails)
- Returning users recognized by phone number
- Form completion < 2 minutes
- < 5 blocking issues in first week

---

## Questions Count: 56 questions across 7 categories

✅ Core Requirements (9 questions)
✅ Users & Context (6 questions)
✅ Integration Points (6 questions)
✅ Edge Cases (6 questions)
✅ Quality Attributes (6 questions)
✅ Existing Patterns (5 questions)
✅ Preferences (18 questions)

**Status**: Comprehensive discovery complete

---

# Phase 2A Clarification: Form Discovery Automation

**Sub-Topic**: Automate login to gabineteonline1.com.br/flaviovalle and extract form field schema
**Started**: 2026-02-10
**Target Questions**: ~25 questions
**Status**: In Progress

## Context from Previous Failure
- Previous attempt had credential structure mismatch (gabineteEmail showing as undefined)
- Page timeout issues (30 seconds, likely Cloudflare protection)
- Bash heredoc escaping problems when creating files
- Never successfully logged in or discovered forms
- User wants to restart with proper clarification

## Questions Asked

### Iteration 1 - Core Requirements (Discovery Scope)

**Q1**: What specific information do you need to extract from the gabineteonline form fields?
**Q2**: What should the output format of the discovered schema be?

### Iteration 2 - Core Requirements (Navigation & Protection)

**Q3**: After logging in, do you know the exact URL or navigation path to reach the 'register new user' form?
**Q4**: How should the script handle Cloudflare protection or anti-bot measures?

### Iteration 3 - Core Requirements (Frequency & Credentials)

**Q5**: Is this form discovery a one-time task or will it need to run repeatedly?
**Q6**: Do the encrypted credentials in .env definitely work, or do they need to be verified/updated?

### Iteration 4 - Integration Points (Login Observations)

**Q7**: When you manually log in to gabineteonline, what do you observe about the login process?
**Q8**: Have you successfully logged in manually using these exact credentials on the gabineteonline site recently?

### Iteration 5 - Edge Cases (CAPTCHA & Post-Discovery)

**Q9**: If the automation encounters a CAPTCHA during login, how should it handle it?
**Q10**: After successfully extracting the form schema, what should happen next?

### Iteration 6 - Integration Points (Form Content)

**Q11**: What types of fields do you expect to find on the gabineteonline registration form?
**Q12**: After logging in, what keyword or link text should the script look for to find the registration page?

### Iteration 7 - Edge Cases (Retry Logic & Browser Mode)

**Q13**: If login fails (not due to CAPTCHA), how should the script respond?
**Q14**: Should the browser run in headless mode (invisible) or headful mode (visible)?

### Iteration 8 - Quality Attributes (Timeouts & Verification)

**Q15**: What timeout should the script use for page loads and network operations?
**Q16**: How should the script verify that login was successful?

### Iteration 9 - Preferences (Logging & Screenshots)

**Q17**: How verbose should the console logging be during script execution?
**Q18**: Should the script take screenshots during execution?

### Iteration 10 - Existing Patterns (Output & Dependencies)

**Q19**: Where should the extracted schema JSON file be saved?
**Q20**: Should the script use playwright-extra with stealth plugin, or stick with standard Playwright?

### Iteration 11 - Edge Cases (Credentials & Error Reporting)

**Q21**: The previous script showed 'credentials.gabineteEmail' as undefined. What property names are actually in the decrypted credentials object?
**Q22**: How should the script report errors or failures?

### Iteration 12 - Quality Attributes (Success Criteria & Cleanup)

**Q23**: What would you consider a successful completion of this form discovery task?
**Q24**: Should the script automatically close the browser when done, or leave it open?
**Q25**: Is there anything else important about this form discovery task that we haven't covered?

## Answers Received

### Iteration 1 - Core Requirements (Discovery Scope)

**A1**: Find the page for registering a new user and gather all optional and required info. Then plan how to get that info from Wix automatically.
**A2**: JSON file

### Iteration 2 - Core Requirements (Navigation & Protection)

**A3**: No - need to explore after login. Script should look for registration/cadastro links and navigate automatically.
**A4**: Use stealth plugin - playwright-extra with stealth plugin to bypass Cloudflare detection.

### Iteration 3 - Core Requirements (Frequency & Credentials)

**A5**: One-time discovery - run once, manually update if gabineteonline changes their form.
**A6**: **CRITICAL**: The credentials are correct. The problem is the bot is unable to log in properly (not a credential issue, but an automation/detection issue).

### Iteration 4 - Integration Points (Login Observations)

**A7**: Login process is:
- Simple form (email + password fields)
- **SOMETIMES shows CAPTCHA or bot checks** (anti-automation measure)
**A8**: Yes, manually logged in successfully within the last day (credentials confirmed working).

### Iteration 5 - Edge Cases (CAPTCHA & Post-Discovery)

**A9**: **REQUIREMENT**: Bypass any CAPTCHAs for free (no paid services like 2captcha). Must use free stealth techniques.
**A10**: After extracting schema:
- Generate Wix form mapping (showing how Wix fields connect to gabineteonline fields)
- Show summary report (field count, required/optional breakdown)

### Iteration 6 - Integration Points (Form Content)

**A11**: Expected field types:
- Personal info (name, email, phone)
- Address fields (street, city, state)
- Dates (birth date, etc.)
**A12**: Search for multiple keywords since exact wording unknown:
- "Cadastro" or "Cadastrar" (register)
- "Novo cliente" or "Novo usuário" (new client/user)
- "Adicionar" or "+" (add/plus button)
- Explore all links if keywords not found

### Iteration 7 - Edge Cases (Retry Logic & Browser Mode)

**A13**: Retry 3 times with delays (exponential backoff: 5s, 10s, 20s between attempts)
**A14**: CLI flag option (--headless or --headful), with **headful as default during development** for easier debugging and Cloudflare bypassing.

### Iteration 8 - Quality Attributes (Timeouts & Verification)

**A15**: 30 seconds timeout (standard Playwright default)
**A16**: Wait for specific dashboard element to verify login success (need to identify which element after exploring)

### Iteration 9 - Preferences (Logging & Screenshots)

**A17**: Use CLI keywords/flags for logging level control, but **default to full debug mode for development purposes** (detailed logging during dev, configurable for production)
**A18**: Take screenshots at key milestones (after login, on form page, after extraction, etc.)

### Iteration 10 - Existing Patterns (Output & Dependencies)

**A19**: Save to **form-discovery/output/gabineteonline-schema.json** (dedicated output directory)
**A20**: Use **playwright-extra + stealth plugin** for better CAPTCHA/Cloudflare bypassing (add as new dependency)

### Iteration 11 - Edge Cases (Credentials & Error Reporting)

**A21**: **INVESTIGATION NEEDED**: May have erroneously assumed gabinete used email instead of username. The .env definitely has both logins saved. Need to inspect actual property names in decrypted credentials object (might be `username` not `email`).
**A22**: Error reporting should include:
- Console error messages (print to terminal)
- Save error log file (form-discovery/output/error.log)
- Take screenshot of failure state

### Iteration 12 - Quality Attributes (Success Criteria & Cleanup)

**A23**: **CRITICAL CLARIFICATION - CORE FUNCTIONALITY**:
- The Wix form should feed the gabineteonline website form AUTOMATICALLY
- This is THE core functionality of the entire project
- Need to save:
  - **ALL required fields** (these will all be on Wix)
  - **ALL optional fields** with correct labels
  - This enables automatic submission from Wix → gabineteonline in background
- Success means:
  - Valid JSON schema file created (gabineteonline-schema.json)
  - Wix mapping document generated showing field-to-field connections
**A24**: Auto-close browser after success (clean exit)
**A25**: No additional requirements - ready to proceed with implementation

## Emerging Requirements

### Initial Context for Phase 2A
- Goal: Use Playwright to login and discover form fields
- Credentials encrypted in .env (ENCRYPTION_KEY, ENCRYPTION_IV, ENCRYPTED_CREDENTIALS)
- Target URL: https://www.gabineteonline1.com.br/flaviovalle/
- Cloudflare protection may block automation
- Need schema for: cadastro_clientes_dados.php form

### Core Functionality (CRITICAL)

**Purpose**: Discover ALL form fields from gabineteonline so Wix can automatically feed data to gabineteonline in the background.
- Wix form (user-facing) → Automatic submission → gabineteonline form (background)
- This is THE core functionality of the entire project
- Must capture:
  - **ALL required fields** (will all be present in Wix form)
  - **ALL optional fields with correct labels** (for complete mapping)
  - Field types, validation rules, constraints

### Technical Approach

**Browser Automation:**
- Use **playwright-extra with stealth plugin** (bypass Cloudflare/CAPTCHA for free)
- **Headful mode by default during development** (visible browser)
- CLI flags: `--headless`, `--headful` for runtime control
- 30 second timeout for page loads (Playwright default)
- Auto-close browser after successful completion

**Login Process:**
- Simple email/password form (sometimes CAPTCHA appears)
- Credentials are correct (verified manually within last day)
- **Issue**: Bot unable to log in (detection problem, not credential problem)
- **Credential property investigation needed**: May be stored as `username` not `email`
- Retry logic: 3 attempts with exponential backoff (5s, 10s, 20s)
- Verify login success: Wait for specific dashboard element

**Navigation to Form:**
- Explore after login (exact URL unknown)
- Search for links/buttons with keywords:
  - "Cadastro" or "Cadastrar" (register)
  - "Novo cliente" or "Novo usuário" (new client/user)
  - "Adicionar" or "+" (add button)
  - Explore all navigation links if keywords not found

**Form Field Extraction:**
- Expected field types:
  - Personal info (name, email/username, phone)
  - Address fields (street, city, state)
  - Dates (birth date, etc.)
- Extract for each field:
  - Field name/ID (for form submission)
  - Field type (text, email, select, date, etc.)
  - Required vs optional status
  - Labels (Portuguese text)
  - Validation rules (if present in HTML)

### Output Requirements

**Primary Output: JSON Schema**
- Save to: `form-discovery/output/gabineteonline-schema.json`
- Structure:
  ```json
  {
    "discoveredAt": "ISO timestamp",
    "url": "form URL",
    "fields": [
      {
        "name": "field_name",
        "type": "text|email|select|date|...",
        "label": "Campo Nome",
        "required": true|false,
        "validation": { /* if any */ }
      }
    ]
  }
  ```

**Secondary Output: Wix Mapping Document**
- Show how Wix fields will map to gabineteonline fields
- Enable automatic Wix → gabineteonline submission
- Format: Human-readable guide for implementation

**Console Summary Report:**
- Total fields discovered
- Required fields count
- Optional fields count
- Field type breakdown

### Logging & Debugging

**Logging Levels:**
- **Default: Full debug mode during development** (detailed logging)
- CLI flags to control verbosity: `--log-level=minimal|standard|verbose|debug`
- Configurable for production use

**Screenshots:**
- Capture at key milestones:
  - After successful login
  - On registration form page
  - After field extraction
  - On any error/failure

**Error Reporting:**
- Console error messages (detailed)
- Save error log: `form-discovery/output/error.log`
- Screenshot of failure state
- Exit with non-zero code for CI/CD

### Edge Cases & Error Handling

**CAPTCHA/Bot Detection:**
- Use stealth plugin as primary defense
- Additional techniques:
  - Random delays to mimic human behavior
  - User agent rotation if needed
  - Headful mode reduces detection
- **No paid CAPTCHA solving services** (must be free)

**Login Failures:**
- 3 retry attempts with exponential backoff
- Screenshot on each failure
- Log detailed error information
- Fail gracefully with clear error message

**Credential Issue:**
- **INVESTIGATE**: Property might be `username` not `email`
- First step: Decrypt and inspect actual property names
- Update decrypt-credentials.js or form-discovery script accordingly

**Missing Form:**
- If registration link not found, log all available links
- Try multiple navigation patterns
- Screenshot dashboard for manual inspection

### Dependencies

**New Packages to Install:**
- `playwright-extra`
- `puppeteer-extra-plugin-stealth`

**Existing Packages:**
- `playwright` (already installed)
- `dotenv` (already installed)
- `chalk` (already installed for colored output)

### One-Time Task

**Frequency:** One-time discovery
- Run once to extract schema
- Manually re-run if gabineteonline changes their form in the future
- Not scheduled/automated - manual trigger only

### Success Criteria

✅ Script successfully logs into gabineteonline (bypassing CAPTCHA/Cloudflare)
✅ Navigates to new user registration form
✅ Extracts ALL fields (required + optional) with correct labels
✅ Generates valid JSON schema file (`gabineteonline-schema.json`)
✅ Creates Wix mapping document showing field connections
✅ Console shows summary report
✅ Screenshots captured at key milestones
✅ Browser closes automatically on success

---

## Questions Count: 25 questions across 6 categories

✅ Core Requirements (6 questions)
✅ Integration Points (6 questions)
✅ Edge Cases (5 questions)
✅ Quality Attributes (3 questions)
✅ Existing Patterns (2 questions)
✅ Preferences (3 questions)

**Status**: Clarification complete - ready for implementation planning

---

