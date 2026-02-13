# Wix Developer Mode Injection Guide

**Date:** February 13, 2026
**Target:** `/participe` page enhancement
**Time Estimate:** 45-60 minutes

## 🚀 Quick Start

### Step 1: Access Developer Mode
1. Go to https://flaviovalle.com
2. Click **"Edit Site"** (bottom-left)
3. Click **"Dev Mode"** toggle (top-right)
4. Go to **Pages → participe**

---

## 📁 File Injection Order

### 1. Public Files (Dev Mode → Public & Backend → public/)

#### File 1: `validation-utils.js`
```javascript
// public/validation-utils.js - Form validation utilities

/**
 * Validation rules for each field
 */
export const validationRules = {
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
        maxLength: 5000,
        message: 'Email é obrigatório'
    },
    cep: {
        required: true,
        pattern: /^\d{5}-\d{3}$|^\d{8}$/,
        message: 'CEP é obrigatório. Use formato: 99999-999'
    },
    cpf: {
        required: false,
        pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
        message: 'CPF inválido. Use formato: 999.999.999-99'
    },
    dataNascimento: {
        required: true,
        pattern: /^\d{2}\/\d{2}\/\d{4}$/,
        message: 'Data de nascimento é obrigatória. Use formato: DD/MM/AAAA'
    },
    titulo: {
        required: false,
        pattern: /^\d+$/,
        minLength: 12,
        maxLength: 12,
        message: 'Título de eleitor deve ter 12 dígitos'
    },
    sessao: {
        required: false,
        pattern: /^\d+$/,
        maxLength: 4,
        message: 'Sessão deve conter apenas números'
    }
};

/**
 * Validate a single field against its rules
 * @param {any} value - Field value
 * @param {Object} rule - Validation rule
 * @returns {boolean} True if valid
 */
export function validateField(value, rule) {
    if (!rule) return true;

    // Check required
    if (rule.required && (!value || value.toString().trim() === '')) {
        return false;
    }

    // If not required and empty, it's valid
    if (!rule.required && (!value || value.toString().trim() === '')) {
        return true;
    }

    const strValue = value.toString().trim();

    // Check pattern
    if (rule.pattern && !rule.pattern.test(strValue)) {
        return false;
    }

    // Check length
    if (rule.minLength && strValue.length < rule.minLength) {
        return false;
    }

    if (rule.maxLength && strValue.length > rule.maxLength) {
        return false;
    }

    // Custom validations
    if (rule.custom) {
        return rule.custom(strValue);
    }

    return true;
}

/**
 * Validate all fields in form data
 * @param {Object} data - Form data object
 * @returns {Array} Array of validation errors
 */
export function validateFormData(data) {
    const errors = [];

    Object.keys(validationRules).forEach(fieldId => {
        const rule = validationRules[fieldId];
        const value = data[fieldId];

        if (!validateField(value, rule)) {
            errors.push({
                field: fieldId,
                message: rule.message
            });
        }
    });

    return errors;
}
```

#### File 2: `location-utils.js`
```javascript
// public/location-utils.js - Location and address utilities

/**
 * Get user's current location (for area code hints)
 * @returns {Promise<Object>} Location data
 */
export async function getCurrentUserLocation() {
    try {
        // Try to get location from browser
        if (navigator.geolocation) {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    (error) => {
                        console.log('Geolocation not available:', error.message);
                        resolve({}); // Return empty object, don't fail
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 300000 // 5 minutes
                    }
                );
            });
        }
    } catch (error) {
        console.log('Location detection failed:', error);
    }

    return {}; // Return empty object on any failure
}

/**
 * Lookup address from CEP using ViaCEP API
 * @param {string} cep - CEP to lookup (with or without dash)
 * @returns {Promise<Object>} Address data
 */
export async function lookupAddressFromCEP(cep) {
    try {
        if (!cep || cep.trim() === '') {
            return {};
        }

        // Clean CEP (remove non-digits)
        const cleanCep = cep.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            throw new Error('CEP deve ter 8 dígitos');
        }

        // Call ViaCEP API
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

        if (!response.ok) {
            throw new Error('Erro na consulta do CEP');
        }

        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        // Return formatted address data
        return {
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || '',
            cep: formatCEP(data.cep) || cep
        };

    } catch (error) {
        console.error('CEP lookup failed:', error.message);
        throw error; // Re-throw to handle in calling code
    }
}

/**
 * Format CEP with dash
 * @param {string} cep - CEP string
 * @returns {string} Formatted CEP
 */
export function formatCEP(cep) {
    if (!cep) return '';

    const clean = cep.replace(/\D/g, '');

    if (clean.length === 8) {
        return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }

    return cep; // Return as-is if not 8 digits
}

/**
 * Get area code from location (for phone number hints)
 * @param {Object} location - Location data
 * @returns {string} Area code or empty string
 */
export function getAreaCodeFromLocation(location) {
    // This would use location data to determine area code
    // For now, return empty (Brazil has many area codes)
    return '';
}
```

