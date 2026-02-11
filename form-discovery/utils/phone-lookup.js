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
      route: 'invalid',
      error: validation.error
    };
  }

  // Query DB with normalized phone
  const user = await queryByCelular(wixData, validation.normalized);

  if (user) {
    return {
      route: 'welcome-back',
      user: user
    };
  }

  return {
    route: 'register'
  };
}

/**
 * Generate welcome back message for returning user
 * @param {Object} user - The Registros record for returning user
 * @returns {string} - Welcome message using apelido (or nomeCompleto as fallback)
 */
export function getWelcomeMessage(user) {
  if (user.apelido) {
    return `Bem-vindo de volta, ${user.apelido}!`;
  }

  if (user.nomeCompleto) {
    return `Bem-vindo de volta, ${user.nomeCompleto}!`;
  }

  return 'Bem-vindo de volta!';
}

/**
 * Returns what the UI should do based on lookup result
 * @param {Object} lookupResult - The result from lookupPhone()
 * @returns {Object} - Action object describing what the UI should do
 */
export function getRouteAction(lookupResult) {
  if (lookupResult.route === 'register') {
    return {
      action: 'showForm',
      prefill: {}
    };
  }

  if (lookupResult.route === 'welcome-back') {
    return {
      action: 'showWelcome',
      message: getWelcomeMessage(lookupResult.user),
      whatsappUrl: 'https://wa.me/5521978919938',
      showUpdateOption: true
    };
  }

  if (lookupResult.route === 'invalid') {
    return {
      action: 'showError',
      message: lookupResult.error
    };
  }
}
