
import { 
  TOILRecord, TOILSummary, TOILUsage 
} from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { 
  clearSummaryCache,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage,
  storeTOILRecord,
  storeTOILUsage,
  loadTOILRecords,
  loadTOILUsage,
  getTOILSummary as getStorageTOILSummary
} from "./storage/index";
import { calculateTOILHours } from "./calculation";
import { queueTOILCalculation, processTOILQueue } from "./batch-processing";
import { dispatchTOILEvent } from "./events";
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('TOILService');

// Add debouncing for TOIL operations
let lastTOILOperationTime = 0;
const DEBOUNCE_TIME = 500; // ms

// TOIL Service class for managing TOIL calculations and storage
export class TOILService {
  private calculationQueueEnabled: boolean = true;
  
  constructor(calculationQueueEnabled: boolean = true) {
    this.calculationQueueEnabled = calculationQueueEnabled;
    
    // Log constructor initialization
    logger.debug(`TOILService initialized with calculationQueueEnabled=${calculationQueueEnabled}`);
  }
  
  // Clear all TOIL-related caches
  public clearCache(): void {
    try {
      logger.debug('Clearing TOIL cache');
      console.log('[TOILService] Clearing TOIL cache');
      
      // Clear all summary caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOIL_SUMMARY_CACHE_KEY)) {
          localStorage.removeItem(key);
          logger.debug(`Removed cache key: ${key}`);
          console.log(`[TOILService] Removed cache key: ${key}`);
        }
      }
      
      logger.debug('TOIL cache cleared successfully');
      console.log('[TOILService] TOIL cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing TOIL cache:', error);
      console.error('[TOILService] Error clearing TOIL cache:', error);
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
      console.log(`[TOILService] calculateAndStoreTOIL called with ${entries.length} entries for user ${userId}`);
      
      // Apply debouncing to prevent duplicate calculations
      const now = Date.now();
      if (now - lastTOILOperationTime < DEBOUNCE_TIME) {
        logger.debug('Skipping duplicate TOIL calculation due to debounce');
        console.log('[TOILService] Skipping duplicate TOIL calculation due to debounce');
        return this.getTOILSummary(userId, format(date, 'yyyy-MM'));
      }
      lastTOILOperationTime = now;
      