#### File 3: `text-utils.js`
```javascript
// public/text-utils.js - Text processing utilities

/**
 * Combine first and last names into full name
 * @param {string} firstName - First name (apelido)
 * @param {string} lastName - Last name (sobrenome)
 * @returns {string} Combined full name
 */
export function combineNames(firstName, lastName) {
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();

    if (first && last) {
        return `${first} ${last}`;
    } else if (first) {
        return first;
    } else if (last) {
        return last;
    }

    return '';
}

/**
 * Split full name into first and last names
 * @param {string} fullName - Full name to split
 * @returns {Object} Object with firstName and lastName
 */
export function splitFullName(fullName) {
    if (!fullName || fullName.trim() === '') {
        return { firstName: '', lastName: '' };
    }

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }

    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    return { firstName, lastName };
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export function capitalizeWords(text) {
    if (!text) return '';

    return text.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Remove extra whitespace and normalize
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
    if (!text) return '';

    return text.trim().replace(/\s+/g, ' ');
}
```

### 2. Page Code (Dev Mode → Page Code → participe)

#### File 4: `participe.js`
```javascript
// participe.js - Main page code for /participe
import wixLocation from 'wix-location';
import { getCurrentUserLocation, lookupAddressFromCEP, formatCEP } from 'public/location-utils.js';
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

    // Real-time name combination
    $w('#apelido').onInput((event) => {
        updateNomeCompleto();
    });

    $w('#sobrenome').onInput((event) => {
        updateNomeCompleto();
    });

    // CEP lookup on blur
    $w('#cep').onBlur(async (event) => {
        const cep = event.target.value;
        if (cep && cep.trim()) {
            await handleCEPLookup(cep);
        }
    });

    // Form submission
    $w('#submitButton').onClick(async () => {
        await handleFormSubmission();
    });

    // Toggle optional fields
    $w('#showMoreFields').onClick(() => {
        toggleOptionalFields();
    });

    // WhatsApp redirect for returning users
    $w('#whatsappButton').onClick(() => {
        wixLocation.to('https://wa.me/5521978919938');
    });
}

function setupValidation() {
    // Real-time validation for all required fields
    Object.keys(validationRules).forEach(fieldId => {
        const element = $w(`#${fieldId}`);
        if (element) {
            element.onBlur((event) => {
                const value = event.target.value;
                const rule = validationRules[fieldId];

                if (!validateField(value, rule)) {
                    showFieldError(fieldId, rule.message);
                } else {
                    hideFieldError(fieldId);
                }
            });
        }
    });
}

async function checkReturningUser() {
    // Check URL parameters for phone number (for direct links)
    const phoneParam = wixLocation.query.celular;
    if (phoneParam) {
        await handlePhoneLookup(phoneParam);
    }
}

async function handlePhoneLookup(phone) {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        console.log('Looking up phone:', cleanPhone);

        // TODO: Implement phone lookup when database is available
        // For now, always show new user flow
        console.log('New user, showing registration form');
        showNewUserFlow();
    } catch (error) {
        console.error('Phone lookup failed:', error);
        showNewUserFlow(); // Default to new user flow
    }
}

function showReturningUserFlow(user) {
    // TODO: Implement returning user flow when database is available
    showNewUserFlow();
}

function showUpdateForm(user) {
    // TODO: Implement update form when database is available
    showNewUserFlow();
}

function showNewUserFlow() {
    // Ensure registration form is visible
    $w('#registrationForm').show();
    $w('#welcomeBackSection').hide();

    // Show only required fields initially
    showRequiredFieldsOnly();
}

function showRequiredFieldsOnly() {
    // Hide optional field sections
    $w('#optionalFieldsSection').hide();
    $w('#showMoreFields').show();
}

