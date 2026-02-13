# Enhanced Participe Page Implementation Plan

**Date:** February 13, 2026
**Target:** `/participe` page on flaviovalle.com
**Method:** Manual code injection via Wix Developer Mode
**Focus:** Form enhancement with auto-fill and validation (no database backend yet)

## 📋 Current State Analysis

### Existing Participe Page Structure (from discovery)
**Form 1 — Main Registration Form (`comp-m4wplov41`):**
| # | Current Field | Type | Required | Current ID | Notes |
|---|---------------|------|----------|------------|-------|
| 1 | `nome` | text | ✅ | `nome` | Currently "Nome Completo" |
| 2 | `sobrenome` | text | ✅ | `sobrenome` | Last name (already exists!) |
| 3 | `email` | email | ✅ | `email` | Email address |
| 4 | `phone` | tel | ✅ | `phone` | Maps to `celular` |
| 5 | (checkbox) | checkbox | ❓ | `checkbox` | Purpose TBD |
| 6 | `collection_comp-m6z7d0i3` | select | ✅ | `collection_comp-m6z7d0i3` | Bairro dropdown |
| 7 | `textarea_comp-m4wplove4` | textarea | ❓ | `textarea_comp-m4wplove4` | Maps to `observacao` |

**Key Discovery:** The page already has `nome` and `sobrenome` fields! We need to:
- Rename `nome` to `apelido` (first name)
- Keep `sobrenome` as surname
- Add a read-only `nome` field for full name
- Add `cep` and `dataNascimento` fields
- Update IDs to match our code

---

## 🎯 Implementation Plan

### Phase 1: Code Preparation ✅ COMPLETE

#### ✅ Files Ready for Injection
```
velo-code/
├── participe.js (419 lines) - Main page logic
├── public/
│   ├── validation-utils.js (243 lines) - Validation rules
│   ├── location-utils.js - CEP auto-fill
│   └── text-utils.js - Name utilities
```

#### ✅ Features Implemented
- [x] Name separation: `apelido` + `sobrenome` → `nome` (full name)
- [x] Required fields: `celular`, `email`, `cep`, `dataNascimento`
- [x] CEP auto-fill for address fields
- [x] Form validation with Portuguese messages
- [x] Progressive disclosure (optional fields)
- [x] WhatsApp redirect after validation

---

### Phase 2: Wix Developer Mode Injection

#### Step 2.1: Access Developer Mode
1. **Open Live Site**
   - Navigate to https://flaviovalle.com
   - Click "Edit Site" (bottom-left corner)

2. **Enable Developer Mode**
   - In editor, click "Dev Mode" toggle (top-right)
   - This enables Velo code editing

3. **Navigate to Participe Page**
   - Go to Pages panel → Select "participe"

#### Step 2.2: Inject Public Utility Files
```
Dev Mode Panel → Public & Backend → public/
```

**File 1: validation-utils.js**
- Click "+" → Create new file → "validation-utils.js"
- Copy entire content from `velo-code/public/validation-utils.js`
- Save

**File 2: location-utils.js**
- Click "+" → Create new file → "location-utils.js"
- Copy entire content from `velo-code/public/location-utils.js`
- Save

**File 3: text-utils.js**
- Click "+" → Create new file → "text-utils.js"
- Copy entire content from `velo-code/public/text-utils.js`
- Save

#### Step 2.3: Inject Page Code
```
Dev Mode Panel → Page Code → participe
```

- Select "participe" from page dropdown
- Paste entire content from `velo-code/participe.js`
- Save

---

### Phase 3: Form Structure Updates

#### Step 3.1: Element ID Mapping
**Current → Required Changes:**

| Current Element | Current ID | New ID | Action |
|----------------|------------|--------|--------|
| "Nome Completo" field | `nome` | `apelido` | Rename to "Primeiro Nome" |
| "Sobrenome" field | `sobrenome` | `sobrenome` | Keep as-is |
| Email field | `email` | `email` | Keep as-is |
| Phone field | `phone` | `celular` | Rename ID only |
| Bairro dropdown | `collection_comp-m6z7d0i3` | `bairro` | Rename ID |
| Textarea | `textarea_comp-m4wplove4` | `observacao` | Rename ID |

#### Step 3.2: Add Missing Elements
**New Fields to Add:**

1. **Full Name Display Field**
   - Add text input (read-only)
   - Label: "Nome Completo"
   - ID: `nome`
   - Position: After surname field

2. **CEP Field**
   - Add text input
   - Label: "CEP"
   - ID: `cep`
   - Position: After email

3. **Birth Date Field**
   - Add date input
   - Label: "Data de Nascimento"
   - ID: `dataNascimento`
   - Position: After CEP

4. **Optional Fields Section**
   - Add container div
   - ID: `optionalFieldsSection`
   - Initially hidden
   - Include: CPF, address fields, etc.

5. **Toggle Button**
   - Add button
   - Label: "Mostrar mais campos ▼"
   - ID: `showMoreFields`

#### Step 3.3: Update Button IDs
- Main submit button → ID: `submitButton`
- WhatsApp button → ID: `whatsappButton`

---

### Phase 4: Code Integration

#### Step 4.1: Import Statements
The participe.js file already includes correct imports:
```javascript
import wixLocation from 'wix-location';
import { validateField, validationRules } from 'public/validation-utils.js';
import { getCurrentUserLocation, lookupAddressFromCEP } from 'public/location-utils.js';
import { combineNames } from 'public/text-utils.js';
```

#### Step 4.2: Event Handlers
Code expects these element IDs to exist:
- `#apelido` - First name input
- `#sobrenome` - Surname input (already exists)
- `#nome` - Full name display (read-only)
- `#celular` - Phone input
- `#email` - Email input (already exists)
- `#cep` - CEP input (to add)
- `#dataNascimento` - Birth date input (to add)
- `#submitButton` - Submit button
- `#showMoreFields` - Toggle button (to add)
- `#optionalFieldsSection` - Optional fields container (to add)

