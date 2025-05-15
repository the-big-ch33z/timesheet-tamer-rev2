
/**
 * @deprecated This file is kept for backward compatibility.
 * Import utilities from './core.ts' instead.
 */

import { 
  safelyParseJSON as _safelyParseJSON,
  attemptStorageOperation as _attemptStorageOperation
} from './core';

// Re-export for backward compatibility
export const safelyParseJSON = _safelyParseJSON;
export const attemptStorageOperation = _attemptStorageOperation;

// Export constants for backward compatibility
export const STORAGE_RETRY_DELAY = 200;
export const STORAGE_MAX_RETRIES = 3;
