
import { TOILRecord, TOILSummary, TOILUsage } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY
} from "./constants";
import { 
  attemptStorageOperation, 
  loadTOILRecords, 
  loadTOILUsage,
  getSummaryCacheKey
} from "./core";

const logger = createTimeLogger('TOIL-Storage-RecordManagement');

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
    const success = await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      'storing TOIL record'
    );
    
    logger.debug(`TOIL record ${success ? 'successfully' : 'failed to be'} stored: ${record.id}`);
    return !!success; // Convert to boolean explicitly
  } catch (error) {
    logger.error(`Error storing TOIL record: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Store a TOIL usage record in local storage
 * 
 * @param usage - The TOIL usage record to store
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    const usages = loadTOILUsage();
    
    // Remove any existing usages with the same ID (update case)
    const filteredUsages = usages.filter(u => u.id !== usage.id);
    
    // Add the new/updated usage
    filteredUsages.push(usage);
    
    // Store the updated usages array
    const success = await attemptStorageOperation(
      () => localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(filteredUsages)),
      'storing TOIL usage'
    );
    
    logger.debug(`TOIL usage ${success ? 'successfully' : 'failed to be'} stored: ${usage.id}`);
    return !!success; // Convert to boolean explicitly
  } catch (error) {
    logger.error(`Error storing TOIL usage: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Store a TOIL summary in local storage
 * 
 * @param summary - The TOIL summary to store
 * @returns Promise that resolves to the stored summary if successful, null otherwise
 */
export async function storeTOILSummary(summary: TOILSummary): Promise<TOILSummary | null> {
  try {
    if (!summary || !summary.userId || !summary.monthYear) {
      logger.error('Invalid TOIL summary data provided');
      return null;
    }
    
    // Create a cache key for this summary
    const cacheKey = getSummaryCacheKey(summary.userId, summary.monthYear);
    
    // Store the summary in local storage
    const success = await attemptStorageOperation(
      () => localStorage.setItem(cacheKey, JSON.stringify(summary)),
      'storing TOIL summary'
    );
    
    if (!!success) {  // Convert to boolean explicitly with double negation
      logger.debug(`TOIL summary successfully stored for ${summary.userId} - ${summary.monthYear}`);
      return summary;
    } else {
      logger.error(`Failed to store TOIL summary for ${summary.userId} - ${summary.monthYear}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error storing TOIL summary: ${error instanceof Error ? error.message : String(error)}`);
    return null;
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
    const success = await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      `deleting TOIL records for user ${userId}`
    );
    
    logger.debug(`TOIL records for user ${userId} ${!!success ? 'successfully deleted' : 'failed to delete'}`);
    return !!success; // Convert to boolean explicitly
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
    const success = await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      `deleting TOIL record ${recordId}`
    );
    
    logger.debug(`TOIL record ${recordId} ${!!success ? 'successfully deleted' : 'failed to delete'}`);
    return !!success; // Convert to boolean explicitly
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
    const success = await attemptStorageOperation(
      () => localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(filteredRecords)),
      `deleting TOIL records for entry ${entryId}`
    );
    
    logger.debug(`TOIL records for entry ${entryId} ${!!success ? 'successfully deleted' : 'failed to delete'}`);
    return !!success; // Convert to boolean explicitly
  } catch (error) {
    logger.error(`Error deleting TOIL records for entry ${entryId}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
