
import { 
  TOILRecord, TOILSummary, TOILUsage 
} from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { 
  loadTOILRecords, 
  loadTOILUsage,
  clearSummaryCache,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage
} from "./storage";
import { calculateTOILHours } from "./calculation";
import { queueTOILCalculation, processTOILQueue } from "./batch-processing";
import { dispatchTOILEvent } from "./events";
import { createTimeLogger } from "../../errors/timeLogger";
import { storeTOILRecord, storeTOILUsage } from "./storage/record-management";

const logger = createTimeLogger('TOILService');

// Add debouncing for TOIL operations
let lastTOILOperationTime = 0;
const DEBOUNCE_TIME = 500; // ms

// TOIL Service class for managing TOIL calculations and storage
export class TOILService {
  private calculationQueueEnabled: boolean = true;
  
  constructor(calculationQueueEnabled: boolean = true) {
    this.calculationQueueEnabled = calculationQueueEnabled;
  }
  
  // Clear all TOIL-related caches
  public clearCache(): void {
    try {
      // Don't remove stored records, just clear the cache
      // localStorage.removeItem(TOIL_RECORDS_KEY);
      // localStorage.removeItem(TOIL_USAGE_KEY);
      
      // Clear all summary caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOIL_SUMMARY_CACHE_KEY)) {
          localStorage.removeItem(key);
        }
      }
      
