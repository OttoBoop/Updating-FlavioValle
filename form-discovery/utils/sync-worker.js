// Sync worker module for batch syncing Wix registrations to gabineteonline
// Uses velo-field-mapper and velo-gabinete-client
// Implements retry logic with exponential backoff

import { mapWixToGabinete } from './velo-field-mapper.js';
import { login, submitRegistration } from './velo-gabinete-client.js';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second
const DELAY_MULTIPLIER = 2; // Exponential backoff

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a placeholder gabinete ID
 * @returns {string} Placeholder ID
 */
function generateGabineteId() {
  // In production, would extract from XML response
  return 'synced_' + Date.now();
}

/**
 * Sync a single record from Wix to gabineteonline with retry logic
 * @param {string} recordId - Wix record _id
 * @param {Object} wixData - Wix Data API instance
 * @param {Object} wixFetch - Wix Fetch API instance
 * @param {string} username - Gabineteonline username
 * @param {string} password - Gabineteonline password
 * @returns {Promise<{success: boolean, recordId: string, error?: string}>}
 */
export async function syncSingleRecord(recordId, wixData, wixFetch, username, password) {
  try {
    // Step 1: Get record from Wix DB
    const record = wixData.get('Registros', recordId);
    if (!record) {
      return { success: false, recordId, error: 'Record not found' };
    }

    // Step 2: Login to gabineteonline
    let loginResult;
    try {
      loginResult = await login(username, password, wixFetch);
    } catch (error) {
      // Login failed - mark as failed immediately
      wixData.update('Registros', {
        _id: recordId,
        syncStatus: 'failed',
        syncError: `Login failed: ${error.message}`,
        lastSyncAt: Date.now()
      });
      return { success: false, recordId, error: `Login failed: ${error.message}` };
    }

    const { cookies } = loginResult;

    // Step 3: Map Wix fields to gabineteonline fields
    let mappedData;
    try {
      mappedData = mapWixToGabinete(record);
    } catch (error) {
      wixData.update('Registros', {
        _id: recordId,
        syncStatus: 'failed',
        syncError: `Mapping failed: ${error.message}`,
        lastSyncAt: Date.now()
      });
      return { success: false, recordId, error: `Mapping failed: ${error.message}` };
    }

    // Step 4: Submit with retry logic
    let lastError = null;

    for (let attempts = 1; attempts <= MAX_RETRIES; attempts++) {
      // Update attempt counter before each attempt
      wixData.update('Registros', {
        _id: recordId,
        syncAttempts: attempts
      });

      try {
        const result = await submitRegistration(cookies, mappedData, wixFetch);

        if (result.success) {
          // Success! Generate gabinete ID and update record
          const gabineteId = generateGabineteId();

          wixData.update('Registros', {
            _id: recordId,
            syncStatus: 'synced',
            syncAttempts: attempts,
            gabineteId: gabineteId,
            lastSyncAt: Date.now()
          });

          return { success: true, recordId };
        } else {
          // Submission failed
          lastError = result.error || 'Unknown error';
        }
      } catch (error) {
        lastError = error.message;
      }

      // If not the last attempt, wait before retrying with exponential backoff
      if (attempts < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(DELAY_MULTIPLIER, attempts - 1);
        await sleep(delay);
      }
    }

    // All retries exhausted
    wixData.update('Registros', {
      _id: recordId,
      syncStatus: 'failed',
      syncError: lastError,
      syncAttempts: MAX_RETRIES,
      lastSyncAt: Date.now()
    });

    return { success: false, recordId, error: lastError };

  } catch (error) {
    // Unexpected error
    wixData.update('Registros', {
      _id: recordId,
      syncStatus: 'failed',
      syncError: error.message,
      lastSyncAt: Date.now()
    });

    return { success: false, recordId, error: error.message };
  }
}

/**
 * Batch sync all pending records from Wix to gabineteonline
 * @param {Object} wixData - Wix Data API instance
 * @param {Object} wixFetch - Wix Fetch API instance
 * @param {string} username - Gabineteonline username
 * @param {string} password - Gabineteonline password
 * @returns {Promise<Array<{success: boolean, recordId: string, error?: string}>>}
 */
export async function syncPendingRecords(wixData, wixFetch, username, password) {
  // Query all pending records
  const queryResult = wixData.query('Registros')
    .eq('syncStatus', 'pending')
    .find();

  const pendingRecords = queryResult.items;

  // Sync each record sequentially
  const results = [];
  for (const record of pendingRecords) {
    const result = await syncSingleRecord(record._id, wixData, wixFetch, username, password);
    results.push(result);
  }

  return results;
}