---

### Phase 5: Testing & Validation

#### Step 5.1: Preview Mode Testing
1. **Click "Preview" in Wix Editor**
2. **Test Core Functionality:**
   - [ ] Page loads without console errors
   - [ ] Name combination works (apelido + sobrenome → nome)
   - [ ] Form validation shows Portuguese messages
   - [ ] CEP auto-fill populates address fields
   - [ ] Optional fields toggle visibility
   - [ ] WhatsApp redirect works after validation

3. **Test Edge Cases:**
   - [ ] Empty required fields show validation errors
   - [ ] Invalid email/phone formats rejected
   - [ ] CEP lookup handles invalid CEPs gracefully
   - [ ] Mobile responsive design

#### Step 5.2: Debug Console
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Verify network requests for CEP API calls

---

### Phase 6: Production Deployment

#### Step 6.1: Final Verification
- [ ] All tests pass in preview mode
- [ ] No console errors
- [ ] Mobile compatibility confirmed
- [ ] Form submission flow works end-to-end

#### Step 6.2: Publish to Live
1. **Click "Publish" in Wix Editor**
2. **Verify Live Site:**
   - [ ] participe page loads correctly
   - [ ] Form functions on live site
   - [ ] No broken functionality
   - [ ] WhatsApp redirect works

#### Step 6.3: Post-Deploy Monitoring
- [ ] Check site analytics for form engagement
- [ ] Monitor for JavaScript errors
- [ ] Test on different browsers/devices

---

## 📋 Detailed Field Mapping

### Required Fields (Always Visible)
| Field ID | Label | Type | Validation | Current Status |
|----------|-------|------|------------|----------------|
| `#apelido` | Primeiro Nome | text | Required, 1-30 chars | Rename from `#nome` |
| `#sobrenome` | Sobrenome | text | Required, 1-200 chars | ✅ Already exists |
| `#nome` | Nome Completo | text (read-only) | Auto-generated | ➕ Add new field |
| `#celular` | Celular | tel | Required, phone format | Rename from `#phone` |
| `#email` | Email | email | Required, email format | ✅ Already exists |
| `#cep` | CEP | text | Required, CEP format | ➕ Add new field |
| `#dataNascimento` | Data de Nascimento | date | Required, DD/MM/YYYY | ➕ Add new field |

### Optional Fields (Initially Hidden)
| Field ID | Label | Type | Current Status |
|----------|-------|------|----------------|
| `#cpf` | CPF | text | ➕ Add to optional section |
| `#endereco` | Endereço | text | ➕ Add to optional section |
| `#numero` | Número | text | ➕ Add to optional section |
| `#complemento` | Complemento | text | ➕ Add to optional section |
| `#bairro` | Bairro | select | Rename from `#collection_comp-m6z7d0i3` |
| `#cidade` | Cidade | text | ➕ Add to optional section |
| `#uf` | Estado | select | ➕ Add to optional section |
| `#observacao` | Observações | textarea | Rename from `#textarea_comp-m4wplove4` |

---

## 🔧 Code Injection Checklist

### Pre-Injection
- [x] All code files prepared
- [x] Import statements verified
- [x] Element IDs documented
- [x] Testing checklist ready

### During Injection
- [ ] Access Wix Developer Mode
- [ ] Create public utility files (3 files)
- [ ] Inject page code (participe.js)
- [ ] Update form element IDs
- [ ] Add missing form fields
- [ ] Add UI control elements

### Post-Injection
- [ ] Test in preview mode
- [ ] Debug any console errors
- [ ] Verify all functionality
- [ ] Publish to live site

---

## ⚠️ Risk Mitigation

### Rollback Plan
1. **Immediate Rollback:** Remove injected code files
2. **Partial Rollback:** Keep validation, remove auto-fill features
3. **Version Control:** Wix has built-in version history

### Common Issues & Solutions
| Issue | Symptom | Solution |
|-------|---------|----------|
| Code not loading | Console errors | Check file paths in imports |
| Elements not found | `$w('#id')` errors | Verify element IDs match code |
| CEP API fails | No address auto-fill | Check network tab, verify API access |
| Validation not working | Form submits with errors | Check validation-utils.js loaded |

---

## 📊 Success Metrics

### Functional Success
- [ ] Form loads without errors
- [ ] Name combination works correctly
- [ ] CEP auto-fill populates address fields
- [ ] Form validation prevents invalid submissions
- [ ] WhatsApp redirect functions properly

### Technical Success
- [ ] No JavaScript console errors
- [ ] Page performance not degraded
- [ ] Mobile compatibility maintained
- [ ] Code follows Wix Velo best practices

---

## 🎯 Next Steps

1. **Execute Phase 2:** Access Wix Developer Mode and inject code files
2. **Execute Phase 3:** Update form structure and element IDs
3. **Execute Phase 4:** Test thoroughly in preview mode
4. **Execute Phase 5:** Deploy to live site
5. **Future:** Add database backend and sync to gabineteonline

---

## 📞 Support

**Implementation Guide:** This plan provides step-by-step instructions for manual code injection.

**Code Location:** All files ready in `velo-code/` directory

**Testing:** Comprehensive testing checklist included

**Rollback:** Easy rollback procedures documented

---

## 📋 Change Log

| Date | Change | Status |
|------|--------|--------|
| 2026-02-13 | Created detailed implementation plan based on discovery | ✅ Ready for execution |
| 2026-02-13 | Documented existing form structure and required changes | ✅ Complete |
| 2026-02-13 | Added step-by-step injection process | ✅ Complete |