
import { v4 as uuidv4 } from 'uuid';
import { TOILRecord } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { 
  TOIL_RECORDS_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES
} from './constants';
import { loadTOILRecords, filterRecordsByDate, filterRecordsByEntryId } from './core';
import { attemptStorageOperation } from './utils';
import { format } from 'date-fns';

const logger = createTimeLogger('TOIL-Storage');

/**
 * Store a TOIL record in local storage
 * Updated to check for existing records with the same date and userId
 */
export async function storeTOILRecord(record: TOILRecord): Promise<boolean> {
  try {
    const records = loadTOILRecords();
    
    // Check for existing records with the same date and userId
    const dateKey = format(record.date, 'yyyy-MM-dd');
    const existingRecordIndex = records.findIndex(r => 
      r.userId === record.userId && 
      format(new Date(r.date), 'yyyy-MM-dd') === dateKey
    );
    
    if (existingRecordIndex >= 0) {
      // Update existing record instead of adding a new one
      logger.debug(`Found existing TOIL record for ${record.userId} on ${dateKey}, updating instead of creating new`);
      
      // Only update if the calculated hours are different
      if (Math.abs(records[existingRecordIndex].hours - record.hours) > 0.01) {
        records[existingRecordIndex].hours = record.hours;
        logger.debug(`Updated TOIL hours to ${record.hours} for existing record`);
      } else {
        logger.debug(`No change in TOIL hours, skipping update`);
        return true; // No change needed
      }
    } else {
      // No existing record found, add the new record
      logger.debug(`No existing TOIL record found for ${record.userId} on ${dateKey}, adding new record`);
      records.push(record);
    }
    
    // Save back to storage
    await attemptStorageOperation(
      () => {
        localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
      },
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    return true;
  } catch (error) {
    logger.error('Failed to store TOIL record:', error);
    return false;
  }
}

/**
 * Delete all TOIL records for a specific user
 */
export async function deleteUserTOILRecords(userId: string): Promise<number> {
  try {
    const allRecords = loadTOILRecords();
    const filteredRecords = allRecords.filter(record => record.userId !== userId);
    const deletedCount = allRecords.length - filteredRecords.length;
    
    // Save back to storage if records were actually removed
    if (deletedCount > 0) {
      await attemptStorageOperation(
        () => {
          localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
        },
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      logger.debug(`Deleted ${deletedCount} TOIL records for user ${userId}`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Failed to delete user TOIL records:', error);
    return 0;
  }
}

/**
 * Delete a specific TOIL record by ID
 */
export async function deleteTOILRecordById(recordId: string): Promise<boolean> {
  try {
    const allRecords = loadTOILRecords();
    const filteredRecords = allRecords.filter(record => record.id !== recordId);
    
    // Check if a record was actually removed
    if (filteredRecords.length === allRecords.length) {
      logger.debug(`No TOIL record found with ID ${recordId}`);
      return false;
    }
    
    // Save back to storage
    await attemptStorageOperation(
      () => {
        localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
      },
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    logger.debug(`Deleted TOIL record with ID ${recordId}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete TOIL record by ID:', error);
    return false;
  }
}

/**
 * Delete all TOIL records associated with a specific time entry
 * This is important for cleanup when a time entry is deleted
 */
export async function deleteTOILRecordsByEntryId(entryId: string): Promise<number> {
  try {
    const allRecords = loadTOILRecords();
    
    // Find records with matching entry ID
    const recordsToDelete = filterRecordsByEntryId(allRecords, entryId);
    
    if (recordsToDelete.length === 0) {
      logger.debug(`No TOIL records found for entry ID ${entryId}`);
      return 0;
    }
    
    // Filter out the records with this entry ID
    const filteredRecords = allRecords.filter(record => record.entryId !== entryId);
    
    // Save back to storage
    await attemptStorageOperation(
      () => {
        localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords));
      },
      STORAGE_RETRY_DELAY,
      STORAGE_MAX_RETRIES
    );
    
    const deletedCount = allRecords.length - filteredRecords.length;
    logger.debug(`Deleted ${deletedCount} TOIL records for entry ID ${entryId}`);
    
    return deletedCount;
  } catch (error) {
    logger.error(`Failed to delete TOIL records for entry ID ${entryId}:`, error);
    return 0;
  }
}
