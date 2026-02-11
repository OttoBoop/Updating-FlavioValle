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

  // All same digit = invalid
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Check digit 1: multiply first 9 digits by 10..2, mod 11
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = sum % 11;
  const check1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[9]) !== check1) return false;

  // Check digit 2: multiply first 10 digits by 11..2, mod 11
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = sum % 11;
  const check2 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[10]) !== check2) return false;

  return true;
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
