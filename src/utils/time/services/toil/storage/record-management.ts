
import { TOILRecord, TOILUsage } from "@/types/toil";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from '@/utils/time/errors';
import { 
  loadTOILRecords, 
  loadTOILUsage,
  clearSummaryCache, 
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY
} from './core';

const logger = createTimeLogger('TOILRecordManagement');

// Store a TOIL record
export async function storeTOILRecord(record: TOILRecord): Promise<boolean> {
  try {
    const records = loadTOILRecords();
    
    // Check for duplicate by date and userId
    const existingIndex = records.findIndex(r => 
      r.userId === record.userId && 
      format(new Date(r.date), 'yyyy-MM-dd') === format(new Date(record.date), 'yyyy-MM-dd')
    );
    
    if (existingIndex >= 0) {
      // Update existing record
      records[existingIndex] = record;
      logger.debug(`Updated existing TOIL record for ${format(record.date, 'yyyy-MM-dd')}`);
    } else {
      // Add new record
      records.push(record);
      logger.debug(`Added new TOIL record for ${format(record.date, 'yyyy-MM-dd')}`);
    }
    
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(records));
    
    // Clear the summary cache for this month
    clearSummaryCache(record.userId, record.monthYear);
    
    return true;
  } catch (error) {
    logger.error('Error storing TOIL record:', error);
    return false;
  }
}

// Store TOIL usage
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    const usages = loadTOILUsage();
    usages.push(usage);
    localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usages));
    
    // Clear the summary cache for this month
    clearSummaryCache(usage.userId, usage.monthYear);
    
    return true;
  } catch (error) {
    logger.error('Error storing TOIL usage:', error);
    return false;
  }
}

// Delete a TOIL record associated with a specific entry ID
export async function deleteTOILRecordByEntryId(entryId: string): Promise<boolean> {
  try {
    if (!entryId) {
      logger.error('No entry ID provided for TOIL record deletion');
      return false;
    }
    
    const allRecords = loadTOILRecords();
    const recordIndex = allRecords.findIndex(record => record.entryId === entryId);
    
    if (recordIndex === -1) {
      logger.debug(`No TOIL record found for entry ID ${entryId}`);
      return false;
    }
    
    // Store the user and month before deletion for cache clearing
    const { userId, monthYear } = allRecords[recordIndex];
    
    // Remove the record
    allRecords.splice(recordIndex, 1);
    
    // Save the updated records
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(allRecords));
    
    // Clear the summary cache
    clearSummaryCache(userId, monthYear);
    
    logger.debug(`Deleted TOIL record for entry ID ${entryId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting TOIL record:', error);
    return false;
  }
}
