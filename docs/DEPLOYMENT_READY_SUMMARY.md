> [!WARNING]
> Superseded by `docs/PLAN_Participe_Deployment_V4.md` (2026-02-19) in the workspace root.
> This document contains older assumptions and is kept only for historical reference.

# Participe Page Enhancement â€” Ready for Manual Injection

**Date:** February 13, 2026
**Status:** âœ… CODE COMPLETE, READY FOR MANUAL DEPLOYMENT

## ðŸ“‹ What's Ready

### âœ… Code Files Prepared
- **`participe.js`** (419 lines) - Main page logic, no database calls
- **`public/validation-utils.js`** (243 lines) - Field validation rules
- **`public/location-utils.js`** - CEP auto-fill utilities
- **`public/text-utils.js`** - Name combination utilities

### âœ… Features Implemented
- **Name separation:** `apelido` (first) + `sobrenome` (last) â†’ auto-combines to `nome` (full)
- **Required fields:** `celular`, `email`, `cep`, `dataNascimento` (no asterisks on page)
- **Auto-fill:** CEP lookup populates address fields
- **Validation:** Portuguese error messages, required field enforcement
- **Progressive disclosure:** Optional fields hidden by default
- **WhatsApp redirect:** After successful validation

### âœ… No Database Dependencies
- Removed all `wix-data` imports
- Removed backend module imports
- Form submission validates and redirects to WhatsApp
- Phone lookup always shows new user flow (for now)

---

## ðŸš€ Deployment Process

### Step 1: Access Wix Editor
1. Go to https://flaviovalle.com
2. Click "Edit Site" (bottom-left)
3. Navigate to Pages â†’ Participe
4. Enable Dev Mode (top-right toggle)

### Step 2: Inject Code Files
```
Dev Mode â†’ Public & Backend â†’ public/
â”œâ”€â”€ validation-utils.js (paste content)
â”œâ”€â”€ location-utils.js (paste content)
â””â”€â”€ text-utils.js (paste content)

Dev Mode â†’ Page Code â†’ participe
â””â”€â”€ participe.js (paste content)
```

### Step 3: Update Form Structure
- Map existing elements to expected IDs
- Add missing fields (sobrenome, cep, dataNascimento)
- Update element IDs to match code expectations

### Step 4: Test & Publish
- Preview mode testing
- Publish when ready

---

## ðŸ“ Form Field Requirements

### Required Fields (Always Visible)
| ID | Label | Type | Notes |
|----|-------|------|-------|
| `#apelido` | Primeiro Nome | text | 1-30 chars |
| `#sobrenome` | Sobrenome | text | 1-200 chars |
| `#nome` | Nome Completo | text (read-only) | Auto-generated |
| `#celular` | Celular | tel | Phone format |
| `#email` | Email | email | Email format |
| `#cep` | CEP | text | CEP format (99999-999) |
| `#dataNascimento` | Data de Nascimento | date | DD/MM/YYYY |

### Optional Fields (Initially Hidden)
| ID | Label | Type |
|----|-------|------|
| `#cpf` | CPF | text |
| `#endereco` | EndereÃ§o | text |
| `#numero` | NÃºmero | text |
| `#bairro` | Bairro | select |

### UI Elements
| ID | Purpose |
|----|---------|
| `#submitButton` | Form submission |
| `#showMoreFields` | Toggle optional fields |
| `#optionalFieldsSection` | Optional fields container |

---

## ðŸ§ª Testing Checklist

- [ ] Form loads without JavaScript errors
- [ ] Name combination works (apelido + sobrenome â†’ nome)
- [ ] CEP auto-fill populates address fields
- [ ] Form validation prevents invalid submissions
- [ ] WhatsApp redirect works after validation
- [ ] Optional fields toggle properly
- [ ] Mobile responsive

---

## ðŸ“‹ Next Steps

1. **Manual Injection** - Follow the deployment process above
2. **Test Thoroughly** - Use preview mode before publishing
3. **Add Database Backend** - When ready, add Registros collection and backend sync
4. **WhatsApp Integration** - Change widget links to point to `/participe`
5. **Background Sync** - Implement automated sync to gabineteonline

---

## ðŸ”§ Code Snippets for Quick Reference

### Main Form Setup
```javascript
$w.onReady(async function () {
    await initializeAutoFill();
    setupFormInteractions();
    setupValidation();
    await checkReturningUser();
});
```

### Name Combination
```javascript
function updateNomeCompleto() {
    const apelido = $w('#apelido').value || '';
    const sobrenome = $w('#sobrenome').value || '';
    const nomeCompleto = combineNames(apelido, sobrenome);
    $w('#nome').value = nomeCompleto;
}
```

### Form Validation
```javascript
const validationErrors = validateFormData(formData);
if (validationErrors.length > 0) {
    showValidationErrors(validationErrors);
    return;
}
```

---

## âš ï¸ Important Notes

- **No Asterisks:** Page won't show asterisks - we used them only to identify required fields
- **No Database:** Code works without backend - just validates and redirects
- **CEP Auto-fill:** Requires ViaCEP API access (already implemented)
- **Mobile First:** Test on mobile devices before publishing
- **Rollback Ready:** Can easily revert by removing injected code

---

## ðŸ“ž Contact

**Ready for deployment!** The enhanced participe form is complete and ready for manual injection into the Wix editor.

