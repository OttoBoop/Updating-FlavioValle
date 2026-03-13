// public/validation-utils.js - V4 validation rules

const NAME_PATTERN = /^[A-Za-z\u00C0-\u017F\s]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CEP_PATTERN = /^\d{5}-\d{3}$/;
const GENERO_VALUES = new Set([
    'homem',
    'mulher',
    'outro_prefiro_nao_informar'
]);

export const validationRules = {
    apelido: {
        required: true,
        minLength: 1,
        maxLength: 30,
        customValidator: (value) => NAME_PATTERN.test(String(value || '').trim()),
        message: 'Informe o primeiro nome (1-30 letras).'
    },
    sobrenome: {
        required: true,
        minLength: 1,
        maxLength: 200,
        customValidator: (value) => NAME_PATTERN.test(String(value || '').trim()),
        message: 'Informe o sobrenome (1-200 letras).'
    },
    nome: {
        required: true,
        minLength: 2,
        maxLength: 255,
        message: 'Nome completo nao pode ficar vazio.'
    },
    celular: {
        required: true,
        customValidator: (value) => isValidPhone(value),
        message: 'Informe um celular valido.'
    },
    email: {
        required: true,
        maxLength: 5000,
        customValidator: (value) => EMAIL_PATTERN.test(String(value || '').trim()),
        message: 'Informe um email valido.'
    },
    dataNascimento: {
        required: true,
        customValidator: (value) => isValidBirthDate(value),
        message: 'Informe uma data de nascimento valida.'
    },
    genero: {
        required: true,
        customValidator: (value) => GENERO_VALUES.has(String(value || '').trim()),
        message: 'Selecione uma opcao valida de genero.'
    },
    cep: {
        required: true,
        customValidator: (value) => CEP_PATTERN.test(String(value || '').trim()),
        message: 'Informe um CEP valido no formato 99999-999.'
    },
    rua: {
        required: true,
        minLength: 2,
        maxLength: 255,
        message: 'Rua nao pode ficar vazia.'
    },
    cidade: {
        required: true,
        minLength: 2,
        maxLength: 120,
        message: 'Cidade nao pode ficar vazia.'
    },
    numero: {
        required: true,
        customValidator: (value) => isValidHouseNumber(value),
        message: 'Numero e obrigatorio. Use numero da casa ou SN.'
    },
    complemento: {
        required: false,
        maxLength: 120,
        message: 'Complemento deve ter no maximo 120 caracteres.'
    },
    observacao: {
        required: false,
        maxLength: 500,
        message: 'Mensagem deve ter no maximo 500 caracteres.'
    }
};

export function validateField(value, rule) {
    if (!rule) {
        return true;
    }

    const normalized = normalizeValue(value);

    if (rule.required && normalized === '') {
        return false;
    }

    if (!rule.required && normalized === '') {
        return true;
    }

    if (rule.minLength && normalized.length < rule.minLength) {
        return false;
    }

    if (rule.maxLength && normalized.length > rule.maxLength) {
        return false;
    }

    if (rule.customValidator && !rule.customValidator(value, normalized)) {
        return false;
    }

    return true;
}

export function validateFormData(formData) {
    const errors = [];

    Object.keys(validationRules).forEach((fieldId) => {
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

export function isValidHouseNumber(value) {
    const normalized = normalizeValue(value).toUpperCase();
    if (normalized === 'SN' || normalized === 'S/N') {
        return true;
    }

    return /^\d+[A-Za-z]?$/.test(normalized);
}

export function isValidPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
}

export function isValidBirthDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value <= new Date();
    }

    const text = normalizeValue(value);
    if (!text) {
        return false;
    }

    // Accept DD/MM/YYYY
    const brMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brMatch) {
        const day = Number(brMatch[1]);
        const month = Number(brMatch[2]);
        const year = Number(brMatch[3]);
        return isCalendarDate(day, month, year);
    }

    // Accept YYYY-MM-DD from date picker.
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const year = Number(isoMatch[1]);
        const month = Number(isoMatch[2]);
        const day = Number(isoMatch[3]);
        return isCalendarDate(day, month, year);
    }

    return false;
}

function normalizeValue(value) {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value).trim();
}

function isCalendarDate(day, month, year) {
    const now = new Date();

    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
        return false;
    }

    if (year < 1900 || year > now.getFullYear()) {
        return false;
    }

    if (month < 1 || month > 12) {
        return false;
    }

    if (day < 1 || day > 31) {
        return false;
    }

    const date = new Date(year, month - 1, day);
    const isExactDate = (
        date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day
    );

    if (!isExactDate) {
        return false;
    }

    return date <= now;
}
