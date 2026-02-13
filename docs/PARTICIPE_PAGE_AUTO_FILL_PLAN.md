# `/participe` Page Enhancement Plan — Auto-Fill Strategy

**Date:** February 13, 2026
**Page:** `/participe` on flaviovalle.com
**Goal:** Smart auto-fill of required fields while maintaining user control

## Status: ✅ IMPLEMENTED (Asterisks Added)

**Last Updated:** 2026-02-13
**Code Location:** `velo-code/participe.js` + `velo-code/public/validation-utils.js`
**Deployment Status:** Ready for Wix deployment and testing

### ✅ Completed Features
- [x] Name field separation (first name + surname → full name)
- [x] CEP-based address auto-fill (ViaCEP integration)
- [x] Required field asterisks (*) display - matches gabineteonline style
- [x] Portuguese validation messages
- [x] Form validation rules
- [x] Field mapping to gabineteonline schema

---

## 1. Auto-Fill Strategy Overview

### 1.1 Philosophy
- **Required fields get smart defaults** but remain user-editable
- **Auto-fill reduces friction** without removing user agency
- **Progressive disclosure** — show basic form first, expand on demand
- **Context-aware defaults** based on device/browser/location data

### 1.2 Auto-Fill Categories

| Category | Fields | Strategy | Rationale |
|----------|--------|----------|-----------|
| **Name Fields** | `apelido`, `sobrenome` → `nome` | First name + surname → full name | Reduces redundant typing |
| **Address Fields** | `cep` → auto-populate address | CEP lookup service | Users share full address willingly |
| **Contact Fields** | `celular`, `email` | User input only (no auto-fill) | Allow international numbers/emails |

---

## 2. Field-by-Field Auto-Fill Plan

### 2.1 Required Fields (Always Visible)

#### `apelido` — "Primeiro Nome"
- **Auto-fill:** None (user enters first name)
- **UX:** Input field, placeholder "Digite seu primeiro nome"
- **Validation:** Required, 1-30 chars, letters only
- **Notes:** Maps to gabineteonline `Apelido` (optional field)

#### `sobrenome` — "Sobrenome"
- **Auto-fill:** None (user enters surname)
- **UX:** Input field, placeholder "Digite seu sobrenome"
- **Validation:** Required, 1-200 chars, letters + spaces only
- **Notes:** New field for surname separation

#### `nome` — "Nome Completo *"
- **Auto-fill:** `apelido` + `sobrenome` (joined with space)
- **Logic:** When both fields change → combine into full name
- **UX:** Read-only display, updates automatically
- **Validation:** Auto-generated, no manual validation needed
- **Notes:** Maps to gabineteonline `Nome*` (required field)

#### `celular` — "Celular *"
- **Auto-fill:** None (allow international numbers)
- **UX:** Free-form input, placeholder "Digite seu número de celular"
- **Validation:** Required, any phone format accepted
- **Notes:** Primary lookup key for returning users

#### `email` — "Email *"
- **Auto-fill:** Browser autofill (passive)
- **UX:** Standard email input, browser suggestions enabled
- **Validation:** Required, valid email format
- **Notes:** Used for notifications (future feature)

### 2.2 Optional Fields (Hidden by Default)

#### Auto-Fill Candidates
| Field | Auto-Fill Strategy | Trigger |
|-------|-------------------|---------|
| `cep` | User input only | Manual entry |
| `endereco` | CEP lookup service | After CEP entered |
| `numero` | User input | Manual entry |
| `complemento` | User input | Manual entry |
| `id_bairro` | CEP lookup service | After CEP entered |
| `id_cidade` | CEP lookup service | After CEP entered |
| `uf` | CEP lookup service | After CEP entered |

#### Non-Auto-Fill Fields
- `cpf`, `titulo`, `sessao` — Privacy-sensitive, manual entry only
- `dataNascimento` — Privacy-sensitive, manual entry only
- `telefone` — Redundant with celular, manual entry only
- `observacao` — Free-form, no auto-fill possible

---

## 3. User Experience Flow

### 3.1 Page Load (New User)
```
1. Page loads → Show name fields: apelido, sobrenome, nome (auto-generated)
2. Show contact fields: celular (free-form), email
3. "Mostrar mais campos" button for address fields
4. All required fields have clear placeholders
```

### 3.2 Name Field Logic (Real-time)
```
User types in apelido/sobrenome:
├── apelido changes → Update nome: "[apelido] [sobrenome]"
├── sobrenome changes → Update nome: "[apelido] [sobrenome]"
├── Both filled → nome shows complete full name
```

### 3.3 Phone Number Entry (Returning User Check)
```
User types celular → onBlur event:
├── Any format accepted (Brazilian or international)
├── Clean number → Query Registros DB
├── Found existing record?
│   ├── YES → Show "Bem-vindo de volta, [apelido]!"
│   │   ├── Display existing data (read-only)
│   │   ├── "Atualizar dados" button → Expand to edit mode
│   │   └── Direct WhatsApp link
│   └── NO → Continue with registration form
```

