/**
 * F3-T2: Registros DB Collection Operations
 *
 * Manages the Registros collection for constituent registration data.
 * Provides CRUD operations, syncStatus management, and phone lookups.
 */

const COLLECTION_NAME = 'Registros';

// Sync status constants
export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
};

// System field defaults
const SYSTEM_DEFAULTS = {
  syncStatus: SYNC_STATUS.PENDING,
  syncError: null,
  syncAttempts: 0,
  gabineteId: null,
  lastSyncAt: null,
};

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO 8601 timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Get the Registros collection schema definition
 * @returns {Object} Schema with required, optional, system fields, types, and indexes
 */
export function getRegistrosSchema() {
  return {
    // Required fields (5) - always visible on form
    required: [
      'nomeCompleto',   // "Nome Completo" → gabinete `nome`
      'apelido',        // "Como gostaria de ser chamado?"
      'celular',        // Phone number (primary key)
      'email',          // Email address
      'bairro',         // Neighborhood dropdown
    ],

    // Optional fields (12) - hidden by default, toggleable
    optional: [
      'cpf',            // CPF (Brazilian tax ID)
      'sexo',           // Gender (1=M, 2=F)
      'dataNascimento', // Date of birth
      'telefone',       // Landline phone
      'cep',            // Postal code
      'endereco',       // Street address
      'numero',         // Street number
      'complemento',    // Address complement
      'uf',             // State (27 UFs)
      'observacao',     // Notes/observations
      'titulo',         // Electoral card number
      'sessao',         // Electoral section
    ],

    // System fields (5) - not shown on form
    system: [
      'syncStatus',     // Sync state: "pending" | "synced" | "failed"
      'syncError',      // Last error message (if failed)
      'syncAttempts',   // Retry counter
      'gabineteId',     // ID in gabineteonline after sync
      'lastSyncAt',     // Timestamp of last sync attempt
    ],

    // Field types
    types: {
      nomeCompleto: 'text',
      apelido: 'text',
      celular: 'text',
      email: 'text',
      bairro: 'text',
      cpf: 'text',
      sexo: 'text',
      dataNascimento: 'text',
      telefone: 'text',
      cep: 'text',
      endereco: 'text',
      numero: 'text',
      complemento: 'text',
      uf: 'text',
      observacao: 'text',
      titulo: 'text',
      sessao: 'text',
      syncStatus: 'text',
      syncError: 'text',
      syncAttempts: 'number',
      gabineteId: 'text',
      lastSyncAt: 'text',
    },

    // Indexes for performance
    indexes: ['celular'],
  };
}

/**
 * Insert a new registration into the Registros collection
 * @param {Object} wixData - Wix Data API mock
 * @param {Object} registration - Registration data
 * @returns {Promise<Object>} Inserted record with _id
 * @throws {Error} If required fields are missing
 */
export async function insertRegistration(wixData, registration) {
  const schema = getRegistrosSchema();

  // Validate required fields
  const missingFields = schema.required.filter(field => !registration[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Build complete record with system defaults
  const record = {
    ...registration,
    ...SYSTEM_DEFAULTS,
  };

  // Insert into collection
  return wixData.insert(COLLECTION_NAME, record);
}

/**
 * Query registration by phone number (celular)
 * @param {Object} wixData - Wix Data API mock
 * @param {string} celular - Phone number to search
 * @returns {Promise<Object|null>} First matching record or null
 */
export async function queryByCelular(wixData, celular) {
  const result = wixData
    .query(COLLECTION_NAME)
    .eq('celular', celular)
    .find();

  // Return most recent if multiple exist (last in array)
  if (result.items.length > 0) {
    return result.items[result.items.length - 1];
  }

  return null;
}

/**
 * Update sync status for a registration
 * @param {Object} wixData - Wix Data API mock
 * @param {string} registrationId - Record _id
 * @param {string} status - New status: "pending" | "synced" | "failed"
 * @param {string|null} gabineteId - ID from gabineteonline (if synced)
 * @param {string|null} errorMessage - Error message (if failed)
 * @returns {Promise<Object>} Updated record
 */
export async function updateSyncStatus(wixData, registrationId, status, gabineteId = null, errorMessage = null) {
  const updates = {
    _id: registrationId,
    syncStatus: status,
    lastSyncAt: getCurrentTimestamp(),
  };

  if (status === SYNC_STATUS.SYNCED && gabineteId) {
    updates.gabineteId = gabineteId;
    updates.syncError = null;
  }

  if (status === SYNC_STATUS.FAILED && errorMessage) {
    updates.syncError = errorMessage;
  }

  return wixData.update(COLLECTION_NAME, updates);
}

/**
 * Increment sync attempts counter
 * @param {Object} wixData - Wix Data API mock
 * @param {string} registrationId - Record _id
 * @returns {Promise<Object>} Updated record
 */
export async function incrementSyncAttempts(wixData, registrationId) {
  // Get current record
  const current = await wixData.get(COLLECTION_NAME, registrationId);

  // Increment counter
  const updates = {
    _id: registrationId,
    syncAttempts: (current.syncAttempts || 0) + 1,
    lastSyncAt: getCurrentTimestamp(),
  };

  return wixData.update(COLLECTION_NAME, updates);
}
