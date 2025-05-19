import { TOILRecord } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";
import { TOIL_RECORDS_KEY } from "./constants";
import { loadTOILRecords } from "./core";

const logger = createTimeLogger('TOIL-Storage-Cleanup');

/**
 * Cleanup duplicate TOIL records by consolidating records for the same user on the same day
 * 
 * @returns Promise that resolves to number of records removed
 */
export async function cleanupDuplicateTOILRecords(): Promise<number> {
  try {
    // Load all TOIL records
    const allRecords = loadTOILRecords();
    const originalCount = allRecords.length;
    
    if (originalCount === 0) {
      logger.debug('No TOIL records found, nothing to clean up');
      return 0;
    }
    
    // Group records by user/date combination
    const recordsByDateUser = new Map<string, TOILRecord[]>();
    
    for (const record of allRecords) {
      // Create a key for each unique user/date combination
      const date = new Date(record.date);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const key = `${record.userId}_${dateKey}`;
      
      // Add to the group or create a new group
      const group = recordsByDateUser.get(key) || [];
      group.push(record);
      recordsByDateUser.set(key, group);
    }
    
    // Consolidate duplicate records
    const consolidatedRecords: TOILRecord[] = [];
    
    for (const [key, records] of recordsByDateUser.entries()) {
      if (records.length === 1) {
        // No duplicates, keep the record as is
        consolidatedRecords.push(records[0]);
        continue;
      }
      
      // Sort records by hours (descending)
      records.sort((a, b) => b.hours - a.hours);
      
      // Keep the record with the highest hours
      const bestRecord = records[0];
      
      logger.debug(
        `Found ${records.length} duplicate records for ${key}, ` +
        `keeping record with id=${bestRecord.id} and ${bestRecord.hours} hours`
      );
      
      consolidatedRecords.push(bestRecord);
    }
    
    // Save consolidated records
    localStorage.setItem(TOIL_RECORDS_KEY, JSON.stringify(consolidatedRecords));
    
    const removed = originalCount - consolidatedRecords.length;
    logger.debug(`Removed ${removed} duplicate TOIL records, ${consolidatedRecords.length} records remaining`);
    
    return removed;
  } catch (error) {
    logger.error(`Error cleaning up duplicate TOIL records: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}
