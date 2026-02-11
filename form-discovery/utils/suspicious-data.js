function cpfCheckDigit(digits, length) {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += parseInt(digits[i]) * (length + 1 - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Validates a Brazilian CPF using the mod-11 check-digit algorithm.
 * Strips formatting (dots, dashes) before validation.
 * @param {string} cpf - CPF string (11 digits, optionally formatted as XXX.XXX.XXX-XX)
 * @returns {boolean} true if CPF is mathematically valid
 */
export function validateCPF(cpf) {
  if (typeof cpf !== 'string') return false;

  const digits = cpf.replace(/[.\-]/g, '');
  if (digits.length !== 11 || !/^\d{11}$/.test(digits)) return false;

  if (/^(\d)\1{10}$/.test(digits)) return false;

  return parseInt(digits[9]) === cpfCheckDigit(digits, 9)
      && parseInt(digits[10]) === cpfCheckDigit(digits, 10);
}

export function detectSuspicious(data) {
  if (!data || typeof data !== 'object') {
    return {
      suspicious: false,
      reasons: [],
      data: data
    };
  }

  const reasons = [];

  // Check phone (celular)
  if (data.celular && data.celular.trim()) {
    const phone = data.celular;

    // All same digit
    if (/^(\d)\1{10}$/.test(phone)) {
      reasons.push('celular');
    }
    // Sequential digits
    else if (phone === '12345678901') {
      reasons.push('celular');
    }
  }

  // Check email
  if (data.email && data.email.trim()) {
    const emailLower = data.email.toLowerCase();

    if (emailLower === 'teste@teste.com' ||
        emailLower === 'test@test.com' ||
        emailLower.match(/^([a-z])\1+@\1+\.com$/) ||  // aaa@aaa.com
        emailLower === 'asdf@asdf.com' ||
        emailLower === 'qwerty@qwerty.com') {
      reasons.push('email');
    }
  }

  // Check name (nome)
  if (data.nome && data.nome.trim()) {
    const nameLower = data.nome.toLowerCase();

    if (nameLower === 'teste' ||
        nameLower === 'test' ||
        /^([a-z])\1+$/.test(nameLower) ||  // aaa, xxx
        nameLower === 'asdf' ||
        nameLower === 'qwerty') {
      reasons.push('nome');
    }
  }

  // Check CPF using algorithm
  if (data.cpf && data.cpf.trim()) {
    if (!validateCPF(data.cpf)) {
      reasons.push('cpf');
    }
  }

  return {
    suspicious: reasons.length > 0,
    reasons: reasons,
    data: data
  };
}
