// Sync worker module for batch syncing Wix registrations to gabineteonline
// Uses velo-field-mapper and velo-gabinete-client
// Implements retry logic with exponential backoff

import { mapWixToGabinete } from './velo-field-mapper.js';
import { login, submitRegistration } from './velo-gabinete-client.js';

// Configuration constants
const COLLECTION_NAME = 'Registros';
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
 * Mark a record as failed with error message
 * @param {Object} wixData - Wix Data API instance
 * @param {string} recordId - Record ID
 * @param {string} errorMessage - Error message to store
 * @param {number} [attempts] - Number of attempts made (optional)
 */
function markRecordAsFailed(wixData, recordId, errorMessage, attempts = null) {
  const update = {
    _id: recordId,
    syncStatus: 'failed',
    syncError: errorMessage,
    lastSyncAt: Date.now()
  };

  if (attempts !== null) {
    update.syncAttempts = attempts;
  }

  wixData.update(COLLECTION_NAME, update);
}

/**
 * Sync a single record from Wix to gabineteonline with retry logic
 *
 * Process:
 * 1. Fetch record from Wix DB
 * 2. Login to gabineteonline (fail fast on auth errors)
 * 3. Map Wix fields → gabineteonline fields
 * 4. Submit with up to 3 retry attempts (exponential backoff: 1s, 2s, 4s)
 * 5. Update record status: pending → synced | failed
 *
 * @param {string} recordId - Wix record _id
 * @param {Object} wixData - Wix Data API instance
 * @param {Object} wixFetch - Wix Fetch API instance
 * @param {string} username - Gabineteonline username
 * @param {string} password - Gabineteonline password
 * @returns {Promise<{success: boolean, recordId: string, error?: string}>}
 *
 * @example
 * const result = await syncSingleRecord('abc123', wixData, wixFetch, 'user', 'pass');
 * if (result.success) {
 *   console.log('Synced record:', result.recordId);
 * } else {
 *   console.error('Sync failed:', result.error);
 * }
 */
export async function syncSingleRecord(recordId, wixData, wixFetch, username, password) {
  try {
    // Step 1: Get record from Wix DB
    const record = wixData.get(COLLECTION_NAME, recordId);
    if (!record) {
      return { success: false, recordId, error: 'Record not found' };
    }

    // Step 2: Login to gabineteonline
    let loginResult;
    try {
      loginResult = await login(username, password, wixFetch);
    } catch (error) {
      // Login failed - mark as failed immediately (no retries on auth errors)
      const errorMsg = `Login failed: ${error.message}`;
      markRecordAsFailed(wixData, recordId, errorMsg);
      return { success: false, recordId, error: errorMsg };
    }

    const { cookies } = loginResult;

    // Step 3: Map Wix fields to gabineteonline fields
    let mappedData;
    try {
      mappedData = mapWixToGabinete(record);
    } catch (error) {
      // Mapping failed - mark as failed immediately
      const errorMsg = `Mapping failed: ${error.message}`;
      markRecordAsFailed(wixData, recordId, errorMsg);
      return { success: false, recordId, error: errorMsg };
    }

    // Step 4: Submit with retry logic (exponential backoff)
    let lastError = null;

    for (let attempts = 1; attempts <= MAX_RETRIES; attempts++) {
      // Update attempt counter before each attempt
      wixData.update(COLLECTION_NAME, {
        _id: recordId,
        syncAttempts: attempts
      });

      try {
        const result = await submitRegistration(cookies, mappedData, wixFetch);

        if (result.success) {
          // Success! Generate gabinete ID and update record
          const gabineteId = generateGabineteId();

          wixData.update(COLLECTION_NAME, {
            _id: recordId,
            syncStatus: 'synced',
            syncAttempts: attempts,
            gabineteId: gabineteId,
            lastSyncAt: Date.now()
          });

          return { success: true, recordId };
        } else {
          // Submission failed - record error and potentially retry
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

    // All retries exhausted - mark as failed
    markRecordAsFailed(wixData, recordId, lastError, MAX_RETRIES);
    return { success: false, recordId, error: lastError };

  } catch (error) {
    // Unexpected error - mark as failed
    markRecordAsFailed(wixData, recordId, error.message);
    return { success: false, recordId, error: error.message };
  }
}

/**
 * Batch sync all pending records from Wix to gabineteonline
 *
 * Queries all records with syncStatus === 'pending' and syncs them sequentially.
 * Each record is synced independently with its own retry logic.
 *
 * @param {Object} wixData - Wix Data API instance
 * @param {Object} wixFetch - Wix Fetch API instance
 * @param {string} username - Gabineteonline username
 * @param {string} password - Gabineteonline password
 * @returns {Promise<Array<{success: boolean, recordId: string, error?: string}>>}
 *   Array of results, one per record
 *
 * @example
 * const results = await syncPendingRecords(wixData, wixFetch, 'user', 'pass');
 * const successful = results.filter(r => r.success).length;
 * const failed = results.filter(r => !r.success).length;
 * console.log(`Synced ${successful}, failed ${failed}`);
 */
export async function syncPendingRecords(wixData, wixFetch, username, password) {
  // Query all pending records
  const queryResult = wixData.query(COLLECTION_NAME)
    .eq('syncStatus', 'pending')
    .find();

  const pendingRecords = queryResult.items;

  // Sync each record sequentially (avoids overwhelming the server)
  const results = [];
  for (const record of pendingRecords) {
    const result = await syncSingleRecord(record._id, wixData, wixFetch, username, password);
    results.push(result);
  }

  return results;
}
