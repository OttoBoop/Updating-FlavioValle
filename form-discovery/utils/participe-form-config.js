/**
 * F5-T1: /participe Form Configuration Module
 *
 * Defines the form configuration for the /participe page, mapping Wix form fields
 * to gabineteonline fields with metadata for labels, types, validation, and visibility.
 */

// Form constants
const FORM_ID = 'comp-m4wplov41';
const WHATSAPP_REDIRECT_URL = 'https://wa.me/5521978919938';
const SUBMIT_BUTTON_LABEL = 'Cadastrar e ir ao WhatsApp';

// Field definitions (single source of truth)
const FIELD_DEFINITIONS = [
  // Required fields (5) - always visible
  {
    wixField: 'nomeCompleto',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    visible: true,
    maxLength: 200,
    gabineteField: 'nome',
    existingWixId: 'nome',
    placeholder: 'Seu nome completo',
  },
  {
    wixField: 'apelido',
    label: 'Como gostaria de ser chamado?',
    type: 'text',
    required: true,
    visible: true,
    maxLength: 30,
    gabineteField: 'apelido',
    existingWixId: null,
    placeholder: 'Ex: João, Dona Maria',
  },
  {
    wixField: 'celular',
    label: 'Celular',
    type: 'tel',
    required: true,
    visible: true,
    maxLength: 14,
    gabineteField: 'celular',
    existingWixId: 'phone',
    placeholder: '(21) 99999-9999',
  },
  {
    wixField: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    visible: true,
    maxLength: 5000,
    gabineteField: 'email',
    existingWixId: 'email',
    placeholder: 'seu@email.com',
  },
  {
    wixField: 'bairro',
    label: 'Bairro',
    type: 'dropdown',
    required: true,
    visible: true,
    gabineteField: 'id_bairro',
    existingWixId: 'collection_comp-m6z7d0i3',
    placeholder: 'Selecione seu bairro',
  },

  // Optional fields (12) - hidden by default, toggleable
  {
    wixField: 'cpf',
    label: 'CPF',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 14,
    gabineteField: 'cpf',
    existingWixId: null,
    placeholder: '000.000.000-00',
  },
  {
    wixField: 'sexo',
    label: 'Sexo',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 1,
    gabineteField: 'sexo',
    existingWixId: null,
    placeholder: '1=M, 2=F',
  },
  {
    wixField: 'dataNascimento',
    label: 'Data de Nascimento',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 10,
    gabineteField: 'data_nascimento',
    existingWixId: null,
    placeholder: 'DD/MM/AAAA',
  },
  {
    wixField: 'telefone',
    label: 'Telefone',
    type: 'tel',
    required: false,
    visible: false,
    maxLength: 13,
    gabineteField: 'telefone',
    existingWixId: null,
    placeholder: '(21) 2222-3333',
  },
  {
    wixField: 'cep',
    label: 'CEP',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 9,
    gabineteField: 'cep',
    existingWixId: null,
    placeholder: '00000-000',
  },
  {
    wixField: 'endereco',
    label: 'Endereço',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 60,
    gabineteField: 'endereco',
    existingWixId: null,
    placeholder: 'Rua, Avenida, etc.',
  },
  {
    wixField: 'numero',
    label: 'Número',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 10,
    gabineteField: 'numero',
    existingWixId: null,
    placeholder: '123',
  },
  {
    wixField: 'complemento',
    label: 'Complemento',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 60,
    gabineteField: 'complemento',
    existingWixId: null,
    placeholder: 'Apt, Casa, etc.',
  },
  {
    wixField: 'uf',
    label: 'UF',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 2,
    gabineteField: 'uf',
    existingWixId: null,
    placeholder: 'RJ',
  },
  {
    wixField: 'observacao',
    label: 'Observação',
    type: 'textarea',
    required: false,
    visible: false,
    maxLength: 5000,
    gabineteField: 'observacao',
    existingWixId: 'textarea_comp-m4wplove4',
    placeholder: 'Observações adicionais',
  },
  {
    wixField: 'titulo',
    label: 'Título de Eleitor',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 12,
    gabineteField: 'titulo_eleitor',
    existingWixId: null,
    placeholder: '0000 0000 0000',
  },
  {
    wixField: 'sessao',
    label: 'Sessão Eleitoral',
    type: 'text',
    required: false,
    visible: false,
    maxLength: 4,
    gabineteField: 'sessao',
    existingWixId: null,
    placeholder: '0000',
  },
];

// Cached configuration object
let cachedConfig = null;

/**
 * Build the field mapping dynamically from field definitions
 * Maps existingWixId → wixField
 * @returns {Object} Mapping object
 */
function buildFieldMapping() {
  const mapping = {};

  for (const field of FIELD_DEFINITIONS) {
    if (field.existingWixId && field.existingWixId !== field.wixField) {
      // Add both dash and underscore versions for robustness
      mapping[field.existingWixId] = field.wixField;

      // Handle dash/underscore variants
      const dashVersion = field.existingWixId.replace(/_/g, '-');
      const underscoreVersion = field.existingWixId.replace(/-/g, '_');

      if (dashVersion !== field.existingWixId) {
        mapping[dashVersion] = field.wixField;
      }
      if (underscoreVersion !== field.existingWixId) {
        mapping[underscoreVersion] = field.wixField;
      }
    }
  }

  return mapping;
}

/**
 * Get the complete form configuration
 * @returns {Object} Form configuration with formId, fields, and metadata
 */
export function getFormConfig() {
  if (!cachedConfig) {
    cachedConfig = {
      formId: FORM_ID,
      fields: FIELD_DEFINITIONS,
      whatsappRedirect: WHATSAPP_REDIRECT_URL,
      submitButtonLabel: SUBMIT_BUTTON_LABEL,
    };
  }

  return cachedConfig;
}

/**
 * Get only required fields (visible by default)
 * @returns {Array} Array of required field configurations
 */
export function getRequiredFields() {
  const config = getFormConfig();
  return config.fields.filter(field => field.required === true);
}

/**
 * Get only optional fields (hidden by default)
 * @returns {Array} Array of optional field configurations
 */
export function getOptionalFields() {
  const config = getFormConfig();
  return config.fields.filter(field => field.required === false);
}

/**
 * Lookup a single field by wixField name
 * @param {string} name - The wixField name to search for
 * @returns {Object|undefined} Field configuration or undefined if not found
 */
export function getFieldByWixName(name) {
  const config = getFormConfig();
  return config.fields.find(field => field.wixField === name);
}

/**
 * Get fields that should be visible on the form
 * @param {Object} overrides - Object with field names as keys and true as values to make visible
 * @returns {Array} Array of visible field configurations
 */
export function getVisibleFields(overrides = {}) {
  const config = getFormConfig();

  return config.fields.filter(
    field => field.required || overrides[field.wixField] === true
  );
}

/**
 * Map form submission data to Registros DB-compatible object
 * @param {Object} formData - Raw form data using existingWixId keys
 * @returns {Object} Registros DB-compatible object using wixField keys
 */
export function mapFormDataToRegistros(formData) {
  const result = {};
  const mapping = buildFieldMapping();

  // Transform each field
  for (const [key, value] of Object.entries(formData)) {
    // Map existingWixId to wixField, or use key as-is
    const targetKey = mapping[key] || key;
    result[targetKey] = value;
  }

  return result;
}
