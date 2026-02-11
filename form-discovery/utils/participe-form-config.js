/**
 * F5-T1: /participe Form Configuration Module
 *
 * Defines the form configuration for the /participe page, mapping Wix form fields
 * to gabineteonline fields with metadata for labels, types, validation, and visibility.
 */

/**
 * Get the complete form configuration
 * @returns {Object} Form configuration with formId, fields, and metadata
 */
export function getFormConfig() {
  return {
    formId: 'comp-m4wplov41',

    fields: [
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
    ],

    whatsappRedirect: 'https://wa.me/5521978919938',
    submitButtonLabel: 'Cadastrar e ir ao WhatsApp',
  };
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

  return config.fields.filter(field => {
    // Always include required fields
    if (field.required) {
      return true;
    }

    // Include optional fields if overridden
    if (overrides[field.wixField] === true) {
      return true;
    }

    return false;
  });
}

/**
 * Map form submission data to Registros DB-compatible object
 * @param {Object} formData - Raw form data using existingWixId keys
 * @returns {Object} Registros DB-compatible object using wixField keys
 */
export function mapFormDataToRegistros(formData) {
  const result = {};

  // Define mapping from existingWixId to wixField
  const mapping = {
    'nome': 'nomeCompleto',
    'phone': 'celular',
    'collection_comp-m6z7d0i3': 'bairro',
    'collection_comp_m6z7d0i3': 'bairro', // Handle both dash and underscore
    'textarea_comp-m4wplove4': 'observacao',
    'textarea_comp_m4wplove4': 'observacao', // Handle both dash and underscore
  };

  // Transform each field
  for (const [key, value] of Object.entries(formData)) {
    // Check if this key needs to be mapped
    const targetKey = mapping[key] || key;
    result[targetKey] = value;
  }

  return result;
}