### 3.4 CEP-Based Address Auto-Fill
```
User enters CEP → onBlur event:
├── Valid CEP format? → Call CEP lookup API
├── API returns data?
│   ├── YES → Auto-populate: endereco, numero, complemento, id_bairro, id_cidade, uf
│   │   ├── Show populated fields for user review
│   │   ├── User can edit any field if needed
│   └── NO → Show manual address fields
```

### 3.5 Progressive Disclosure
```
Basic Form (always visible):
┌─ Primeiro Nome ─┬─ Sobrenome ─┬─ Nome Completo ─┐
│ [João]         │ [Silva]     │ [João Silva]    │ ← Auto-generated
└────────────────┴─────────────┴─────────────────┘
┌─ Celular ──────────────┬─ Email ──────────────┐
│ [+55 21 99999-9999]    │ [joao@email.com]     │
└────────────────────────┴──────────────────────┘
┌─ [Mostrar endereço ▼] ─┐
└─────────────────────────┘

Expanded Form (address fields):
┌─ CEP ──────┬─ Endereço ──────────────────────┐
│ [12345-123]│ [Rua das Flores, 123]          │ ← Auto-filled from CEP
├────────────┼─────────────────────────────────┤
│ Número     │ Complemento                     │
│ [123]      │ [Apto 45, bloco B]             │
├────────────┼─────────────────────────────────┤
│ Bairro     │ Cidade     │ UF                 │
│ [Centro]   │ [Rio]      │ [RJ]               │ ← Auto-filled from CEP
└────────────┴────────────┴────────────────────┘
```

---

## 4. Technical Implementation Plan

### 4.1 Velo Code Structure

#### Page Code (`/participe` page code)
```javascript
// participe.js
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getCurrentUserLocation, lookupAddressFromCEP, formatCEP } from 'public/location-utils.js';
import { lookupUserByPhone, saveRegistration } from 'backend/participedb.jsw';
import { validateField, validationRules } from 'public/validation-utils.js';
import { combineNames } from 'public/text-utils.js';

$w.onReady(async function () {
    console.log('Participe page loaded');

    // Initialize auto-fill features
    await initializeAutoFill();

    // Setup form interactions
    setupFormInteractions();

    // Setup validation
    setupValidation();

    // Check for returning user (if phone provided in URL params)
    await checkReturningUser();
});

async function initializeAutoFill() {
    try {
        // Get user location for context (but don't auto-fill)
        const location = await getCurrentUserLocation();
        console.log('User location:', location);

        // No auto-fill for area codes - allow international numbers
        // Location data is available for future use if needed

    } catch (error) {
        console.error('Auto-fill initialization failed:', error);
        // Continue without auto-fill - don't break the form
    }
}

function setupFormInteractions() {
    // Phone lookup on blur
    $w('#celular').onBlur(async (event) => {
        const phone = event.target.value;
        if (phone && phone.trim()) {
            await handlePhoneLookup(phone);
        }
    });
        const phone = event.target.value;
        if (isValidPhone(phone)) {
            const existingUser = await lookupUserByPhone(phone);
            if (existingUser) {
                showReturningUserFlow(existingUser);
            } else {
                showNewUserFlow();
            }
        }
    });
}
```

#### Asterisk Display Function
```javascript
// Add asterisks (*) to required field labels - matches gabineteonline style
function addAsterisksToRequiredFields() {
    // Required fields that match gabineteonline (Nome*, Celular*, E-mail*)
    const requiredFields = ['nome', 'celular', 'email'];
    
    requiredFields.forEach(fieldId => {
        const labelElement = $w(`#${fieldId}Label`);
        if (labelElement) {
            const currentLabel = labelElement.text;
            // Add asterisk if not already present
            if (!currentLabel.includes('*')) {
                labelElement.text = currentLabel + ' *';
            }
        }
    });
}
```

#### Location Utilities (`public/location-utils.js`)
```javascript
export async function getCurrentUserLocation() {
    try {
        // IP geolocation service
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        return {
            state: data.region_code, // e.g., "RJ", "SP"
            city: data.city,
            country: data.country_code
        };
    } catch (error) {
        console.log('Geolocation failed, using defaults');
        return { state: null, city: null, country: 'BR' };
    }
}

export function getAreaCodeForState(state) {
    const areaCodes = {
        'SP': '11', 'RJ': '21', 'MG': '31', 'RS': '51',
        'PR': '41', 'SC': '48', 'DF': '61', 'GO': '62',
        // ... more mappings
    };
    return areaCodes[state] || '11'; // Default to SP
}
```

#### Database Operations (`backend/participedb.jsw`)
```javascript
import wixData from 'wix-data';