      logger.debug('TOIL cache cleared');
    } catch (error) {
      logger.error('Error clearing TOIL cache:', error);
    }
  }

  // Calculate and store TOIL for a given day
  public async calculateAndStoreTOIL(
    entries: TimeEntry[],
    date: Date,
    userId: string,
    workSchedule: WorkSchedule,
    holidays: Holiday[]
  ): Promise<TOILSummary | null> {
    try {
      // Apply debouncing to prevent duplicate calculations
      const now = Date.now();
      if (now - lastTOILOperationTime < DEBOUNCE_TIME) {
        logger.debug('Skipping duplicate TOIL calculation due to debounce');
        return this.getTOILSummary(userId, format(date, 'yyyy-MM'));
      }
      lastTOILOperationTime = now;
      
      if (!entries || entries.length === 0) {
        logger.debug('No entries to calculate TOIL for');
        return null;
      }
      
      // Filter out synthetic TOIL entries to prevent circular calculation
      const nonToilEntries = entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
      
      if (nonToilEntries.length === 0) {
        logger.debug('Only synthetic TOIL entries found, skipping TOIL calculation');
        return this.getTOILSummary(userId, format(date, 'yyyy-MM'));
      }
      
      const monthYear = format(date, 'yyyy-MM');
      
      // Calculate TOIL hours based on real entries, not synthetic ones
      const toilHours = calculateTOILHours(nonToilEntries, date, workSchedule, holidays);
      
      if (toilHours === 0) {
        logger.debug('No TOIL hours calculated');
        return this.getTOILSummary(userId, monthYear); // Return existing summary
      }
      
      // Create a new TOIL record
      const toilRecord: TOILRecord = {
        id: uuidv4(),
        userId: userId,
        date: date,
        hours: toilHours,
        monthYear: monthYear,
        entryId: nonToilEntries[0].id, // Reference first entry for simplicity
        status: 'active'
      };
      
      // Store the TOIL record using our enhanced function
      const stored = await storeTOILRecord(toilRecord);
      
      if (!stored) {
        logger.error('Failed to store TOIL record');
        return null;
      }
      
      // Run cleanup to remove any duplicate entries
      await cleanupDuplicateTOILRecords(userId);
      
      // Get updated summary
      const summary = this.getTOILSummary(userId, monthYear);
      
      // Dispatch TOIL update event
      dispatchTOILEvent(summary);
      
      return summary;
    } catch (error) {
      logger.error('Error calculating and storing TOIL:', error);
      return null;
    }
  }

  // Get TOIL summary for a user and month
  public getTOILSummary(userId: string, monthYear: string): TOILSummary | null {
    try {
      const records = loadTOILRecords();
      const usages = loadTOILUsage();
      
      // Filter records and usages for the specified user and month
      const userRecords = records.filter(record => record.userId === userId && record.monthYear === monthYear);
      const userUsages = usages.filter(usage => usage.userId === userId && usage.monthYear === monthYear);
      
      // Calculate total accrued and used hours
      const accrued = userRecords.reduce((sum, record) => sum + record.hours, 0);
      const used = userUsages.reduce((sum, usage) => sum + usage.hours, 0);
      const remaining = accrued - used;
      
      const summary: TOILSummary = {
        userId: userId,
        monthYear: monthYear,
        accrued: accrued,
        used: used,
        remaining: remaining
      };
      
      logger.debug(`TOIL summary for ${userId} - ${monthYear}:`, summary);
      return summary;
    } catch (error) {
      logger.error('Error getting TOIL summary:', error);
      return null;
    }
  }

  // Record TOIL usage - IMPROVED with duplicate prevention
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    try {
      // Apply debouncing to prevent duplicate calculations
      const now = Date.now();
      if (now - lastTOILOperationTime < DEBOUNCE_TIME) {
        logger.debug('Skipping duplicate TOIL usage record due to debounce');
        return true;
      }
      lastTOILOperationTime = now;
      
      if (!entry) {
        logger.error('No entry provided for TOIL usage');
        return false;
      }
      
      // Skip if this entry is not a TOIL entry
      if (entry.jobNumber !== "TOIL") {
        logger.debug('Entry is not a TOIL entry, skipping usage recording');
        return false;
      }
      
      // Check if this is a duplicate operation by looking for existing usage
      const existingUsages = loadTOILUsage().filter(u => u.entryId === entry.id);
      
      if (existingUsages.length > 0) {
        logger.debug(`TOIL usage already recorded for entry ${entry.id}, skipping duplicate`);
        
        // Clean up any duplicate entries while we're here
        await cleanupDuplicateTOILUsage(entry.userId);
        return true;
      }
      
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entry.date,
        hours: entry.hours,
        entryId: entry.id,
        monthYear: format(entry.date, 'yyyy-MM')
      };
      
      // Use the improved storage function that prevents duplicates
      const stored = await storeTOILUsage(usage);
      
      if (stored) {
        // Get updated summary
        const summary = await this.getTOILSummary(entry.userId, usage.monthYear);
        
        // Dispatch TOIL update event
        dispatchTOILEvent(summary);
      }
      
      return stored;
    } catch (error) {
      logger.error('Error recording TOIL usage:', error);
      return false;
    }
  }

  // Queue TOIL calculation
  public queueCalculation(
    userId: string,
    date: Date,
    entries: TimeEntry[],
    workSchedule: WorkSchedule,
    holidays: Holiday[],
    resolve: (summary: TOILSummary | null) => void
  ): void {
    if (!this.calculationQueueEnabled) {
      logger.warn('TOIL calculation queue is disabled, processing immediately');
      this.processCalculation(userId, date, entries, workSchedule, holidays, resolve);
      return;
    }
    
    queueTOILCalculation({
      userId,
      date,
      entries,
      workSchedule,
      holidays,
      resolve
    });
  }

  // Process TOIL calculation immediately
  private processCalculation(
    userId: string,
    date: Date,
    entries: TimeEntry[],
    workSchedule: WorkSchedule,
    holidays: Holiday[],
    resolve: (summary: TOILSummary | null) => void
  ): void {
    try {
      // Apply debouncing to prevent duplicate calculations
      const now = Date.now();
      if (now - lastTOILOperationTime < DEBOUNCE_TIME) {
        logger.debug('Skipping duplicate TOIL calculation due to debounce');
        resolve(this.getTOILSummary(userId, format(date, 'yyyy-MM')));
        return;
      }
      lastTOILOperationTime = now;
      
      const monthYear = format(date, 'yyyy-MM');
      
      // Filter out synthetic TOIL entries to prevent circular calculation
      const nonToilEntries = entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
      
      if (nonToilEntries.length === 0) {
        logger.debug('Only synthetic TOIL entries found, skipping TOIL calculation');
        resolve(this.getTOILSummary(userId, monthYear));
        return;
      }
      
      // Calculate TOIL hours
      const toilHours = calculateTOILHours(nonToilEntries, date, workSchedule, holidays);
      
      if (toilHours === 0) {
        logger.debug('No TOIL hours calculated');
        resolve(this.getTOILSummary(userId, monthYear)); // Resolve with existing summary
        return;
      }
      
      // Create a new TOIL record
      const toilRecord: TOILRecord = {
        id: uuidv4(),
        userId: userId,
        date: date,
        hours: toilHours,
        monthYear: monthYear,
        entryId: nonToilEntries[0].id, // Reference first entry for simplicity
        status: 'active'
      };
      
      // Store the TOIL record
      this.storeTOILRecord(toilRecord)
        .then(stored => {
          if (!stored) {
            logger.error('Failed to store TOIL record');
            resolve(null);
            return;
          }
          
          // Run cleanup
          cleanupDuplicateTOILRecords(userId)
            .then(() => {
              // Get updated summary
              const summary = this.getTOILSummary(userId, monthYear);
              
              // Dispatch TOIL update event
              dispatchTOILEvent(summary);
              
              resolve(summary);
            });
        })
        .catch(error => {
          logger.error('Error storing TOIL record:', error);
          resolve(null);
        });
    } catch (error) {
      logger.error('Error calculating and storing TOIL:', error);
      resolve(null);
    }
  }
  
  // Private method to store TOIL record
  private async storeTOILRecord(record: TOILRecord): Promise<boolean> {
    return storeTOILRecord(record);
  }
}

// Export a singleton instance of the TOILService
export const toilService = new TOILService();

// Start processing the queue
processTOILQueue();
