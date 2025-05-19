
/**
 * @deprecated This file is kept for backward compatibility.
 * Import utilities from './core.ts' instead.
 */

import { 
  attemptStorageOperation as _attemptStorageOperation
} from './core';

// Re-export for backward compatibility
export const safelyParseJSON = (json: string | null, defaultValue: any) => {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};

export const attemptStorageOperation = _attemptStorageOperation;

// Export constants for backward compatibility
export const STORAGE_RETRY_DELAY = 200;
export const STORAGE_MAX_RETRIES = 3;