export async function lookupUserByPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    const results = await wixData.query('Registros')
        .eq('celular', cleanPhone)
        .find();
    
    return results.items[0] || null;
}

export async function saveRegistration(data) {
    const toSave = {
        ...data,
        syncStatus: 'pending',
        syncAttempts: 0,
        _createdDate: new Date()
    };
    
    const result = await wixData.insert('Registros', toSave);
    return result;
}
```

### 4.2 Auto-Fill Implementation Details

#### Smart Apelido Derivation
```javascript
function deriveApelidoFromNomeCompleto(nomeCompleto) {
    if (!nomeCompleto) return '';
    
    // Extract first name (before first space)
    const firstName = nomeCompleto.trim().split(' ')[0];
    
    // Capitalize first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

// Usage in form
$w('#nomeCompleto').onInput((event) => {
    const nome = event.target.value;
    const suggestedApelido = deriveApelidoFromNomeCompleto(nome);
    
    if (!$w('#apelido').value) { // Only if user hasn't typed
        $w('#apelido').value = suggestedApelido;
        $w('#apelido').placeholder = `Sugestão: ${suggestedApelido}`;
    }
});
```

#### Location-Based Bairro Suggestions
```javascript
async function setupBairroSuggestions(location) {
    const bairros = await getBairrosForLocation(location);
    
    $w('#bairro').options = bairros.map(bairro => ({
        label: bairro.name,
        value: bairro.id
    }));
}

async function getBairrosForLocation(location) {
    // This would be a pre-loaded dataset or API call
    // For now, return common bairros for the state
    const bairroData = {
        'RJ': [
            { id: '1', name: 'Copacabana' },
            { id: '2', name: 'Ipanema' },
            { id: '3', name: 'Leblon' },
            // ... more
        ],
        // ... other states
    };
    
    return bairroData[location.state] || [];
}
```

### 4.3 Validation & Error Handling

#### Field Validation Rules
```javascript
const validationRules = {
    nomeCompleto: {
        required: true,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        minLength: 2,
        maxLength: 200,
        message: 'Nome deve conter apenas letras e espaços'
    },
    apelido: {
        required: true,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        minLength: 1,
        maxLength: 30,
        message: 'Primeiro nome é obrigatório (1-30 caracteres)'
    },
    sobrenome: {
        required: true,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        minLength: 1,
        maxLength: 200,
        message: 'Sobrenome é obrigatório (1-200 caracteres)'
    },
    nome: {
        required: true,
        message: 'Nome completo é gerado automaticamente'
    },
    celular: {
        required: true,
        message: 'Celular é obrigatório'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Email é obrigatório'
    },
    bairro: {
        required: true,
        message: 'Bairro é obrigatório'
    }
};
```

#### Real-time Validation
```javascript
function setupValidation() {
    Object.keys(validationRules).forEach(fieldId => {
        $w(`#${fieldId}`).onBlur((event) => {
            const value = event.target.value;
            const rule = validationRules[fieldId];
            
            if (!validateField(value, rule)) {
                showFieldError(fieldId, rule.message);
            } else {
                hideFieldError(fieldId);
            }
        });
    });
}
```

---

## 5. Deployment Strategy

### 5.1 Development Workflow
```
1. Write Velo code locally in IDE
2. Use `wix preview` to test on live site
3. Run journey agent against preview URL
4. Get user approval
5. `wix publish` to production
```

### 5.2 Testing Checklist
- [ ] Auto-fill works on mobile + desktop
- [ ] Phone lookup finds existing users
- [ ] Form validation prevents invalid submissions
- [ ] WhatsApp redirect works after submission
- [ ] Returning user flow shows correct data
- [ ] Optional fields toggle properly
- [ ] Data saves to Registros collection
- [ ] syncStatus set to "pending"

### 5.3 Rollback Plan
- Keep previous `/participe` page as backup
- Monitor error rates post-deployment
- Have quick revert option if issues arise

---

## 6. Success Metrics

### 6.1 User Experience
- **Form completion time:** < 2 minutes (target)
- **Auto-fill acceptance:** > 70% of users keep suggestions
- **Returning user recognition:** > 95% accuracy

### 6.2 Technical
- **Form submission success:** > 98%
- **Data quality:** > 90% valid records
- **Sync success:** > 95% records sync to gabineteonline

### 6.3 Business
- **Registration conversion:** Increase from current baseline
- **Staff time savings:** 20+ hours/week
- **Data entry errors:** < 5% (vs current 30%)

---

## 7. Next Steps

1. **Create Velo code files** in Wix Editor
2. **Implement auto-fill logic** starting with phone area codes
3. **Test phone lookup** with existing Registros data
4. **Add progressive disclosure** for optional fields
5. **Deploy via preview** and validate with journey agent</content>
<parameter name="filePath">c:\Users\otavi\Documents\prova-ai\Updating-FlavioValle\docs\PARTICIPE_PAGE_AUTO_FILL_PLAN.md