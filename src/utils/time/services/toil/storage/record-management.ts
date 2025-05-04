
import { TOILRecord, TOILUsage } from "@/types/toil";
import { format } from "date-fns";
import { createTimeLogger } from "../../../errors/timeLogger";
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from "./constants";

const logger = createTimeLogger('TOILStorage');

/**
 * Load TOIL records from localStorage with enhanced error handling and logging
 */
export function loadTOILRecords(): TOILRecord[] {
  try {
    logger.debug('Loading TOIL records from localStorage');
    
    const recordsString = localStorage.getItem(TOIL_RECORDS_KEY);
    if (!recordsString) {
      logger.debug('No TOIL records found in localStorage');
      return [];
    }
    
    const records = JSON.parse(recordsString);
    if (!Array.isArray(records)) {
      logger.error('Invalid TOIL records data structure:', records);
      return [];
    }
    
    // Convert date strings to Date objects
    const convertedRecords = records.map(record => ({
      ...record,
      date: record.date instanceof Date ? record.date : new Date(record.date)
    }));
    
    logger.debug(`Successfully loaded ${convertedRecords.length} TOIL records`);
    return convertedRecords;
    
  } catch (error) {
    logger.error('Error loading TOIL records:', error);
    return [];
  }
}

/**
 * Load TOIL usage records from localStorage with enhanced error handling and logging
 */
export function loadTOILUsage(): TOILUsage[] {
  try {
    logger.debug('Loading TOIL usage from localStorage');
    
    const usageString = localStorage.getItem(TOIL_USAGE_KEY);
    if (!usageString) {
      logger.debug('No TOIL usage found in localStorage');
      return [];
    }
    
    const usages = JSON.parse(usageString);
    if (!Array.isArray(usages)) {
      logger.error('Invalid TOIL usage data structure:', usages);
      return [];
    }
    
    // Convert date strings to Date objects
    const convertedUsages = usages.map(usage => ({
      ...usage,
      date: usage.date instanceof Date ? usage.date : new Date(usage.date)
    }));
    
    logger.debug(`Successfully loaded ${convertedUsages.length} TOIL usage records`);
    return convertedUsages;
    
  } catch (error) {
    logger.error('Error loading TOIL usage:', error);
    return [];
  }
}

/**
 * Store a TOIL record with enhanced error handling and logging
 */
export async function storeTOILRecord(record: TOILRecord): Promise<boolean> {
  try {
    logger.debug(`Storing TOIL record: ${format(record.date, 'yyyy-MM-dd')} - ${record.hours} hours`);
    
    if (!record || !record.userId || !record.date || record.hours === undefined) {
      logger.error('Invalid TOIL record:', record);
      return false;
    }
    
    // Get existing records first
    const existingRecords = loadTOILRecords();
    
    // Check for duplicates - same user, date, hours and status
    const isDuplicate = existingRecords.some(r => 
      r.userId === record.userId && 
      format(r.date, 'yyyy-MM-dd') === format(record.date, 'yyyy-MM-dd') &&
      r.hours === record.hours &&
      r.status === record.status
    );
    
    if (isDuplicate) {
      logger.debug('Skipping duplicate TOIL record');
      return true; // Consider this a success to prevent multiple attempts
    }
    
    // Add the new record
    existingRecords.push(record);
    
    // Save back to localStorage
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(existingRecords));
    
    logger.debug(`TOIL record stored successfully, total records: ${existingRecords.length}`);
    
    // Check storage was successful by reading back
    const verifyRecords = loadTOILRecords();
    const verified = verifyRecords.some(r => r.id === record.id);
    
    if (!verified) {
      logger.error('TOIL record verification failed - could not find record after saving');
      return false;
    }
    
    return true;
    
  } catch (error) {
    logger.error('Error storing TOIL record:', error);
    return false;
  }
}

/**
 * Store a TOIL usage record with enhanced error handling and logging
 */
export async function storeTOILUsage(usage: TOILUsage): Promise<boolean> {
  try {
    logger.debug(`Storing TOIL usage: ${format(usage.date, 'yyyy-MM-dd')} - ${usage.hours} hours`);
    
    if (!usage || !usage.userId || !usage.date || usage.hours === undefined) {
      logger.error('Invalid TOIL usage:', usage);
      return false;
    }
    
    // Get existing usage records first
    const existingUsages = loadTOILUsage();
    
    // Check for duplicates
    const isDuplicate = existingUsages.some(u => 
      u.entryId === usage.entryId || 
      (u.userId === usage.userId && 
       format(u.date, 'yyyy-MM-dd') === format(usage.date, 'yyyy-MM-dd') &&
       u.hours === usage.hours)
    );
    
    if (isDuplicate) {
      logger.debug('Skipping duplicate TOIL usage');
      return true; // Consider this a success to prevent multiple attempts
    }
    
    // Add the new usage record
    existingUsages.push(usage);
    
    // Save back to localStorage
    localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(existingUsages));
    
    logger.debug(`TOIL usage stored successfully, total records: ${existingUsages.length}`);
    
    // Verify storage was successful
    const verifyUsages = loadTOILUsage();
    const verified = verifyUsages.some(u => u.id === usage.id);
    
    if (!verified) {
      logger.error('TOIL usage verification failed - could not find record after saving');
      return false;
    }
    
    return true;
    
  } catch (error) {
    logger.error('Error storing TOIL usage:', error);
    return false;
  }
}