      logger.debug(`calculateAndStoreTOIL called for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
      
      // Validate inputs
      if (!entries || entries.length === 0) {
        logger.debug('No entries to calculate TOIL for');
        console.log('[TOILService] No entries to calculate TOIL for');
        return null;
      }
      
      if (!userId) {
        logger.error('Missing userId for TOIL calculation');
        console.error('[TOILService] Missing userId for TOIL calculation');
        return null;
      }
      
      if (!workSchedule) {
        logger.error('Missing workSchedule for TOIL calculation');
        console.error('[TOILService] Missing workSchedule for TOIL calculation');
        return null;
      }
      
      // Enhanced logging for debugging
      logger.debug(`Processing ${entries.length} entries for TOIL calculation`);
      console.log(`[TOILService] Processing ${entries.length} entries for TOIL calculation`);
      
      // Filter out synthetic TOIL entries to prevent circular calculation
      const nonToilEntries = entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
      console.log(`[TOILService] Filtered to ${nonToilEntries.length} non-TOIL entries`);
      
      if (nonToilEntries.length === 0) {
        logger.debug('Only synthetic TOIL entries found, skipping TOIL calculation');
        console.log('[TOILService] Only synthetic TOIL entries found, skipping TOIL calculation');
        return this.getTOILSummary(userId, format(date, 'yyyy-MM'));
      }
      
      const monthYear = format(date, 'yyyy-MM');
      
      // Calculate TOIL hours based on real entries, not synthetic ones
      const toilHours = calculateTOILHours(nonToilEntries, date, workSchedule, holidays);
      
      logger.debug(`TOIL hours calculated: ${toilHours}`);
      console.log(`[TOILService] TOIL hours calculated: ${toilHours}`);
      
      if (toilHours === 0) {
        logger.debug('No TOIL hours calculated');
        console.log('[TOILService] No TOIL hours calculated');
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
      
      logger.debug(`Created TOIL record: ${JSON.stringify(toilRecord)}`);
      console.log(`[TOILService] Created TOIL record: ${JSON.stringify(toilRecord)}`);
      
      // Store the TOIL record using our enhanced function
      const stored = await storeTOILRecord(toilRecord);
      
      if (!stored) {
        logger.error('Failed to store TOIL record');
        console.error('[TOILService] Failed to store TOIL record');
        return null;
      }
      
      logger.debug('TOIL record stored successfully, cleaning up duplicates');
      console.log('[TOILService] TOIL record stored successfully, cleaning up duplicates');
      
      // Run cleanup to remove any duplicate entries
      await cleanupDuplicateTOILRecords(userId);
      
      // Get updated summary
      const summary = this.getTOILSummary(userId, monthYear);
      
      logger.debug(`Updated TOIL summary: ${JSON.stringify(summary)}`);
      console.log(`[TOILService] Updated TOIL summary: ${JSON.stringify(summary)}`);
      
      // Dispatch TOIL update event
      dispatchTOILEvent(summary);
      
      return summary;
    } catch (error) {
      logger.error(`Error in calculateAndStoreTOIL: ${error instanceof Error ? error.message : String(error)}`, error);
      console.error(`[TOILService] Error in calculateAndStoreTOIL: ${error instanceof Error ? error.message : String(error)}`, error);
      return null;
    }
  }

  // Get TOIL summary for a user and month - use the unified function from queries.ts
  public getTOILSummary(userId: string, monthYear: string): TOILSummary {
    try {
      logger.debug(`Getting TOIL summary for user ${userId}, month ${monthYear}`);
      console.log(`[TOILService] Getting TOIL summary for user ${userId}, month ${monthYear}`);
      
      // Use the unified implementation from storage/queries.ts
      const summary = getStorageTOILSummary(userId, monthYear);
      
      logger.debug(`TOIL service returning summary for ${userId} - ${monthYear}:`, summary);
      console.log(`[TOILService] TOIL service returning summary for ${userId} - ${monthYear}:`, summary);
      
      // Extra validation to catch potential issues
      if (summary) {
        const { accrued, used, remaining } = summary;
        
        // Check for NaN or invalid values
        if (isNaN(accrued) || isNaN(used) || isNaN(remaining)) {
          logger.error(`Invalid numeric values in TOIL summary: accrued=${accrued}, used=${used}, remaining=${remaining}`);
          console.error(`[TOILService] Invalid numeric values in TOIL summary: accrued=${accrued}, used=${used}, remaining=${remaining}`);
          
          // Return a corrected summary
          return {
            userId,
            monthYear,
            accrued: isFinite(accrued) ? accrued : 0,
            used: isFinite(used) ? used : 0,
            remaining: isFinite(remaining) ? remaining : 0
          };
        }
      }
      
      return summary;
    } catch (error) {
      logger.error(`Error getting TOIL summary from service: ${error instanceof Error ? error.message : String(error)}`, error);
      console.error(`[TOILService] Error getting TOIL summary: ${error instanceof Error ? error.message : String(error)}`, error);
      
      // Return a valid but empty summary on error
      return {
        userId,
        monthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      };
    }
  }

  // Record TOIL usage - IMPROVED with duplicate prevention
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    try {
      console.log(`[TOILService] recordTOILUsage called for entry ID: ${entry?.id}`);
      
      // Apply debouncing to prevent duplicate calculations
      const now = Date.now();
      if (now - lastTOILOperationTime < DEBOUNCE_TIME) {
        logger.debug('Skipping duplicate TOIL usage record due to debounce');
        console.log('[TOILService] Skipping duplicate TOIL usage record due to debounce');
        return true;
      }
      lastTOILOperationTime = now;
      
      logger.debug(`Recording TOIL usage for entry: ${entry?.id}`);
      
      if (!entry) {
        logger.error('No entry provided for TOIL usage');
        console.error('[TOILService] No entry provided for TOIL usage');
        return false;
      }
      
      // Skip if this entry is not a TOIL entry
      if (entry.jobNumber !== "TOIL") {
        logger.debug('Entry is not a TOIL entry, skipping usage recording');
        console.log('[TOILService] Entry is not a TOIL entry, skipping usage recording');
        return false;
      }
      
      if (!entry.userId || !entry.date || typeof entry.hours !== 'number') {
        logger.error('Invalid TOIL entry data', { 
          hasUserId: !!entry.userId, 
          hasDate: !!entry.date, 
          hours: entry.hours 
        });
        console.error('[TOILService] Invalid TOIL entry data', { 
          hasUserId: !!entry.userId, 
          hasDate: !!entry.date, 
          hours: entry.hours 
        });
        return false;
      }
      
      // Enhanced error checking for TOIL usage amount
      if (entry.hours <= 0) {
        logger.error(`Invalid TOIL usage hours: ${entry.hours}. Must be positive.`);
        console.error(`[TOILService] Invalid TOIL usage hours: ${entry.hours}. Must be positive.`);
        return false;
      }
      
      // Check if this is a duplicate operation by looking for existing usage
      const existingUsages = loadTOILUsage().filter(u => u.entryId === entry.id);
      
      if (existingUsages.length > 0) {
        logger.debug(`TOIL usage already recorded for entry ${entry.id}, skipping duplicate`);
        console.log(`[TOILService] TOIL usage already recorded for entry ${entry.id}, skipping duplicate`);
        
        // Clean up any duplicate entries while we're here
        await cleanupDuplicateTOILUsage(entry.userId);
        return true;
      }
      
      logger.debug(`Creating new TOIL usage record for ${entry.hours} hours`);
      console.log(`[TOILService] Creating new TOIL usage record for ${entry.hours} hours`);
      
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entry.date instanceof Date ? entry.date : new Date(entry.date),
        hours: entry.hours,
        entryId: entry.id,
        monthYear: format(entry.date instanceof Date ? entry.date : new Date(entry.date), 'yyyy-MM')
      };
      
      // Use the improved storage function that prevents duplicates
      const stored = await storeTOILUsage(usage);
      console.log(`[TOILService] TOIL usage storage result: ${stored}`);
      
      if (stored) {
        logger.debug('TOIL usage stored successfully');
        
        // Get updated summary
        const summary = this.getTOILSummary(entry.userId, usage.monthYear);
        
        // Dispatch TOIL update event
        dispatchTOILEvent(summary);
        
        logger.debug(`Updated TOIL summary after usage recorded: ${JSON.stringify(summary)}`);
        console.log(`[TOILService] Updated TOIL summary after usage recorded: ${JSON.stringify(summary)}`);
      } else {
        logger.error('Failed to store TOIL usage');
        console.error('[TOILService] Failed to store TOIL usage');
      }
      
      return stored;
    } catch (error) {
      logger.error(`Error recording TOIL usage: ${error instanceof Error ? error.message : String(error)}`, error);
      console.error(`[TOILService] Error recording TOIL usage: ${error instanceof Error ? error.message : String(error)}`, error);
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
    logger.debug(`Queueing TOIL calculation for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
    console.log(`[TOILService] Queueing TOIL calculation for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
    
    if (!this.calculationQueueEnabled) {
      logger.warn('TOIL calculation queue is disabled, processing immediately');
      console.warn('[TOILService] TOIL calculation queue is disabled, processing immediately');
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
      logger.debug(`Processing TOIL calculation for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
      console.log(`[TOILService] Processing TOIL calculation for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
      
      // Apply debouncing to prevent duplicate calculations
      const now = Date.now();
      if (now - lastTOILOperationTime < DEBOUNCE_TIME) {
        logger.debug('Skipping duplicate TOIL calculation due to debounce');
        console.log('[TOILService] Skipping duplicate TOIL calculation due to debounce');
        resolve(this.getTOILSummary(userId, format(date, 'yyyy-MM')));
        return;
      }
      lastTOILOperationTime = now;
      
      const monthYear = format(date, 'yyyy-MM');
      
      // Filter out synthetic TOIL entries to prevent circular calculation
      const nonToilEntries = entries.filter(entry => !(entry.jobNumber === "TOIL" && entry.synthetic === true));
      console.log(`[TOILService] Processing ${nonToilEntries.length} non-TOIL entries for calculation`);
      
      if (nonToilEntries.length === 0) {
        logger.debug('Only synthetic TOIL entries found, skipping TOIL calculation');
        console.log('[TOILService] Only synthetic TOIL entries found, skipping TOIL calculation');
        resolve(this.getTOILSummary(userId, monthYear));
        return;
      }
      
      // Calculate TOIL hours
      const toilHours = calculateTOILHours(nonToilEntries, date, workSchedule, holidays);
      
      logger.debug(`TOIL hours calculated: ${toilHours}`);
      console.log(`[TOILService] TOIL hours calculated: ${toilHours}`);
      
      if (toilHours === 0) {
        logger.debug('No TOIL hours calculated');
        console.log('[TOILService] No TOIL hours calculated');
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
      
      logger.debug(`Created TOIL record: ${JSON.stringify(toilRecord)}`);
      console.log(`[TOILService] Created TOIL record: ${JSON.stringify(toilRecord)}`);
      
      // Store the TOIL record
      this.storeTOILRecord(toilRecord)
        .then(stored => {
          if (!stored) {
            logger.error('Failed to store TOIL record');
            console.error('[TOILService] Failed to store TOIL record');
            resolve(null);
            return;
          }
          
          logger.debug('TOIL record stored successfully');
          console.log('[TOILService] TOIL record stored successfully');
          
          // Run cleanup
          cleanupDuplicateTOILRecords(userId)
            .then(() => {
              logger.debug('Duplicate TOIL records cleaned up');
              console.log('[TOILService] Duplicate TOIL records cleaned up');
              
              // Get updated summary
              const summary = this.getTOILSummary(userId, monthYear);
              
              // Dispatch TOIL update event
              dispatchTOILEvent(summary);
              
              logger.debug(`TOIL calculation complete. Summary: ${JSON.stringify(summary)}`);
              console.log(`[TOILService] TOIL calculation complete. Summary: ${JSON.stringify(summary)}`);
              
              resolve(summary);
            })
            .catch(error => {
              logger.error('Error cleaning up duplicate TOIL records:', error);
              console.error('[TOILService] Error cleaning up duplicate TOIL records:', error);
              resolve(null);
            });
        })
        .catch(error => {
          logger.error('Error storing TOIL record:', error);
          console.error('[TOILService] Error storing TOIL record:', error);
          resolve(null);
        });
    } catch (error) {
      logger.error(`Error in processCalculation: ${error instanceof Error ? error.message : String(error)}`, error);
      console.error(`[TOILService] Error in processCalculation: ${error instanceof Error ? error.message : String(error)}`, error);
      resolve(null);
    }
  }
  
  // Private method to store TOIL record
  private async storeTOILRecord(record: TOILRecord): Promise<boolean> {
    try {
      logger.debug(`Storing TOIL record: ${JSON.stringify(record)}`);
      console.log(`[TOILService] Storing TOIL record: ${JSON.stringify(record)}`);
      return storeTOILRecord(record);
    } catch (error) {
      logger.error(`Error in storeTOILRecord: ${error instanceof Error ? error.message : String(error)}`, error);
      console.error(`[TOILService] Error in storeTOILRecord: ${error instanceof Error ? error.message : String(error)}`, error);
      return false;
    }
  }
}

// Export a singleton instance of the TOILService
export const toilService = new TOILService();

// Start processing the queue
processTOILQueue();
