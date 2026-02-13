# Manual Wix Code Injection Plan — Enhanced Participe Page

**Date:** February 13, 2026
**Target:** `/participe` page on flaviovalle.com
**Method:** Manual code injection via Wix Editor
**Goal:** Deploy enhanced registration form with auto-fill and validation

## Status: READY FOR DEPLOYMENT

**Last Updated:** 2026-02-13
**Code Location:** `velo-code/` directory
**Deployment Method:** Manual Wix Editor injection

### ✅ Code Ready for Injection
- [x] `participe.js` (419 lines) - Main page logic, no asterisks
- [x] `public/validation-utils.js` (243 lines) - Field validation
- [x] `public/location-utils.js` - CEP auto-fill utilities
- [x] `public/text-utils.js` - Name combination utilities
- [x] Backend modules (for future database integration)

---

## 1. Prerequisites

### 1.1 Access Requirements
- [ ] Wix account access for flaviovalle.com
- [ ] Editor permissions (can modify pages and code)
- [ ] Backup of current `/participe` page (screenshot/documentation)

### 1.2 Current Page Analysis
- [ ] Document existing form element IDs
- [ ] Note current field structure
- [ ] Identify which elements need renaming/restructuring

---

## 2. Code Injection Process

### Phase 1: Access Wix Editor

1. **Open Live Site**
   - Navigate to https://flaviovalle.com
   - Click "Edit Site" (bottom-left corner)

2. **Navigate to Participe Page**
   - In editor, go to Pages → Participe
   - Ensure Dev Mode is enabled (top-right toggle)

### Phase 2: Add Code Files

3. **Create Public Files**
   ```
   Dev Mode → Public & Backend → public/
   ├── validation-utils.js (copy from velo-code/public/validation-utils.js)
   ├── location-utils.js (copy from velo-code/public/location-utils.js)
   └── text-utils.js (copy from velo-code/public/text-utils.js)
   ```

4. **Create Backend Files** (for future database integration)
   ```
   Dev Mode → Public & Backend → backend/
   ├── participatedb.jsw (copy from velo-code/backend/participatedb.jsw)
   └── sync-worker.jsw (copy from velo-code/backend/sync-worker.jsw)
   ```

5. **Add Page Code**
   ```
   Dev Mode → Page Code
   ├── Select "participe" page
   └── Paste participe.js content (419 lines)
   ```

### Phase 3: Update Form Structure

6. **Map Existing Elements to Code**
   - Current form elements → Update IDs to match code expectations
   - Required field mapping:
     ```
     Existing Element → New ID
     nome field → #apelido (first name)
     (add new) → #sobrenome (surname)
     phone field → #celular
     email field → #email
     (add new) → #cep
     (add new) → #dataNascimento
     ```

