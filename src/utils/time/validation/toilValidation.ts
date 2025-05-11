
/**
 * TOIL validation utilities
 * 
 * These functions help ensure TOIL records contain valid data
 */

import { TOILRecord, TOILUsage } from '@/types/toil';
import { createTimeLogger } from '../errors/timeLogger';

const logger = createTimeLogger('TOILValidation');

/**
 * Validate that TOIL hours are within acceptable range
 * @param hours Hours to validate
 * @returns boolean True if hours are valid
 */
export const isValidTOILHours = (hours: number): boolean => {
  // Hours must be positive and no more than 24
  if (isNaN(hours) || hours < 0 || hours > 24) {
    logger.debug(`Invalid TOIL hours: ${hours}`);
    return false;
  }
  
  return true;
};

/**
 * Validate a complete TOIL record
 * @param record TOIL record to validate
 * @returns boolean True if record is valid
 */
export const validateTOILRecord = (record: TOILRecord): boolean => {
  try {
    if (!record) return false;
    
    // Check required fields
    if (!record.id || !record.userId || !record.date || !record.monthYear) {
      logger.debug(`Missing required fields in TOIL record`);
      return false;
    }
    
    // Validate hours
    if (!isValidTOILHours(record.hours)) {
      return false;
    }
    
    // Check if entryId is present
    if (!record.entryId) {
      logger.debug(`TOIL record is missing entryId`);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Error validating TOIL record: ${error}`);
    return false;
  }
};

/**
 * Validate a TOIL usage record
 * @param usage TOIL usage record to validate
 * @returns boolean True if usage record is valid
 */
export const validateTOILUsage = (usage: TOILUsage): boolean => {
  try {
    if (!usage) return false;
    
    // Check required fields
    if (!usage.id || !usage.userId || !usage.date || !usage.monthYear) {
      logger.debug(`Missing required fields in TOIL usage`);
      return false;
    }
    
    // Validate hours
    if (!isValidTOILHours(usage.hours)) {
      return false;
    }
    
    // Check if entryId is present
    if (!usage.entryId) {
      logger.debug(`TOIL usage is missing entryId`);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Error validating TOIL usage: ${error}`);
    return false;
  }
};
