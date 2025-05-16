
import { TOILRecord } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { TOIL_RECORDS_KEY } from "./constants";
import { attemptStorageOperation, loadTOILRecords } from "./core";

const logger = createTimeLogger('TOIL-Storage-RecordOperations');

/**
 * Store a TOIL record in local storage
 * 
 * @param record - The TOIL record to store
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function storeTOILRecord(record: TOILRecord): Promise<boolean> {
  try {
    const records = loadTOILRecords();
    
    // Remove any existing records with the same ID (update case)
    const filteredRecords = records.filter(r => r.id !== record.id);
    
    // Add the new/updated record
    filteredRecords.push(record);
    
    // Store the updated records array
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      'storing TOIL record'
    );
    
    logger.debug(`TOIL record successfully stored: ${record.id}`);
    return true;
  } catch (error) {
    logger.error(`Error storing TOIL record: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Delete all TOIL records for a specific user
 * 
 * @param userId - The user ID to delete records for
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function deleteUserTOILRecords(userId: string): Promise<boolean> {
  try {
    const records = loadTOILRecords();
    
    // Filter out records for the specified user
    const filteredRecords = records.filter(r => r.userId !== userId);
    
    // Check if any records were removed
    if (filteredRecords.length === records.length) {
      logger.debug(`No TOIL records found for user ${userId}`);
      return true;
    }
    
    // Store the filtered records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      `deleting TOIL records for user ${userId}`
    );
    
    logger.debug(`TOIL records for user ${userId} successfully deleted`);
    return true;
  } catch (error) {
    logger.error(`Error deleting TOIL records for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Delete a specific TOIL record by ID
 * 
 * @param recordId - The ID of the record to delete
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function deleteTOILRecordById(recordId: string): Promise<boolean> {
  try {
    const records = loadTOILRecords();
    
    // Filter out the specified record
    const filteredRecords = records.filter(r => r.id !== recordId);
    
    // Check if any record was removed
    if (filteredRecords.length === records.length) {
      logger.debug(`No TOIL record found with ID ${recordId}`);
      return false;
    }
    
    // Store the filtered records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      `deleting TOIL record ${recordId}`
    );
    
    logger.debug(`TOIL record ${recordId} successfully deleted`);
    return true;
  } catch (error) {
    logger.error(`Error deleting TOIL record ${recordId}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Delete TOIL records associated with a specific time entry
 * 
 * @param entryId - The time entry ID
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function deleteTOILRecordsByEntryId(entryId: string): Promise<boolean> {
  try {
    const records = loadTOILRecords();
    
    // Filter out records associated with the specified entry
    const filteredRecords = records.filter(r => r.entryId !== entryId);
    
    // Check if any records were removed
    if (filteredRecords.length === records.length) {
      logger.debug(`No TOIL records found for entry ${entryId}`);
      return true;
    }
    
    // Store the filtered records
    await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      `deleting TOIL records for entry ${entryId}`
    );
    
    logger.debug(`TOIL records for entry ${entryId} successfully deleted`);
    return true;
  } catch (error) {
    logger.error(`Error deleting TOIL records for entry ${entryId}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