7. **Add Missing Form Elements**
   - Add surname field (#sobrenome)
   - Add CEP field (#cep)
   - Add birth date field (#dataNascimento)
   - Add optional fields section (#optionalFieldsSection)
   - Add toggle button (#showMoreFields)

8. **Update Element IDs**
   - Rename existing elements to match code expectations
   - Update button IDs (#submitButton, #whatsappButton)
   - Add error message containers for validation

### Phase 4: Test in Preview

9. **Preview Mode Testing**
   - Click "Preview" in editor
   - Test form functionality:
     - Name combination (apelido + sobrenome → nome)
     - Phone lookup for returning users
     - CEP auto-fill
     - Form validation
     - WhatsApp redirect

10. **Fix Issues**
    - Debug console for JavaScript errors
    - Test on different devices/browsers
    - Verify form submission flow

### Phase 5: Publish

11. **Publish to Live**
    - Click "Publish" in editor
    - Verify live site functionality
    - Monitor for errors

---

## 3. Form Element Requirements

### Required Fields (Always Visible)
| Field ID | Label | Type | Validation |
|----------|-------|------|------------|
| `#apelido` | Primeiro Nome | text | Required, 1-30 chars |
| `#sobrenome` | Sobrenome | text | Required, 1-200 chars |
| `#nome` | Nome Completo | text (read-only) | Auto-generated |
| `#celular` | Celular | tel | Required, phone format |
| `#email` | Email | email | Required, email format |
| `#cep` | CEP | text | Required, CEP format |
| `#dataNascimento` | Data de Nascimento | date | Required, DD/MM/YYYY |

### Optional Fields (Initially Hidden)
| Field ID | Label | Type |
|----------|-------|------|
| `#cpf` | CPF | text |
| `#sexo` | Sexo | select |
| `#telefone` | Telefone Fixo | tel |
| `#endereco` | Endereço | text |
| `#numero` | Número | text |
| `#complemento` | Complemento | text |
| `#bairro` | Bairro | select |
| `#cidade` | Cidade | text |
| `#uf` | Estado | select |
| `#observacao` | Observações | textarea |

### UI Elements
| Element ID | Purpose |
|------------|---------|
| `#submitButton` | Form submission |
| `#whatsappButton` | WhatsApp redirect |
| `#showMoreFields` | Toggle optional fields |
| `#optionalFieldsSection` | Container for optional fields |
| `#welcomeBackSection` | Returning user welcome |
| `#registrationForm` | Main form container |

---

## 4. Code Dependencies

### Files to Inject
```
velo-code/
├── participe.js (main page code)
├── public/
│   ├── validation-utils.js (validation rules)
│   ├── location-utils.js (CEP auto-fill)
│   └── text-utils.js (name utilities)
└── backend/
    ├── participatedb.jsw (database operations)
    └── sync-worker.jsw (sync logic)
```

### Import Structure
```javascript
// participe.js imports
import { validateField, validationRules } from 'public/validation-utils.js';
import { getCurrentUserLocation, lookupAddressFromCEP } from 'public/location-utils.js';
import { combineNames } from 'public/text-utils.js';
import { lookupUserByPhone, saveRegistration } from 'backend/participedb.jsw';
```

---

## 5. Testing Checklist

### Pre-Publish Tests
- [ ] Form loads without errors
- [ ] Name combination works (apelido + sobrenome → nome)
- [ ] Phone lookup detects returning users
- [ ] CEP auto-fill populates address fields
- [ ] Form validation shows appropriate error messages
- [ ] Required fields prevent submission when empty
- [ ] Optional fields toggle visibility
- [ ] WhatsApp redirect works
- [ ] No console errors

### Post-Publish Verification
- [ ] Live site loads participe page
- [ ] Form functions on live site
- [ ] No broken functionality
- [ ] Mobile responsive
- [ ] Cross-browser compatibility

---

## 6. Rollback Plan

### If Issues Occur
1. **Immediate Rollback**
   - Use Wix's version history to revert
   - Or manually remove injected code

2. **Partial Rollback Options**
   - Keep form enhancements, remove auto-fill
   - Keep validation, remove new fields
   - Keep basic functionality, remove complex features

3. **Backup Current State**
   - Screenshot current page
   - Document current element IDs
   - Save current code (if any)

---

## 7. Success Metrics

### Functional Metrics
- [ ] Form submission completes without errors
- [ ] Auto-fill features work as expected
- [ ] Validation prevents invalid submissions
- [ ] User experience is smooth

### Technical Metrics
- [ ] No JavaScript console errors
- [ ] Page loads within 3 seconds
- [ ] Form works on mobile devices
- [ ] Code follows Wix Velo best practices

---

## 8. Next Steps After Deployment

### Immediate (This Session)
- [ ] Deploy enhanced participe form
- [ ] Test all functionality
- [ ] Verify no regressions

### Future Enhancements
- [ ] Add database backend (Registros collection)
- [ ] Implement background sync to gabineteonline
- [ ] Add WhatsApp widget interception
- [ ] Enhance mobile experience
- [ ] Add analytics tracking

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Form breaks existing functionality | Medium | High | Test thoroughly in preview, have rollback plan |
| Code injection fails | Low | Medium | Follow step-by-step process, validate each step |
| Mobile compatibility issues | Medium | Medium | Test on multiple devices, use responsive design |
| User confusion with new fields | Low | Low | Clear labels, progressive disclosure |
| Performance impact | Low | Low | Code is lightweight, no heavy operations |

---

## 10. Timeline

### Phase 1: Preparation (15 min)
- Access Wix editor
- Document current form structure
- Prepare code files for injection

### Phase 2: Code Injection (30 min)
- Add public files
- Add backend files
- Inject page code

### Phase 3: Form Updates (45 min)
- Update element IDs
- Add missing fields
- Configure form structure

### Phase 4: Testing (30 min)
- Preview mode testing
- Bug fixes
- Final validation

### Phase 5: Deployment (15 min)
- Publish to live
- Post-deploy verification

**Total Time:** ~2.5 hours
**Risk Level:** Medium (manual process, but well-documented)

---

## 11. Contact Information

**Developer:** Claude Opus 4.6
**Date:** February 13, 2026
**Project:** Enhanced Participe Page Deployment

---

## 12. Approval Checklist

- [ ] Code files prepared for injection
- [ ] Form element mapping documented
- [ ] Testing checklist reviewed
- [ ] Rollback plan in place
- [ ] Timeline approved
- [ ] Ready for deployment

---

## 13. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-13 | Created manual injection plan, removed asterisk functionality | Claude Opus 4.6 |
| 2026-02-13 | Added comprehensive testing and rollback procedures | Claude Opus 4.6 |