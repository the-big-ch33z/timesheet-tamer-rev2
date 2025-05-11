
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('toil-batch-processing');

export interface TOILBatchItem {
  userId: string;
  date: Date;
  hours: number;
  reason?: string;
  isAccrual?: boolean;
}

export interface TOILBatchResult {
  success: boolean;
  processedItems: number;
  errors: string[];
}

/**
 * Validate a TOIL batch item before processing
 */
export const validateTOILBatchItem = (item: TOILBatchItem): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!item.userId) errors.push('User ID is required');
  if (!item.date) errors.push('Date is required');
  if (typeof item.hours !== 'number' || item.hours <= 0) errors.push('Hours must be a positive number');
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Process a batch of TOIL items
 */
export const processTOILBatch = async (
  items: TOILBatchItem[]
): Promise<TOILBatchResult> => {
  if (!items || items.length === 0) {
    return {
      success: true,
      processedItems: 0,
      errors: []
    };
  }
  
  const result: TOILBatchResult = {
    success: true,
    processedItems: 0,
    errors: []
  };
  
  try {
    // Process each item
    for (const item of items) {
      // Validate the item
      const validation = validateTOILBatchItem(item);
      
      if (!validation.valid) {
        result.errors.push(`Invalid item: ${validation.errors.join(', ')}`);
        result.success = false;
        continue;
      }
      
      // Process the valid item (implementation would depend on actual requirements)
      // For now, just log it
      logger.debug(`Processing TOIL item: ${JSON.stringify(item)}`);
      result.processedItems++;
    }
    
    return result;
  } catch (error) {
    logger.error('Error processing TOIL batch:', error);
    return {
      success: false,
      processedItems: result.processedItems,
      errors: [...result.errors, error instanceof Error ? error.message : 'Unknown error']
    };
  }
};
