
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILStorageUtils');

// Constants for storage operations
export const STORAGE_RETRY_DELAY = 200; // ms
export const STORAGE_MAX_RETRIES = 3;

/**
 * Helper to perform storage operations with retry logic
 * This prevents race conditions and storage errors
 */
export async function attemptStorageOperation<T>(
  operation: () => Promise<T> | T, 
  operationName: string,
  maxRetries: number = STORAGE_MAX_RETRIES
): Promise<T> {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      logger.debug(`Attempting storage operation: ${operationName} (try ${retryCount + 1}/${maxRetries})`);
      const result = await operation();
      logger.debug(`Storage operation successful: ${operationName}`);
      return result;
    } catch (error) {
      retryCount++;
      logger.error(`Error in storage operation ${operationName} (attempt ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        logger.error(`Max retries reached for operation: ${operationName}`);
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, STORAGE_RETRY_DELAY));
      logger.debug(`Retrying operation: ${operationName}`);
    }
  }
  
  // This should never be reached due to the throw in the catch block,
  // but TypeScript requires a return statement
  throw new Error(`Failed to complete operation: ${operationName}`);
}

/**
 * Helper to safely parse JSON from storage
 */
export function safelyParseJSON<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logger.error('Error parsing JSON:', error);
    return defaultValue;
  }
}