function toggleOptionalFields() {
    const optionalSection = $w('#optionalFieldsSection');
    const toggleButton = $w('#showMoreFields');

    if (optionalSection.isVisible) {
        optionalSection.hide();
        toggleButton.label = 'Mostrar mais campos ▼';
    } else {
        optionalSection.show();
        toggleButton.label = 'Mostrar menos campos ▲';
    }
}

async function setupBairroSuggestions(location) {
    try {
        // This would load bairro options based on location
        // For now, we'll use a static list or load from a dataset
        const bairroOptions = await getBairroOptions(location);

        const bairroDropdown = $w('#bairro');
        if (bairroDropdown) {
            bairroDropdown.options = bairroOptions;
        }
    } catch (error) {
        console.error('Failed to setup bairro suggestions:', error);
    }
}

async function handleFormSubmission() {
    try {
        // Clear previous errors
        hideAllErrors();

        // Collect form data
        const formData = collectFormData();

        // Validate required fields
        const validationErrors = validateFormData(formData);
        if (validationErrors.length > 0) {
            showValidationErrors(validationErrors);
            return;
        }

        // Show loading state
        $w('#submitButton').disable();
        $w('#submitButton').label = 'Enviando...';

        // TODO: Save to database when backend is available
        console.log('Form data collected:', formData);

        // Redirect to WhatsApp
        wixLocation.to('https://wa.me/5521978919938');

    } catch (error) {
        console.error('Form submission failed:', error);
        showSubmissionError(error);

        // Re-enable submit button
        $w('#submitButton').enable();
        $w('#submitButton').label = 'Enviar';
    }
}

function collectFormData() {
    return {
        apelido: $w('#apelido').value,
        sobrenome: $w('#sobrenome').value,
        nome: $w('#nome').value,
        celular: $w('#celular').value,
        email: $w('#email').value,

        // Optional fields
        cpf: $w('#cpf').value || null,
        sexo: $w('#sexo').value || null,
        dataNascimento: $w('#dataNascimento').value || null,
        telefone: $w('#telefone').value || null,
        cep: $w('#cep').value || null,
        endereco: $w('#endereco').value || null,
        numero: $w('#numero').value || null,
        complemento: $w('#complemento').value || null,
        bairro: $w('#bairro').value || null,
        cidade: $w('#cidade').value || null,
        uf: $w('#uf').value || null,
        observacao: $w('#observacao').value || null,
        titulo: $w('#titulo').value || null,
        sessao: $w('#sessao').value || null
    };
}

function validateFormData(data) {
    const errors = [];

    Object.keys(validationRules).forEach(fieldId => {
        const rule = validationRules[fieldId];
        const value = data[fieldId];

        if (!validateField(value, rule)) {
            errors.push({
                field: fieldId,
                message: rule.message
            });
        }
    });

    return errors;
}

function showValidationErrors(errors) {
    errors.forEach(error => {
        showFieldError(error.field, error.message);
    });
}

function showFieldError(fieldId, message) {
    const errorElement = $w(`#${fieldId}Error`);
    if (errorElement) {
        errorElement.text = message;
        errorElement.show();
    }

    // Also highlight the field
    const fieldElement = $w(`#${fieldId}`);
    if (fieldElement) {
        fieldElement.style.borderColor = 'red';
        fieldElement.style.borderWidth = '2px';
    }
}

function hideFieldError(fieldId) {
    const errorElement = $w(`#${fieldId}Error`);
    if (errorElement) {
        errorElement.hide();
    }

    // Remove field highlighting
    const fieldElement = $w(`#${fieldId}`);
    if (fieldElement) {
        fieldElement.style.borderColor = '';
        fieldElement.style.borderWidth = '';
    }
}

function hideAllErrors() {
    Object.keys(validationRules).forEach(fieldId => {
        hideFieldError(fieldId);
    });
}

function showSubmissionError(error) {
    // Show general error message
    const errorElement = $w('#submissionError');
    if (errorElement) {
        errorElement.text = 'Erro ao enviar formulário. Tente novamente.';
        errorElement.show();
    }

    console.error('Submission error:', error);
}

function updateNomeCompleto() {
    const apelido = $w('#apelido').value || '';
    const sobrenome = $w('#sobrenome').value || '';
    const nomeCompleto = combineNames(apelido, sobrenome);
    $w('#nome').value = nomeCompleto;
}

