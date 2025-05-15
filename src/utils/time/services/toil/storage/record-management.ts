
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { TOILRecord, TOILUsage } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from './constants';
import { 
  attemptStorageOperation,
  loadTOILRecords,
  loadTOILUsage,
  clearSummaryCache
} from './core';

const logger = createTimeLogger('TOILRecordManagement');

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
    
    // Clear the summary cache for this user and month
    if (record.monthYear) {
      await clearSummaryCache(record.userId, record.monthYear);
    }
    
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
    
    // Clear the summary cache for this user and month
    if (usage.monthYear) {
      await clearSummaryCache(usage.userId, usage.monthYear);
    }
    
    return true;
  }, `storeTOILUsage-${usage.id}`);
}

/**
 * Delete TOIL records for a specific user
 */
export async function deleteUserTOILRecords(userId: string): Promise<boolean> {
  return attemptStorageOperation(async () => {
    logger.debug(`Deleting all TOIL records for user: ${userId}`);
    
    // Get existing records
    const records = loadTOILRecords();
    const usages = loadTOILUsage();
    
    // Filter out records for this user
    const filteredRecords = records.filter(r => r.userId !== userId);
    const filteredUsages = usages.filter(u => u.userId !== userId);
    
    // Save filtered records back to storage
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
    localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsages));
    
    // Clear all cache for this user
    await clearSummaryCache(userId);
    
    logger.debug(`Deleted TOIL records for user: ${userId}`);
    return true;
  }, `deleteUserTOILRecords-${userId}`);
}

/**
 * Delete a specific TOIL record by ID
 */
export async function deleteTOILRecordById(id: string): Promise<boolean> {
  return attemptStorageOperation(async () => {
    logger.debug(`Deleting TOIL record with ID: ${id}`);
    
    // Get existing records
    const records = loadTOILRecords();
    
    // Find the record to delete
    const recordToDelete = records.find(r => r.id === id);
    if (!recordToDelete) {
      logger.debug(`No TOIL record found with ID: ${id}`);
      return false;
    }
    
    // Filter out the record to delete
    const filteredRecords = records.filter(r => r.id !== id);
    
    // Save filtered records back to storage
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
    
    // Clear cache for this user and month
    if (recordToDelete.monthYear) {
      await clearSummaryCache(recordToDelete.userId, recordToDelete.monthYear);
    }
    
    logger.debug(`Deleted TOIL record with ID: ${id}`);
    return true;
  }, `deleteTOILRecordById-${id}`);
}

/**
 * Delete TOIL records associated with a specific time entry
 */
export async function deleteTOILRecordsByEntryId(entryId: string): Promise<boolean> {
  return attemptStorageOperation(async () => {
    logger.debug(`Deleting TOIL records for entry: ${entryId}`);
    
    // Get existing records
    const records = loadTOILRecords();
    
    // Find records to delete
    const recordsToDelete = records.filter(r => r.entryId === entryId);
    if (recordsToDelete.length === 0) {
      logger.debug(`No TOIL records found for entry: ${entryId}`);
      return true;
    }
    
    // Filter out records for this entry
    const filteredRecords = records.filter(r => r.entryId !== entryId);
    
    // Save filtered records back to storage
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
    
    // Clear cache for affected users and months
    const affectedUserMonths = new Map<string, Set<string>>();
    
    recordsToDelete.forEach(record => {
      if (!record.userId || !record.monthYear) return;
      
      if (!affectedUserMonths.has(record.userId)) {
        affectedUserMonths.set(record.userId, new Set());
      }
      
      affectedUserMonths.get(record.userId)?.add(record.monthYear);
    });
    
    // Clear cache for each affected user and month
    for (const [userId, months] of affectedUserMonths.entries()) {
      for (const month of months) {
        await clearSummaryCache(userId, month);
      }
    }
    
    logger.debug(`Deleted ${recordsToDelete.length} TOIL records for entry: ${entryId}`);
    return true;
  }, `deleteTOILRecordsByEntryId-${entryId}`);
}
