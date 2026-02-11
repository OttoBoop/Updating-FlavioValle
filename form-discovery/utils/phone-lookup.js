/**
 * F5-T2: Phone Lookup Logic Module
 *
 * Handles the phone lookup flow on /participe page:
 * - Validates phone numbers
 * - Queries Registros DB
 * - Routes users (new vs returning)
 */

import { validatePhone } from './phone-validation.js';
import { queryByCelular } from './wix-db-operations.js';
import { WHATSAPP_URL } from './constants.js';

// Route constants
export const ROUTES = {
  REGISTER: 'register',
  WELCOME_BACK: 'welcome-back',
  INVALID: 'invalid'
};

// Action constants
export const ACTIONS = {
  SHOW_FORM: 'showForm',
  SHOW_WELCOME: 'showWelcome',
  SHOW_ERROR: 'showError'
};

/**
 * Main lookup function - validates phone and queries DB
 * @param {string} phone - Raw phone input from user (any format)
 * @param {Object} wixData - Wix Data API instance (or mock)
 * @returns {Promise<{route: string, user?: Object, error?: string}>}
 */
export async function lookupPhone(phone, wixData) {
  // Validate phone
  const validation = validatePhone(phone);

  if (!validation.valid) {
    return {
      route: ROUTES.INVALID,
      error: validation.error
    };
  }

  // Query DB with normalized phone
  const user = await queryByCelular(wixData, validation.normalized);

  if (user) {
    return {
      route: ROUTES.WELCOME_BACK,
      user
    };
  }

  return {
    route: ROUTES.REGISTER
  };
}

/**
 * Generate welcome back message for returning user
 * @param {Object} user - The Registros record for returning user
 * @returns {string} - Welcome message using apelido (or nomeCompleto as fallback)
 */
export function getWelcomeMessage(user) {
  const name = user.apelido || user.nomeCompleto;
  return name ? `Bem-vindo de volta, ${name}!` : 'Bem-vindo de volta!';
}

/**
 * Returns what the UI should do based on lookup result
 * @param {Object} lookupResult - The result from lookupPhone()
 * @returns {Object} - Action object describing what the UI should do
 */
export function getRouteAction(lookupResult) {
  const { route } = lookupResult;

  switch (route) {
    case ROUTES.REGISTER:
      return {
        action: ACTIONS.SHOW_FORM,
        prefill: {}
      };

    case ROUTES.WELCOME_BACK:
      return {
        action: ACTIONS.SHOW_WELCOME,
        message: getWelcomeMessage(lookupResult.user),
        whatsappUrl: WHATSAPP_URL,
        showUpdateOption: true
      };

    case ROUTES.INVALID:
      return {
        action: ACTIONS.SHOW_ERROR,
        message: lookupResult.error
      };

    default:
      throw new Error(`Unknown route: ${route}`);
  }
}