async function handleCEPLookup(cep) {
    try {
        console.log('Looking up CEP:', cep);

        // Show loading indicator
        $w('#cepLoading').show();

        const addressData = await lookupAddressFromCEP(cep);

        // Populate address fields
        if (addressData.endereco) $w('#endereco').value = addressData.endereco;
        if (addressData.bairro) $w('#bairro').value = addressData.bairro;
        if (addressData.cidade) $w('#cidade').value = addressData.cidade;
        if (addressData.uf) $w('#uf').value = addressData.uf;

        // Update CEP format if needed
        if (addressData.cep && addressData.cep !== cep) {
            $w('#cep').value = addressData.cep;
        }

    } catch (error) {
        console.error('CEP lookup failed:', error);
        // Don't show error for CEP lookup failures - user can enter manually
    } finally {
        // Hide loading indicator
        $w('#cepLoading').hide();
    }
}

// Helper functions for bairro options (would be in a separate utility)
async function getBairroOptions(location) {
    // This would load from a dataset or API
    // For now, return a basic list
    return [
        { label: 'Selecione seu bairro', value: '' },
        { label: 'Copacabana', value: 'copacabana' },
        { label: 'Ipanema', value: 'ipanema' },
        { label: 'Leblon', value: 'leblon' },
        { label: 'Botafogo', value: 'botafogo' },
        // ... more options
    ];
}
```

---

## 🔧 Form Structure Changes

### Required Element ID Changes
| Current Element | Current ID | New ID | Action |
|----------------|------------|--------|--------|
| "Nome Completo" field | `nome` | `apelido` | Change label to "Primeiro Nome" |
| Phone field | `phone` | `celular` | Keep label as "Celular" |
| Bairro dropdown | `collection_comp-m6z7d0i3` | `bairro` | Keep label as "Bairro" |
| Textarea | `textarea_comp-m4wplove4` | `observacao` | Keep label as "Observações" |

### New Elements to Add
1. **Full Name Display** (after surname field)
   - Type: Text input (read-only)
   - Label: "Nome Completo"
   - ID: `nome`

2. **CEP Field** (after email field)
   - Type: Text input
   - Label: "CEP"
   - ID: `cep`

3. **Birth Date Field** (after CEP field)
   - Type: Date input
   - Label: "Data de Nascimento"
   - ID: `dataNascimento`

4. **Optional Fields Container**
   - Type: Strip/Column
   - ID: `optionalFieldsSection`
   - Initially hidden

5. **Toggle Button**
   - Type: Button
   - Label: "Mostrar mais campos ▼"
   - ID: `showMoreFields`

6. **Submit Button**
   - Current submit button → ID: `submitButton`

---

## ✅ Testing Checklist

### Preview Mode Tests
- [ ] Page loads without console errors
- [ ] Name combination: `apelido` + `sobrenome` → `nome`
- [ ] CEP auto-fill populates address fields
- [ ] Form validation shows Portuguese error messages
- [ ] Required fields prevent submission when empty
- [ ] WhatsApp redirect works after successful validation
- [ ] Optional fields toggle visibility

### Element ID Verification
- [ ] `#apelido` (renamed from `#nome`)
- [ ] `#sobrenome` (already exists)
- [ ] `#nome` (new read-only field)
- [ ] `#celular` (renamed from `#phone`)
- [ ] `#email` (already exists)
- [ ] `#cep` (new field)
- [ ] `#dataNascimento` (new field)
- [ ] `#submitButton` (existing button)
- [ ] `#showMoreFields` (new button)
- [ ] `#optionalFieldsSection` (new container)

---

## 🚨 Troubleshooting

### Common Issues
| Problem | Check | Solution |
|---------|-------|----------|
| Code not loading | Console errors | Verify file paths in imports |
| Elements not found | `$w('#id')` errors | Update element IDs to match code |
| CEP API fails | Network tab | Check if viacep.com.br is accessible |
| Validation not working | Form submits with errors | Ensure validation-utils.js is loaded |

### Rollback Steps
1. Remove injected code files from Dev Mode
2. Revert element ID changes
3. Remove added form fields
4. Test that original form still works

---

## 📋 Summary

**Time:** 45-60 minutes
**Files to inject:** 4 files
**Elements to modify:** 4 existing + 5 new
**Testing:** 12 verification points

**Ready to execute!** All code is prepared and documented for manual injection.