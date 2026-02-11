// Wix Velo compatible field mapper
// Maps Wix form fields to gabineteonline fields
// Handles nomeCompleto + sobrenome → concatenated nome

const FIELD_MAPPING = {
  // Required fields (from Wix /participe form)
  // nomeCompleto + sobrenome handled specially (see below)
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

export function mapWixToGabinete(wixData) {
  const result = {};

  // Handle name concatenation: nomeCompleto + sobrenome → nome
  let nome = '';
  if (wixData.nomeCompleto) {
    nome = String(wixData.nomeCompleto).trim();

    if (wixData.sobrenome && String(wixData.sobrenome).trim() !== '') {
      const sobrenome = String(wixData.sobrenome).trim();
      nome = nome + ' ' + sobrenome;
    }
  }

  if (nome) {
    // Truncate to max length if needed
    if (MAX_LENGTHS.nome && nome.length > MAX_LENGTHS.nome) {
      nome = nome.substring(0, MAX_LENGTHS.nome);
    }
    result.nome = nome;
  }

  // Map all other fields
  for (const [wixField, gabineteField] of Object.entries(FIELD_MAPPING)) {
    if (wixField in wixData) {
      let value = wixData[wixField];

      // Skip empty/null/undefined/whitespace-only values for optional fields
      if (value === null || value === undefined) continue;
      if (typeof value === 'string' && value.trim() === '') continue;

      // Truncate if needed
      if (typeof value === 'string' && MAX_LENGTHS[gabineteField]) {
        value = value.substring(0, MAX_LENGTHS[gabineteField]);
      }

      result[gabineteField] = value;
    }
  }

  // Validate required fields
  if (!result.nome) {
    throw new Error('Required field: nome');
  }
  if (!result.apelido) {
    throw new Error('Required field: apelido');
  }
  if (!result.celular) {
    throw new Error('Required field: celular');
  }
  if (!result.email) {
    throw new Error('Required field: email');
  }
  if (!result.id_bairro) {
    throw new Error('Required field: id_bairro');
  }

  return result;
}
