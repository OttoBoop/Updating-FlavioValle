/**
 * Builds the schema for the Registros collection
 * @returns {Object} Collection schema
 */
export function buildRegistrosSchema() {
  return {
    id: 'Registros',
    fields: [
      { key: 'nome', type: 'text', required: true },
      { key: 'celular', type: 'text', required: true, indexed: true },
      { key: 'email', type: 'text' },
      { key: 'cpf', type: 'text' },
      { key: 'apelido', type: 'text' },
      { key: 'sexo', type: 'text' },
      { key: 'dataNascimento', type: 'text' },
      { key: 'telefone', type: 'text' },
      { key: 'cep', type: 'text' },
      { key: 'endereco', type: 'text' },
      { key: 'numero', type: 'text' },
      { key: 'complemento', type: 'text' },
      { key: 'uf', type: 'text' },
      { key: 'cidade', type: 'text' },
      { key: 'bairro', type: 'text' },
      { key: 'syncStatus', type: 'text' },
      { key: 'syncError', type: 'text' },
      { key: 'gabineteId', type: 'text' }
    ],
    permissions: {
      insert: ['site-member'],
      read: ['admin'],
      update: ['admin'],
      delete: ['admin']
    }
  };
}

/**
 * Creates the Registros collection via Wix REST API
 * @param {string} apiToken - Wix API token
 * @param {Function} fetchFn - Fetch function to use
 * @returns {Promise<Object>} Result object with success status
 */
export async function createRegistrosCollection(apiToken, fetchFn) {
  const schema = buildRegistrosSchema();

  const response = await fetchFn('https://www.wixapis.com/wix-data/v2/collections', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ collection: schema })
  });

  if (response.status === 200) {
    const data = await response.json();
    return {
      success: true,
      collection: data.collection
    };
  } else {
    const errorData = await response.json();
    return {
      success: false,
      error: errorData.message || 'Failed to create collection'
    };
  }
}
