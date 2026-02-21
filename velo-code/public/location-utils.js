// public/location-utils.js - V4 formatting and normalization helpers

export function formatCEP(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 5) {
        return digits;
    }

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizePhone(value) {
    // Always return digits-only — must match participatedb normalizePhone()
    return String(value || '').replace(/\D/g, '');
}

export function normalizeGenderValue(value) {
    const normalized = String(value || '').trim().toLowerCase();

    if (normalized === 'homem') {
        return 'homem';
    }

    if (normalized === 'mulher') {
        return 'mulher';
    }

    if (
        normalized === 'outro_prefiro_nao_informar'
        || normalized === 'outro/prefiro nao informar'
        || normalized === 'outro'
    ) {
        return 'outro_prefiro_nao_informar';
    }

    return '';
}
