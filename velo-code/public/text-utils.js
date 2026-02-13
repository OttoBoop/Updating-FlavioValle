// public/text-utils.js - Text processing utilities

/**
 * Combine first name and surname into full name
 * @param {string} primeiroNome - First name
 * @param {string} sobrenome - Surname
 * @returns {string} Full name
 */
export function combineNames(primeiroNome, sobrenome) {
    const first = (primeiroNome || '').trim();
    const last = (sobrenome || '').trim();

    if (!first && !last) return '';
    if (!first) return last;
    if (!last) return first;

    return `${first} ${last}`;
}

/**
 * Extract first name from full name (legacy function)
 * @param {string} nomeCompleto - Full name
 * @returns {string} Suggested first name
 */
export function deriveApelidoFromNomeCompleto(nomeCompleto) {
    if (!nomeCompleto || typeof nomeCompleto !== 'string') {
        return '';
    }

    const trimmed = nomeCompleto.trim();
    if (!trimmed) return '';

    // Split by spaces and get first part
    const parts = trimmed.split(/\s+/);
    const firstName = parts[0];

    if (!firstName) return '';

    // Capitalize first letter, lowercase rest
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

/**
 * Extract surname from full name
 * @param {string} nomeCompleto - Full name
 * @returns {string} Surname
 */
export function extractSobrenomeFromNomeCompleto(nomeCompleto) {
    if (!nomeCompleto || typeof nomeCompleto !== 'string') {
        return '';
    }

    const trimmed = nomeCompleto.trim();
    if (!trimmed) return '';

    // Split by spaces and get everything after first name
    const parts = trimmed.split(/\s+/);
    if (parts.length <= 1) return '';

    return parts.slice(1).join(' ');
}

/**
 * Clean and normalize text for database storage
 * @param {string} text - Input text
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text.trim()
        .replace(/\s+/g, ' ') // Multiple spaces to single
        .replace(/[^\w\sÀ-ÿ]/g, ''); // Remove special chars except accented letters
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Input text
 * @returns {string} Title case text
 */
export function toTitleCase(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Remove accents from text
 * @param {string} text - Text with accents
 * @returns {string} Text without accents
 */
export function removeAccents(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Check if text contains only letters and spaces
 * @param {string} text - Text to check
 * @returns {boolean} True if only letters and spaces
 */
export function isOnlyLettersAndSpaces(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }

    return /^[a-zA-ZÀ-ÿ\s]+$/.test(text);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a safe database key from text
 * @param {string} text - Input text
 * @returns {string} Safe key
 */
export function toSafeKey(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return removeAccents(text)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Format name for display (capitalize properly)
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
export function formatName(name) {
    if (!name || typeof name !== 'string') {
        return '';
    }

    return name.split(' ')
        .map(part => {
            // Handle particles like "de", "da", "do", "dos", "das"
            const particles = ['de', 'da', 'do', 'dos', 'das', 'e'];
            if (particles.includes(part.toLowerCase())) {
                return part.toLowerCase();
            }
            // Capitalize other parts
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join(' ');
}</content>
<parameter name="filePath">c:\Users\otavi\Documents\prova-ai\Updating-FlavioValle\velo-code\public\text-utils.js