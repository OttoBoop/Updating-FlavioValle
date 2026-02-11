/**
 * F5-T3: Form Submission Handler
 *
 * Validates form data, maps to Registros schema, saves to DB, and redirects to WhatsApp.
 */

import { validateEmail } from './email-validation.js';
import { validatePhone } from './phone-validation.js';
import { detectSuspicious } from './suspicious-data.js';
import { getRequiredFields, mapFormDataToRegistros } from './participe-form-config.js';
import { insertRegistration } from './wix-db-operations.js';

/**
 * Validate form data
 * @param {Object} formData - Raw form data
 * @returns {Object} { valid: boolean, errors?: string[], suspicious?: boolean, suspiciousReasons?: string[] }
 */
export function validateFormData(formData) {
  const errors = [];

  // Check required fields
  const requiredFields = getRequiredFields();
  for (const field of requiredFields) {
    const fieldName = field.wixField;
    if (!formData[fieldName] || formData[fieldName].trim() === '') {
      errors.push(`${fieldName} is required`);
    }
  }

  // Validate email if present
  if (formData.email) {
    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) {
      errors.push(`Invalid email: ${emailResult.error}`);
    }
  }

  // Validate phone/celular if present
  if (formData.celular) {
    const phoneResult = validatePhone(formData.celular);
    if (!phoneResult.valid) {
      errors.push(`Invalid celular: ${phoneResult.error}`);
    }
  }

  // If validation errors exist, return invalid
  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  // Check for suspicious data
  const suspiciousResult = detectSuspicious(formData);
  if (suspiciousResult.suspicious) {
    return {
      valid: true,
      suspicious: true,
      suspiciousReasons: suspiciousResult.reasons
    };
  }

  return { valid: true };
}

/**
 * Submit registration
 * @param {Object} formData - Raw form data
 * @param {Object} wixData - Wix Data API
 * @param {Object} wixLocation - Wix Location API
 * @returns {Promise<Object>} { success: boolean, record?: Object, errors?: string[], formData?: Object }
 */
export async function submitRegistration(formData, wixData, wixLocation) {
  // Map form data to Registros schema first (handles old keys like nome → nomeCompleto)
  const mappedData = mapFormDataToRegistros(formData);

  // Validate mapped data
  const validationResult = validateFormData(mappedData);
  if (!validationResult.valid) {
    return {
      success: false,
      errors: validationResult.errors,
      formData
    };
  }

  try {
    // Insert into DB
    const record = await insertRegistration(wixData, mappedData);

    // Redirect to WhatsApp
    wixLocation.to('https://wa.me/5521978919938');

    return {
      success: true,
      record
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message],
      formData
    };
  }
}
