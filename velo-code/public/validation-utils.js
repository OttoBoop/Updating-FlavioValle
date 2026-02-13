// public/validation-utils.js - Form validation utilities

/**
 * Validation rules for each field
 */
export const validationRules = {
    apelido: {
        required: true,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        minLength: 1,
        maxLength: 30,
        message: 'Primeiro nome é obrigatório (1-30 caracteres)'
    },
    sobrenome: {
        required: true,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
        minLength: 1,
        maxLength: 200,
        message: 'Sobrenome é obrigatório (1-200 caracteres)'
    },
    nome: {
        required: true,
        message: 'Nome completo é gerado automaticamente'
    },
    celular: {
        required: true,
        message: 'Celular é obrigatório'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxLength: 5000,
        message: 'Email é obrigatório'
    },
    cep: {
        required: true,
        pattern: /^\d{5}-\d{3}$|^\d{8}$/,
        message: 'CEP é obrigatório. Use formato: 99999-999'
    },
    cpf: {
        required: false,
        pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
        message: 'CPF inválido. Use formato: 999.999.999-99'
    },
    dataNascimento: {
        required: true,
        pattern: /^\d{2}\/\d{2}\/\d{4}$/,
        message: 'Data de nascimento é obrigatória. Use formato: DD/MM/AAAA'
    },
    titulo: {
        required: false,
        pattern: /^\d+$/,
        minLength: 12,
        maxLength: 12,
        message: 'Título de eleitor deve ter 12 dígitos'
    },
    sessao: {
        required: false,
        pattern: /^\d+$/,
        maxLength: 4,
        message: 'Sessão deve conter apenas números'
    }
};

/**
 * Validate a single field against its rules
 * @param {any} value - Field value
 * @param {Object} rule - Validation rule
 * @returns {boolean} True if valid
 */
export function validateField(value, rule) {
    if (!rule) return true;

    // Check required
    if (rule.required && (!value || value.toString().trim() === '')) {
        return false;
    }

    // If not required and empty, it's valid
    if (!rule.required && (!value || value.toString().trim() === '')) {
        return true;
    }

    const strValue = value.toString().trim();

    // Check pattern
    if (rule.pattern && !rule.pattern.test(strValue)) {
        return false;
    }

    // Check length
    if (rule.minLength && strValue.length < rule.minLength) {
        return false;
    }

    if (rule.maxLength && strValue.length > rule.maxLength) {
        return false;
    }

    // Custom validations
    if (rule.customValidator) {
        return rule.customValidator(value);
    }

    return true;
}

/**
 * Validate all fields in form data
 * @param {Object} formData - Form data object
 * @returns {Array<{field: string, message: string}>} Validation errors
 */
export function validateFormData(formData) {
    const errors = [];

    Object.keys(validationRules).forEach(fieldId => {
        const rule = validationRules[fieldId];
        const value = formData[fieldId];

        if (!validateField(value, rule)) {
            errors.push({
                field: fieldId,
                message: rule.message
            });
        }
    });

    return errors;
}

/**
 * CPF validation with mod-11 algorithm
 * @param {string} cpf - CPF to validate
 * @returns {boolean} True if valid
 */
export function validateCPF(cpf) {
    if (!cpf) return false;

    // Remove formatting
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) return false;

    // Check for repeated digits
    if (/^(\d)\1+$/.test(digits)) return false;

    // Calculate first verification digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(digits[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    const firstDigit = remainder === 10 ? 0 : remainder;

    if (firstDigit !== parseInt(digits[9])) return false;

    // Calculate second verification digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(digits[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    const secondDigit = remainder === 10 ? 0 : remainder;

    return secondDigit === parseInt(digits[10]);
}

/**
 * Format CPF with mask
 * @param {string} cpf - Raw CPF
 * @returns {string} Formatted CPF
 */
export function formatCPF(cpf) {
    if (!cpf) return '';

    const digits = cpf.replace(/\D/g, '');

    if (digits.length <= 3) {
        return digits;
    } else if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
}

/**
 * Format CEP with mask
 * @param {string} cep - Raw CEP
 * @returns {string} Formatted CEP
 */
export function formatCEP(cep) {
    if (!cep) return '';

    const digits = cep.replace(/\D/g, '');

    if (digits.length <= 5) {
        return digits;
    } else {
        return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
    }
}

/**
 * Validate date format and logical constraints
 * @param {string} date - Date in DD/MM/YYYY format
 * @returns {boolean} True if valid
 */
export function validateDate(date) {
    if (!date) return false;

    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);

    // Basic range checks
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;

    // Month-specific day validation
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && isLeapYear(year)) {
        return day <= 29;
    } else {
        return day <= daysInMonth[month - 1];
    }
}

/**
 * Check if year is a leap year
 * @param {number} year - Year
 * @returns {boolean} True if leap year
 */
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}</content>
<parameter name="filePath">c:\Users\otavi\Documents\prova-ai\Updating-FlavioValle\velo-code\public\validation-utils.js