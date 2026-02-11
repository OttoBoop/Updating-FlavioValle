const FIELD_MAPPING = {
  fullName: 'nome',
  nickname: 'apelido',
  cpf: 'cpf',
  gender: 'sexo',
  voterTitle: 'titulo',
  voterSection: 'sessao',
  votingLocation: 'id_localvoto',
  birthDate: 'datanascimento',
  nationality: 'nacionalidade',
  profession: 'profissao',
  phone: 'telefone',
  cellphone: 'celular',
  email: 'email',
  zipCode: 'cep',
  address: 'endereco',
  streetNumber: 'numero',
  addressComplement: 'complemento',
  state: 'uf',
  city: 'id_cidade',
  neighborhood: 'id_bairro',
  region: 'id_regiao',
  notes: 'observacao',
  confidential: 'ddsigilo',
  category: 'id_categoria',
  serviceType: 'atendimento',
  carrier: 'operadora',
  hasWhatsApp: 'whatsapp',
  disability: 'portador'
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
  observacao: 500
};

export function mapWixToGabinete(wixData) {
  const result = {};

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
  if (!result.celular) {
    throw new Error('Required field: celular');
  }

  return result;
}
