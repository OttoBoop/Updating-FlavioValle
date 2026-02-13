# Wix "Duplicate Site" Fix Guide

**Date**: February 12, 2026 (updated)
**Site**: flaviovalle.com (metaSiteId: `3d861f70-c919-4aa5-8420-e7643606ce2b`)
**Problem**: "Duplicar site", "Transferir site", and "Mover para Lixeira" are ALL greyed out
**Status**: Site IS in a Wix Studio workspace, user IS owner — still greyed out

---

## Root Cause Analysis

### What We Confirmed
- ✅ Site is inside a Wix Studio workspace ("Flávio Valle")
- ✅ User is the Owner (not collaborator)
- ✅ Site appears at `manage.wix.com/studio/sites`
- ❌ "Duplicar site" is greyed out
- ❌ "Transferir site" is greyed out
- ❌ "Mover para Lixeira" is greyed out
- ❌ Classic dashboard (`manage.wix.com/account/sites`) also doesn't work

### Most Likely Cause: Classic Editor Site in Studio Workspace

From Wix's own docs:
> "Actions for Studio Editor sites, like duplicating a site, are managed through Studio workspaces."

Key word: **Studio Editor sites**. The site `flaviovalle.com` was built with the **classic Wix Editor**, not the Studio Editor. Studio workspaces can *display* classic editor sites but **cannot perform Studio-specific actions** on them (duplicate, transfer, trash). This explains why ALL three actions are greyed out simultaneously — they're Studio-only operations that don't apply to classic editor sites.

### Other Possible Contributing Factors
- **Premium plan tied to domain**: The site has a Premium plan with a connected domain. Some actions are restricted while premium plans are active.
- **Apps/integrations**: Sites with certain apps (Wix Stores, Wix Bookings, etc.) may have duplication restrictions.
- **Editor version lock**: Classic Editor sites cannot be "converted" to Studio Editor sites; they remain in their original format.

---

## Solution Options (Ordered by Effort)

### Option A: Duplicate from Classic Wix Dashboard (Quick Try)

The old dashboard may handle classic editor sites differently:

1. Go to: **https://manage.wix.com/account/sites**
2. Find `flaviovalle.com`
3. Click the **three-dot menu** (⋮)
4. Look for **"Duplicate"** or **"Copy Site"**

**Status**: User reported this doesn't work either. The button may also be disabled here if it's a platform-level restriction.

---

### Option B: Duplicate from Inside the Wix Editor

Instead of the dashboard, try duplicating from within the editor itself:

1. Open the site in the Wix Editor: https://editor.wix.com/html/editor/web/renderer/edit/3d861f70-c919-4aa5-8420-e7643606ce2b
2. In the editor, go to **Site** menu (top-left toolbar)
3. Look for **"Duplicate Site"** or **"Save As New Site"**
4. If found and enabled, use this to create `flaviovalle-dev`

> The editor-level "Duplicate" may work because it's a classic editor feature, not a Studio workspace feature.

---

### Option C: Use the Wix REST API (Programmatic Duplication)

Wix has a **Duplicate Site API** at the account level that can bypass the UI:

**API Endpoint**: `POST https://www.wixapis.com/site-management/v1/sites/{site_id}/duplicate`

**Reference**: https://dev.wix.com/docs/api-reference/account-level/sites/site-actions/duplicate-site

**Steps**:
1. **Get an API Key**:
   - Go to: https://manage.wix.com/account/api-keys
   - Create an "Account Level API Key"
   - Grant it the `Manage Sites` permission scope
   
2. **Make the API call**:
   ```bash
   curl -X POST "https://www.wixapis.com/site-management/v1/sites/3d861f70-c919-4aa5-8420-e7643606ce2b/duplicate" \
     -H "Authorization: <API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"newSiteName": "flaviovalle-dev"}'
   ```

3. **Or use Python**:
   ```python
   import requests

   API_KEY = "your-api-key-here"
   SITE_ID = "3d861f70-c919-4aa5-8420-e7643606ce2b"

   response = requests.post(
       f"https://www.wixapis.com/site-management/v1/sites/{SITE_ID}/duplicate",
       headers={
           "Authorization": API_KEY,
           "Content-Type": "application/json"
       },
       json={"newSiteName": "flaviovalle-dev"}
   )
   print(response.status_code, response.json())
   ```

**Notes from Wix API docs**:
- Requires an **account level API key** (not site-level)
- Premium plan apps will be copied but appear **unactivated** until the new site is upgraded
- The API may succeed even when the UI button is greyed out

---

### Option D: Use the Scraper to Inspect & Force-Click

We have existing scraper scripts that can programmatically investigate the button:

1. **Inspect why it's disabled**:
   ```bash
   python general_scraper/_check_duplicate_btn.py <ipc_dir>
   ```
   This checks: `aria-disabled`, parent classes, tooltips, data-hook attributes

2. **Attempt force-click via dispatch_event**:
   ```bash
   python general_scraper/_force_duplicate.py <ipc_dir>
   ```
   This bypasses CSS-only disabling (won't work if server-side enforced)

3. **Navigate to classic dashboard and try there**:
   Create a new script that navigates to `manage.wix.com/account/sites` (classic) and attempts duplication from there.

---

### Option E: Create Blank Site + Manual Rebuild (Last Resort)

If duplication is truly blocked at the platform level:

1. **Create a new blank site** called `flaviovalle-dev` in the Wix Editor (classic, not Studio)
2. **Enable Dev Mode** on the new site
3. **Use the scraper** to extract all content, styles, and structure from `flaviovalle.com`
4. **Manually recreate** the pages using the extracted content
5. **Connect to GitHub** via Wix CLI for version control

This approach was already identified in a previous plan as the fallback:
> "Pivoting from automated site duplication to manual site creation + Wix CLI setup."

---

## Recommended Action Sequence

```
1. Try Option B (Editor-level duplicate) — 5 minutes
2. Try Option C (API duplication)         — 15 minutes
3. Try Option D (Scraper investigation)   — 10 minutes
4. Fall back to Option E (Manual rebuild) — 1-2 hours
```

---

## Key URLs

| Purpose | URL |
|---------|-----|
| Studio workspace sites | https://manage.wix.com/studio/sites |
| Classic dashboard sites | https://manage.wix.com/account/sites |
| Site dashboard | https://manage.wix.com/dashboard/3d861f70-c919-4aa5-8420-e7643606ce2b |
| Wix Editor (direct) | https://editor.wix.com/html/editor/web/renderer/edit/3d861f70-c919-4aa5-8420-e7643606ce2b |
| API Keys management | https://manage.wix.com/account/api-keys |
| Duplicate Site API docs | https://dev.wix.com/docs/api-reference/account-level/sites/site-actions/duplicate-site |

---

## After Successful Duplication

Once `flaviovalle-dev` exists:
1. Open it in the Editor
2. **Enable Dev Mode**: Top menu → Dev Mode → Turn on Dev Mode
3. Verify content matches the original
4. Continue **Phase 2B** of the registration system plan
5. Create the `Registros` database collection
6. Build registration form, phone lookup, and welcome back pages

Full plan: `Updating-FlavioValle/.claude/plans/wix-registration-system.md`
