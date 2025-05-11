
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { TOILRecord, TOILUsage } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from './constants';
import { attemptStorageOperation, safelyParseJSON } from './utils';

const logger = createTimeLogger('TOILRecordManagement');

/**
 * Load all TOIL records from storage
 */
export function loadTOILRecords(filterUserId?: string): TOILRecord[] {
  try {
    logger.debug(`Loading TOIL records${filterUserId ? ` for user: ${filterUserId}` : ''}`);
    const records = localStorage.getItem(TOIL_RECORDS_KEY);
    
    if (!records) {
      return [];
    }
    
    const allRecords = safelyParseJSON<TOILRecord[]>(records, []);
    
    if (filterUserId) {
      return allRecords.filter(record => record.userId === filterUserId);
    }
    
    return allRecords;
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

/**
 * Load all TOIL usage records from storage
 */
export function loadTOILUsage(filterUserId?: string): TOILUsage[] {
  try {
    logger.debug(`Loading TOIL usage${filterUserId ? ` for user: ${filterUserId}` : ''}`);
    const usage = localStorage.getItem(TOIL_USAGE_KEY);
    
    if (!usage) {
      return [];
    }
    
    const allUsage = safelyParseJSON<TOILUsage[]>(usage, []);
    
    if (filterUserId) {
      return allUsage.filter(record => record.userId === filterUserId);
    }
    
    return allUsage;
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
  }
}

/**
 * Store a TOIL record
 */
export async function storeTOILRecord(record: TOILRecord): Promise<boolean> {
  return attemptStorageOperation(async () => {
    logger.debug(`Storing TOIL record: ${JSON.stringify(record)}`);
    
    // Ensure record has all required fields
    if (!record.id || !record.userId || !record.date) {
      logger.error('Invalid TOIL record, missing required fields');
      return false;
    }
    
    // Load existing records
    const records = loadTOILRecords();
    
    // Check for duplicates by ID
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex >= 0) {
      // Update existing record
      records[existingIndex] = record;
      logger.debug(`Updated existing TOIL record: ${record.id}`);
    } else {
      // Add new record
      records.push(record);
      logger.debug(`Added new TOIL record: ${record.id}`);
    }
    
    // Save records back to storage
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
    
    return true;
  }, `storeTOILRecord-${record.id}`);
}

/**
 * Store a TOIL usage record
 */
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  return attemptStorageOperation(async () => {
    logger.debug(`Storing TOIL usage: ${JSON.stringify(usage)}`);
    
    // Ensure record has all required fields
    if (!usage.id || !usage.userId || !usage.date) {
      logger.error('Invalid TOIL usage, missing required fields');
      return false;
    }
    
    // Load existing records
    const usages = loadTOILUsage();
    
    // Check for duplicates by ID
    const existingIndex = usages.findIndex(u => u.id === usage.id);
    
    if (existingIndex >= 0) {
      // Update existing record
      usages[existingIndex] = usage;
      logger.debug(`Updated existing TOIL usage: ${usage.id}`);
    } else {
      // Add new record
      usages.push(usage);
      logger.debug(`Added new TOIL usage: ${usage.id}`);
    }
    
    // Save records back to storage
    localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usages));
    
    return true;
  }, `storeTOILUsage-${usage.id}`);
}
