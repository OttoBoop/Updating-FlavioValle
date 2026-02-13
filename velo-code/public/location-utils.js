// public/location-utils.js - Location and geolocation utilities

/**
 * Get current user location using IP geolocation
 * @returns {Promise<{state: string, city: string, country: string}>}
 */
export async function getCurrentUserLocation() {
    try {
        // Use a free IP geolocation service
        const response = await fetch('https://ipapi.co/json/', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Geolocation failed: ${response.status}`);
        }

        const data = await response.json();

        return {
            state: data.region_code || null, // e.g., "RJ", "SP"
            city: data.city || null,
            country: data.country_code || 'BR',
            latitude: data.latitude || null,
            longitude: data.longitude || null
        };
    } catch (error) {
        console.warn('IP geolocation failed, using defaults:', error.message);
        // Fallback to Brazil defaults
        return {
            state: null,
            city: null,
            country: 'BR'
        };
    }
}

/**
 * Get Brazilian area code for a state
 * @param {string} state - Two-letter state code (e.g., "RJ", "SP")
 * @returns {string} Area code (e.g., "21", "11")
 */
export function getAreaCodeForState(state) {
    const areaCodes = {
        'AC': '68', 'AL': '82', 'AP': '96', 'AM': '92',
        'BA': '71', 'CE': '85', 'DF': '61', 'ES': '27',
        'GO': '62', 'MA': '98', 'MT': '65', 'MS': '67',
        'MG': '31', 'PA': '91', 'PB': '83', 'PR': '41',
        'PE': '81', 'PI': '86', 'RJ': '21', 'RN': '84',
        'RS': '51', 'RO': '69', 'RR': '95', 'SC': '48',
        'SP': '11', 'SE': '79', 'TO': '63'
    };

    return areaCodes[state] || '11'; // Default to São Paulo
}

/**
 * Get common bairros for a state
 * @param {string} state - Two-letter state code
 * @returns {Array<{id: string, name: string}>} Bairro options
 */
export function getBairrosForState(state) {
    // This would ideally load from a dataset
    // For now, return common bairros for major cities
    const bairroData = {
        'RJ': [
            { id: '1', name: 'Copacabana' },
            { id: '2', name: 'Ipanema' },
            { id: '3', name: 'Leblon' },
            { id: '4', name: 'Botafogo' },
            { id: '5', name: 'Flamengo' },
            { id: '6', name: 'Tijuca' },
            { id: '7', name: 'Centro' },
            { id: '8', name: 'Méier' },
            { id: '9', name: 'Madureira' },
            { id: '10', name: 'Bangu' }
        ],
        'SP': [
            { id: '101', name: 'Pinheiros' },
            { id: '102', name: 'Vila Madalena' },
            { id: '103', name: 'Itaim Bibi' },
            { id: '104', name: 'Jardins' },
            { id: '105', name: 'Moema' },
            { id: '106', name: 'Centro' },
            { id: '107', name: 'Liberdade' },
            { id: '108', name: 'Santana' },
            { id: '109', name: 'Tatuapé' },
            { id: '110', name: 'Vila Mariana' }
        ],
        // Add more states as needed
    };

    return bairroData[state] || [];
}

/**
 * Format phone number with Brazilian mask
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatBrazilianPhone(phone) {
    if (!phone) return '';

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Apply Brazilian mobile mask: (99) 99999-9999
    if (digits.length <= 2) {
        return `(${digits}`;
    } else if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else {
        // Handle longer numbers
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
}

/**
 * Validate Brazilian phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidBrazilianPhone(phone) {
    if (!phone) return false;

    const digits = phone.replace(/\D/g, '');
    // Brazilian mobile: 10-11 digits, starting with valid area codes
    return digits.length >= 10 && digits.length <= 11 && /^\d{10,11}$/.test(digits);
}

/**
 * Look up address data from CEP (Brazilian postal code)
 * @param {string} cep - CEP code (with or without dash)
 * @returns {Promise<{endereco: string, bairro: string, cidade: string, uf: string, complemento?: string}>}
 */
export async function lookupAddressFromCEP(cep) {
    try {
        if (!cep) {
            throw new Error('CEP is required');
        }

        // Clean CEP (remove non-digits)
        const cleanCEP = cep.replace(/\D/g, '');

        if (cleanCEP.length !== 8) {
            throw new Error('CEP must be 8 digits');
        }

        // Use ViaCEP API (free Brazilian CEP service)
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`CEP lookup failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP not found');
        }

        return {
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || '',
            complemento: data.complemento || '',
            ibge: data.ibge || '',
            gia: data.gia || ''
        };

    } catch (error) {
        console.error('CEP lookup failed:', error.message);
        throw error;
    }
}

/**
 * Format CEP with dash
 * @param {string} cep - Raw CEP
 * @returns {string} Formatted CEP (99999-999)
 */
export function formatCEP(cep) {
    if (!cep) return '';

    const digits = cep.replace(/\D/g, '');

    if (digits.length <= 5) {
        return digits;
    } else {
        return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
    }
}</content>
<parameter name="filePath">c:\Users\otavi\Documents\prova-ai\Updating-FlavioValle\velo-code\public\location-utils.js