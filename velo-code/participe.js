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
    // For now, always show new user flow
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

    // Add error styling to field
    const fieldElement = $w(`#${fieldId}`);
    if (fieldElement) {
        fieldElement.style.borderColor = 'red';
    }
}

function hideFieldError(fieldId) {
    const errorElement = $w(`#${fieldId}Error`);
    if (errorElement) {
        errorElement.hide();
    }

    // Remove error styling
    const fieldElement = $w(`#${fieldId}`);
    if (fieldElement) {
        fieldElement.style.borderColor = '';
    }
}

function hideAllErrors() {
    Object.keys(validationRules).forEach(fieldId => {
        hideFieldError(fieldId);
    });
}

function showSubmissionError(error) {
    const errorMessage = error.message || 'Erro ao salvar. Tente novamente.';
    $w('#submissionError').text = errorMessage;
    $w('#submissionError').show();
}

function isValidPhone(phone) {
    // Accept any phone format (Brazilian or international)
    return phone && phone.trim().length > 0;
}

// Update nome completo field when apelido or sobrenome changes
function updateNomeCompleto() {
    const apelido = $w('#apelido').value || '';
    const sobrenome = $w('#sobrenome').value || '';
    const nomeCompleto = combineNames(apelido, sobrenome);

    const nomeElement = $w('#nome');
    if (nomeElement) {
        nomeElement.value = nomeCompleto;
    }
// Handle CEP lookup and auto-fill address fields
async function handleCEPLookup(cep) {
    try {
        console.log('Looking up CEP:', cep);

        // Show loading indicator
        $w('#cepLoading').show();

        const addressData = await lookupAddressFromCEP(cep);

        // Auto-fill address fields
        if (addressData.endereco) {
            $w('#endereco').value = addressData.endereco;
        }
        if (addressData.numero) {
            $w('#numero').value = addressData.numero;
        }
        if (addressData.complemento) {
            $w('#complemento').value = addressData.complemento;
        }
        if (addressData.bairro) {
            $w('#bairro').value = addressData.bairro;
        }
        if (addressData.cidade) {
            $w('#cidade').value = addressData.cidade;
        }
        if (addressData.uf) {
            $w('#uf').value = addressData.uf;
        }

        console.log('Address auto-filled from CEP');

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
}</content>
<parameter name="filePath">c:\Users\otavi\Documents\prova-ai\Updating-FlavioValle\velo-code\participe.js