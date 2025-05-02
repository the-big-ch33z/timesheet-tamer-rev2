
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
import { dispatchTOILEvent } from "../events";

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
      logger.debug(`Updated existing TOIL record for ${format(new Date(record.date), 'yyyy-MM-dd')}`);
    } else {
      // Add new record
      records.push(record);
      logger.debug(`Added new TOIL record for ${format(new Date(record.date), 'yyyy-MM-dd')}`);
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

// Store TOIL usage - FIXED to prevent duplicates
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    const usages = loadTOILUsage();
    
    // Check for existing usage for the same entry
    const existingIndex = usages.findIndex(u => u.entryId === usage.entryId);
    if (existingIndex >= 0) {
      // Update existing usage
      usages[existingIndex] = usage;
      logger.debug(`Updated existing TOIL usage for entry ${usage.entryId}`);
    } else {
      // Check for duplicate by date and userId to avoid multiple usage entries for same day
      const sameDay = usages.find(u => 
        u.userId === usage.userId && 
        format(new Date(u.date), 'yyyy-MM-dd') === format(new Date(usage.date), 'yyyy-MM-dd') &&
        Math.abs(u.hours - usage.hours) < 0.01 // Same hours (within tolerance)
      );
      
      if (sameDay) {
        logger.debug(`Skipping duplicate TOIL usage for same day: ${format(new Date(usage.date), 'yyyy-MM-dd')}`);
        return true; // Consider it stored successfully (prevents duplicates)
      }
      
      // Add new usage
      usages.push(usage);
      logger.debug(`Added new TOIL usage record for entry ${usage.entryId}`);
    }
    
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
    
    // Also check for usage records - FIX: deleting the TOIL entry should delete the usage
    const allUsages = loadTOILUsage();
    const usageIndex = allUsages.findIndex(usage => usage.entryId === entryId);
    
    let deleted = false;
    let userId = '';
    let monthYear = '';
    
    // Handle TOIL record deletion
    if (recordIndex !== -1) {
      // Store the user and month before deletion for cache clearing
      userId = allRecords[recordIndex].userId;
      monthYear = allRecords[recordIndex].monthYear;
      
      // Remove the record
      allRecords.splice(recordIndex, 1);
      
      // Save the updated records
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(allRecords));
      
      deleted = true;
      logger.debug(`Deleted TOIL record for entry ID ${entryId}`);
    }
    
    // Handle TOIL usage deletion
    if (usageIndex !== -1) {
      // If we didn't get userId/monthYear from record, get it from usage
      if (!userId) {
        userId = allUsages[usageIndex].userId;
        monthYear = allUsages[usageIndex].monthYear;
      }
      
      // Remove the usage entry
      allUsages.splice(usageIndex, 1);
      
      // Save the updated usages
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(allUsages));
      
      deleted = true;
      logger.debug(`Deleted TOIL usage for entry ID ${entryId}`);
    }
    
    // Clear the summary cache if we deleted something
    if (deleted && userId && monthYear) {
      clearSummaryCache(userId, monthYear);
      
      // Get updated summary to send with the event
      const summary = {
        userId,
        monthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      };
      
      // Dispatch updated summary event
      dispatchTOILEvent(summary);
      
      return true;
    }
    
    return deleted;
  } catch (error) {
    logger.error('Error deleting TOIL record:', error);
    return false;
  }
}
