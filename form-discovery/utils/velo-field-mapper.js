// Wix Velo compatible field mapper
// Maps Wix form fields to gabineteonline fields
// Handles nomeCompleto + sobrenome → concatenated nome

const FIELD_MAPPING = {
  // Required fields (from Wix /participe form)
  // nomeCompleto + sobrenome handled specially (see buildFullName)
  apelido: 'apelido',
  celular: 'celular',
  email: 'email',
  bairro: 'id_bairro',

  // Optional fields (hidden by default, toggleable)
  cpf: 'cpf',
  sexo: 'sexo',
  dataNascimento: 'datanascimento',
  telefone: 'telefone',
  cep: 'cep',
  endereco: 'endereco',
  numero: 'numero',
  complemento: 'complemento',
  uf: 'uf',
  observacao: 'observacao',
  titulo: 'titulo',
  sessao: 'sessao'
};

const MAX_LENGTHS = {
  nome: 200,
  apelido: 30,
  cpf: 14,
  titulo: 50,
  sessao: 30,
  telefone: 13,
  celular: 14,
  email: 5000,
  cep: 9,
  endereco: 200,
  numero: 100,
  complemento: 200,
  observacao: 500,
  datanascimento: 10
};

const REQUIRED_FIELDS = ['nome', 'apelido', 'celular', 'email', 'id_bairro'];

/**
 * Check if a value is empty (null, undefined, or whitespace-only string)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * Truncate a string to max length if needed
 * @param {string} value - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(value, maxLength) {
  if (typeof value === 'string' && maxLength && value.length > maxLength) {
    return value.substring(0, maxLength);
  }
  return value;
}

/**
 * Build full name from nomeCompleto and optional sobrenome
 * @param {Object} wixData - Wix form data
 * @returns {string} Concatenated and trimmed full name
 */
function buildFullName(wixData) {
  if (!wixData.nomeCompleto) return '';

  let nome = String(wixData.nomeCompleto).trim();

  if (wixData.sobrenome && String(wixData.sobrenome).trim() !== '') {
    const sobrenome = String(wixData.sobrenome).trim();
    nome = `${nome} ${sobrenome}`;
  }

  return truncate(nome, MAX_LENGTHS.nome);
}

/**
 * Validate that all required fields are present
 * @param {Object} result - Mapped gabineteonline data
 * @throws {Error} If any required field is missing
 */
function validateRequiredFields(result) {
  for (const field of REQUIRED_FIELDS) {
    if (!result[field]) {
      throw new Error(`Required field: ${field}`);
    }
  }
}

/**
 * Map Wix form data to gabineteonline field format
 * @param {Object} wixData - Wix form data with fields like nomeCompleto, sobrenome, apelido, etc.
 * @returns {Object} Mapped data for gabineteonline with fields like nome, apelido, celular, etc.
 * @throws {Error} If required fields are missing
 */
export function mapWixToGabinete(wixData) {
  const result = {};

  // Handle name concatenation: nomeCompleto + sobrenome → nome
  const nome = buildFullName(wixData);
  if (nome) {
    result.nome = nome;
  }

  // Map all other fields
  for (const [wixField, gabineteField] of Object.entries(FIELD_MAPPING)) {
    if (wixField in wixData) {
      let value = wixData[wixField];

      // Skip empty values for optional fields
      if (isEmpty(value)) continue;

      // Truncate if needed
      value = truncate(value, MAX_LENGTHS[gabineteField]);

      result[gabineteField] = value;
    }
  }

  // Validate required fields
  validateRequiredFields(result);

  return result;
}
