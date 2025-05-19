
import { TOILRecord, TOILUsage } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { loadTOILRecords, loadTOILUsage } from "./core";
import { TOIL_RECORDS_KEY, TOIL_USAGE_KEY } from "./constants";

const logger = createTimeLogger('TOIL-Cleanup');

/**
 * Clean up duplicate TOIL records
 * @param userId User ID to clean records for
 * @returns Array of cleaned records
 */
export function cleanupDuplicateTOILRecords(userId: string): TOILRecord[] {
  try {
    const records = loadTOILRecords(userId);
    
    if (!records || records.length === 0) {
      return [];
    }
    
    logger.debug(`Checking ${records.length} TOIL records for duplicates`);
    
    // Track seen record IDs to detect duplicates
    const seen = new Set<string>();
    const uniqueRecords = [];
    const duplicates = [];
    
    for (const record of records) {
      if (seen.has(record.id)) {
        duplicates.push(record.id);
      } else {
        seen.add(record.id);
        uniqueRecords.push(record);
      }
    }
    
    if (duplicates.length > 0) {
      logger.warn(`Found ${duplicates.length} duplicate TOIL records`);
      
      // Get all records and replace user's records with deduped ones
      const allRecords = JSON.parse(localStorage.getItem(TOIL_RECORDS_KEY) || '[]');
      const otherUserRecords = allRecords.filter((r: TOILRecord) => r.userId !== userId);
      const updatedRecords = [...otherUserRecords, ...uniqueRecords];
      
      localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(updatedRecords));
      logger.debug(`Removed ${duplicates.length} duplicate records`);
    } else {
      logger.debug('No duplicate TOIL records found');
    }
    
    return uniqueRecords;
  } catch (error) {
    logger.error('Error cleaning up duplicate TOIL records:', error);
    return [];
  }
}
