import { v4 as uuidv4 } from 'uuid';
import { TOILRecord } from '@/types/toil';
import { createTimeLogger } from '@/utils/time/errors';
import { 
  TOIL_RECORDS_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES
} from './constants';
import { loadTOILRecords, filterRecordsByDate, filterRecordsByEntryId, loadRawTOILRecords } from './core';
import { attemptStorageOperation } from './utils';
import { format } from 'date-fns';
import { addToDeletedTOILRecords } from './deletion-tracking';
import { deleteAllToilData } from '../unifiedDeletion';

const logger = createTimeLogger('TOIL-RecordOperations');

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
 * Delete TOIL records by entry ID - now uses unified deletion approach
 */
export async function deleteTOILRecordsByEntryId(entryId: string): Promise<number> {
  try {
    logger.debug(`Deleting TOIL records for entry ID: ${entryId}`);
    
    // First, find which records would be affected
    const allRecords = loadRawTOILRecords();
    const recordsToDelete = allRecords.filter(record => record.entryId === entryId);
    
    if (recordsToDelete.length === 0) {
      logger.debug(`No TOIL records found for entry ID: ${entryId}`);
      return 0;
    }
    
    // Get the userId from the first record for targeted deletion
    const userId = recordsToDelete[0].userId;
    
    console.log(`[TOIL-DEBUG] Found ${recordsToDelete.length} TOIL records for entry ${entryId}, user ${userId}`);
    
    // Add to deletion tracking first
    const trackingPromises = recordsToDelete.map(record => addToDeletedTOILRecords(record.id));
    await Promise.all(trackingPromises);
    
    // Use unified deletion to clear user's TOIL data
    const deletionResult = await deleteAllToilData(userId);
    
    if (deletionResult.success) {
      logger.debug(`Successfully deleted ${recordsToDelete.length} TOIL records for entry ${entryId} via unified deletion`);
      return recordsToDelete.length;
    } else {
      logger.error(`Failed to delete TOIL records for entry ${entryId} via unified deletion:`, deletionResult.errors);
      
      // Fallback to manual deletion
      const remainingRecords = allRecords.filter(record => record.entryId !== entryId);
      await attemptStorageOperation(
        () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(remainingRecords)),
        STORAGE_RETRY_DELAY,
        STORAGE_MAX_RETRIES
      );
      
      logger.debug(`Fallback deletion completed for ${recordsToDelete.length} TOIL records`);
      return recordsToDelete.length;
    }
  } catch (error) {
    logger.error(`Error deleting TOIL records for entry ${entryId}:`, error);
    return 0;
  }
}
