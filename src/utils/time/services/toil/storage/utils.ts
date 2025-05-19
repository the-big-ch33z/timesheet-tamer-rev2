
/**
 * @deprecated This file is kept for backward compatibility.
 * Import utilities from './core.ts' instead.
 */

// Define the attemptStorageOperation function directly here
export const attemptStorageOperation = async <T>(
  operation: () => T,
  retryDelay: number = 200,
  maxRetries: number = 3
): Promise<T> => {
  let retryCount = 0;
  let lastError: any = null;

  while (retryCount <= maxRetries) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      retryCount++;
      
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
};

// Export constants for backward compatibility
export const STORAGE_RETRY_DELAY = 200;
export const STORAGE_MAX_RETRIES = 3;

// Helper function for safely parsing JSON
export const safelyParseJSON = (json: string | null, defaultValue: any) => {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
};
