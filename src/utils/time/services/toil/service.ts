
import { 
  TOILRecord, TOILSummary, TOILUsage 
} from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { 
  clearSummaryCache,
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage,
  storeTOILRecord,
  storeTOILUsage,
  loadTOILRecords,
  loadTOILUsage,
  getTOILSummary as getStorageTOILSummary
} from "./storage/index";
import { 
  TOIL_RECORDS_KEY, 
  TOIL_USAGE_KEY, 
  TOIL_SUMMARY_CACHE_KEY,
  TOIL_PROCESSING_RECORDS_KEY,
  TOIL_MONTH_PROCESSING_STATE_KEY,
  TOIL_THRESHOLDS_KEY,
  DEBOUNCE_TIME
} from "./storage/constants";
import { calculateTOILHours } from "./calculation";
import { queueTOILCalculation, processTOILQueue } from "./batch-processing";
import { dispatchTOILEvent } from "./events";
import { createTimeLogger } from "../../errors/timeLogger";
import { ToilProcessingFormData, ToilProcessingRecord, ToilMonthProcessingState, ToilProcessingStatus, ToilThresholds } from "@/types/monthEndToil";

const logger = createTimeLogger('TOILService');

// Add debouncing for TOIL operations
let lastTOILOperationTime = 0;
const DEBOUNCE_TIME = 500; // ms

// Default thresholds
const DEFAULT_THRESHOLDS: ToilThresholds = {
  fullTime: 8,
  partTime: 6,
  casual: 4
};

// TOIL Service class for managing TOIL calculations and storage
export class TOILService {
  private calculationQueueEnabled: boolean = true;
  
  constructor(calculationQueueEnabled: boolean = true) {
    this.calculationQueueEnabled = calculationQueueEnabled;
    logger.debug(`TOILService initialized with calculationQueueEnabled=${calculationQueueEnabled}`);
  }
  
  // Clear all TOIL-related caches
  public clearCache(): void {
    try {
      logger.debug('Clearing TOIL cache');
      
      // Clear all summary caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(TOIL_SUMMARY_CACHE_KEY)) {
          localStorage.removeItem(key);
          logger.debug(`Removed cache key: ${key}`);
        }
      }
      
      clearSummaryCache();
      
      logger.debug('TOIL cache cleared successfully');
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
      
      logger.debug(`calculateAndStoreTOIL called for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
      
      // Validate inputs
      if (!entries || entries.length === 0) {
        logger.debug('No entries to calculate TOIL for');
        return null;
      }
      
      if (!userId) {
        logger.error('Missing userId for TOIL calculation');
        return null;
      }
      
      if (!workSchedule) {
        logger.error('Missing workSchedule for TOIL calculation');
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
      
      logger.debug(`TOIL hours calculated: ${toilHours}`);
      
      if (toilHours === 0) {
        logger.debug('No TOIL hours calculated');
        return this.getTOILSummary(userId, monthYear); // Return existing summary
      }
      
      // Create a new TOIL record
      const toilRecord: TOILRecord = {
        id: uuidv4(),
        userId: userId,
        date: new Date(date), // Ensure date is a Date object
        hours: toilHours,
        monthYear: monthYear,
        entryId: nonToilEntries[0].id, // Reference first entry for simplicity
        status: 'active'
      };
      
      logger.debug(`Created TOIL record: ${JSON.stringify(toilRecord)}`);
      
      // Store the TOIL record using our enhanced function
      const stored = await storeTOILRecord(toilRecord);
      
      if (!stored) {
        logger.error('Failed to store TOIL record');
        return null;
      }
      
      logger.debug('TOIL record stored successfully, cleaning up duplicates');
      
      // Run cleanup to remove any duplicate entries
      await cleanupDuplicateTOILRecords(userId);
      
      // Get updated summary
      const summary = this.getTOILSummary(userId, monthYear);
      
      logger.debug(`Updated TOIL summary: ${JSON.stringify(summary)}`);
      
      // Dispatch TOIL update event
      dispatchTOILEvent(summary);
      
      return summary;
    } catch (error) {
      logger.error(`Error in calculateAndStoreTOIL: ${error instanceof Error ? error.message : String(error)}`, error);
      return null;
    }
  }

  // Get TOIL summary for a user and month
  public getTOILSummary(userId: string, monthYear: string | Date): TOILSummary {
    try {
      // Normalize input to string format
      const normalizedMonthYear = monthYear instanceof Date 
        ? format(monthYear, 'yyyy-MM')
        : monthYear;
      
      logger.debug(`Getting TOIL summary for user ${userId}, month ${normalizedMonthYear}`);
      
      // Use the unified implementation from storage/queries.ts
      const summary = getStorageTOILSummary(userId, normalizedMonthYear);
      
      logger.debug(`TOIL service returning summary for ${userId} - ${normalizedMonthYear}:`, summary);
      
      // Extra validation to catch potential issues
      if (summary) {
        const { accrued, used, remaining } = summary;
        
        // Check for NaN or invalid values
        if (isNaN(accrued) || isNaN(used) || isNaN(remaining)) {
          logger.error(`Invalid numeric values in TOIL summary: accrued=${accrued}, used=${used}, remaining=${remaining}`);
          
          // Return a corrected summary
          return {
            userId,
            monthYear: normalizedMonthYear,
            accrued: isFinite(accrued) ? accrued : 0,
            used: isFinite(used) ? used : 0,
            remaining: isFinite(remaining) ? remaining : 0
          };
        }
      }
      
      return summary || {
        userId,
        monthYear: normalizedMonthYear,
        accrued: 0,
        used: 0,
        remaining: 0
      };
    } catch (error) {
      logger.error(`Error getting TOIL summary from service: ${error instanceof Error ? error.message : String(error)}`, error);
      
      // Return a valid but empty summary on error
      return {
        userId,
        monthYear: typeof monthYear === 'string' ? monthYear : format(monthYear, 'yyyy-MM'),
        accrued: 0,
        used: 0,
        remaining: 0
      };
    }
  }

  // Record TOIL usage
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    try {
      // Apply debouncing to prevent duplicate calculations
      const now = Date.now();
      if (now - lastTOILOperationTime < DEBOUNCE_TIME) {
        logger.debug('Skipping duplicate TOIL usage record due to debounce');
        return true;
      }
      lastTOILOperationTime = now;
      
      logger.debug(`Recording TOIL usage for entry: ${entry?.id}`);
      
      if (!entry) {
        logger.error('No entry provided for TOIL usage');
        return false;
      }
      
      // Skip if this entry is not a TOIL entry
      if (entry.jobNumber !== "TOIL") {
        logger.debug('Entry is not a TOIL entry, skipping usage recording');
        return false;
      }
      
      if (!entry.userId || !entry.date || typeof entry.hours !== 'number') {
        logger.error('Invalid TOIL entry data', { 
          hasUserId: !!entry.userId, 
          hasDate: !!entry.date, 
          hours: entry.hours 
        });
        return false;
      }
      
      // Enhanced error checking for TOIL usage amount
      if (entry.hours <= 0) {
        logger.error(`Invalid TOIL usage hours: ${entry.hours}. Must be positive.`);
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
      
      logger.debug(`Creating new TOIL usage record for ${entry.hours} hours`);
      
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
      
      if (stored) {
        logger.debug('TOIL usage stored successfully');
        
        // Get updated summary
        const summary = this.getTOILSummary(entry.userId, usage.monthYear);
        
        // Dispatch TOIL update event
        dispatchTOILEvent(summary);
        
        logger.debug(`Updated TOIL summary after usage recorded: ${JSON.stringify(summary)}`);
      } else {
        logger.error('Failed to store TOIL usage');
      }
      
      return stored;
    } catch (error) {
      logger.error(`Error recording TOIL usage: ${error instanceof Error ? error.message : String(error)}`, error);
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
  private async processCalculation(
    userId: string,
    date: Date,
    entries: TimeEntry[],
    workSchedule: WorkSchedule,
    holidays: Holiday[],
    resolve: (summary: TOILSummary | null) => void
  ): Promise<void> {
    try {
      logger.debug(`Processing TOIL calculation for user ${userId}, date: ${format(date, 'yyyy-MM-dd')}`);
      
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
      
      logger.debug(`TOIL hours calculated: ${toilHours}`);
      
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
      
      logger.debug(`Created TOIL record: ${JSON.stringify(toilRecord)}`);
      
      // Store the TOIL record
      const stored = await this.storeTOILRecord(toilRecord);
      
      if (!stored) {
        logger.error('Failed to store TOIL record');
        resolve(null);
        return;
      }
      
      // Run cleanup
      await cleanupDuplicateTOILRecords(userId);
      
      // Get updated summary - this is not a Promise, so no need for await
      const summary = this.getTOILSummary(userId, monthYear);
      
      // Dispatch TOIL update event
      dispatchTOILEvent(summary);
      
      resolve(summary);
    } catch (error) {
      logger.error(`Error in processCalculation: ${error instanceof Error ? error.message : String(error)}`, error);
      resolve(null);
    }
  }
  
  // Private method to store TOIL record
  private async storeTOILRecord(record: TOILRecord): Promise<boolean> {
    try {
      logger.debug(`Storing TOIL record: ${JSON.stringify(record)}`);
      return storeTOILRecord(record);
    } catch (error) {
      logger.error(`Error in storeTOILRecord: ${error instanceof Error ? error.message : String(error)}`, error);
      return false;
    }
  }

  // MONTH-END PROCESSING METHODS (Moved from ToilProcessingService)

  // Fetch TOIL processing records
  public fetchToilProcessingRecords(): ToilProcessingRecord[] {
    try {
      const records = localStorage.getItem(TOIL_PROCESSING_RECORDS_KEY);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      logger.error("Error fetching TOIL processing records:", error);
      return [];
    }
  }

  // Save TOIL processing records
  private saveToilProcessingRecords(records: ToilProcessingRecord[]): void {
    localStorage.setItem(TOIL_PROCESSING_RECORDS_KEY, JSON.stringify(records));
    logger.debug(`Saved ${records.length} TOIL processing records`);
  }

  // Get TOIL processing records for a user
  public getUserToilProcessingRecords(userId: string): ToilProcessingRecord[] {
    const records = this.fetchToilProcessingRecords();
    return records.filter(record => record.userId === userId);
  }

  // Get TOIL processing record by ID
  public getToilProcessingRecordById(id: string): ToilProcessingRecord | null {
    const records = this.fetchToilProcessingRecords();
    const record = records.find(record => record.id === id);
    return record || null;
  }

  // Get TOIL processing record for a specific month
  public getToilProcessingRecordForMonth(userId: string, month: string): ToilProcessingRecord | null {
    const records = this.getUserToilProcessingRecords(userId);
    const record = records.find(record => record.month === month);
    
    if (record) {
      logger.debug(`Found existing processing record for user ${userId}, month ${month}`, record);
    } else {
      logger.debug(`No processing record found for user ${userId}, month ${month}`);
    }
    
    return record || null;
  }

  // Submit TOIL processing request
  public submitToilProcessing(data: ToilProcessingFormData): ToilProcessingRecord {
    const records = this.fetchToilProcessingRecords();
    
    logger.debug(`Submitting TOIL processing for user ${data.userId}, month ${data.month}`, data);
    
    // Check if a record already exists for this month
    const existingIndex = records.findIndex(
      record => record.userId === data.userId && record.month === data.month
    );

    const processingRecord: ToilProcessingRecord = {
      id: existingIndex >= 0 ? records[existingIndex].id : uuidv4(),
      userId: data.userId,
      month: data.month,
      totalHours: data.totalHours,
      rolloverHours: data.rolloverHours,
      surplusHours: data.surplusHours,
      surplusAction: data.surplusAction,
      status: "pending",
      submittedAt: new Date().toISOString(),
      originalRecords: [], // Would be populated with actual TOIL record IDs
    };

    if (existingIndex >= 0) {
      records[existingIndex] = processingRecord;
      logger.debug(`Updated existing processing record for ${data.month}`);
    } else {
      records.push(processingRecord);
      logger.debug(`Created new processing record for ${data.month}`);
    }

    this.saveToilProcessingRecords(records);
    
    // Update the month processing state
    this.updateMonthProcessingState(data.userId, data.month, ToilProcessingStatus.IN_PROGRESS);
    
    // Dispatch event for UI update
    const event = new CustomEvent("toil-month-end-submitted", { detail: processingRecord });
    window.dispatchEvent(event);
    
    return processingRecord;
  }

  // Get TOIL month processing state
  public getMonthProcessingState(userId: string, month: string): ToilMonthProcessingState | null {
    try {
      const states = localStorage.getItem(TOIL_MONTH_PROCESSING_STATE_KEY);
      const allStates: ToilMonthProcessingState[] = states ? JSON.parse(states) : [];
      
      const state = allStates.find(state => state.userId === userId && state.month === month);
      
      logger.debug(`Got processing state for user ${userId}, month ${month}:`, state || 'Not found');
      
      return state || null;
    } catch (error) {
      logger.error("Error fetching TOIL month processing state:", error);
      return null;
    }
  }

  // Update TOIL month processing state
  public updateMonthProcessingState(
    userId: string,
    month: string,
    status: ToilProcessingStatus
  ): void {
    try {
      logger.debug(`Updating processing state for user ${userId}, month ${month} to ${status}`);
      
      const states = localStorage.getItem(TOIL_MONTH_PROCESSING_STATE_KEY);
      const allStates: ToilMonthProcessingState[] = states ? JSON.parse(states) : [];
      
      const existingIndex = allStates.findIndex(
        state => state.userId === userId && state.month === month
      );
      
      const newState: ToilMonthProcessingState = {
        userId,
        month,
        status,
        lastUpdated: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        allStates[existingIndex] = newState;
        logger.debug(`Updated existing processing state for ${month}`);
      } else {
        allStates.push(newState);
        logger.debug(`Created new processing state for ${month}`);
      }
      
      localStorage.setItem(TOIL_MONTH_PROCESSING_STATE_KEY, JSON.stringify(allStates));
      
      // Dispatch event for UI update
      const event = new CustomEvent("toil-month-state-updated", { detail: newState });
      window.dispatchEvent(event);
    } catch (error) {
      logger.error("Error updating TOIL month processing state:", error);
    }
  }

  // THRESHOLD MANAGEMENT METHODS (Moved from ToilSettingsService)
  
  // Fetch TOIL thresholds
  public fetchToilThresholds(): ToilThresholds {
    try {
      const storedThresholds = localStorage.getItem(TOIL_THRESHOLDS_KEY);
      return storedThresholds ? JSON.parse(storedThresholds) : DEFAULT_THRESHOLDS;
    } catch (error) {
      logger.error("Error fetching TOIL thresholds:", error);
      return DEFAULT_THRESHOLDS;
    }
  }
  
  // Save TOIL thresholds
  public saveToilThresholds(thresholds: ToilThresholds): boolean {
    try {
      localStorage.setItem(TOIL_THRESHOLDS_KEY, JSON.stringify(thresholds));
      return true;
    } catch (error) {
      logger.error("Error saving TOIL thresholds:", error);
      return false;
    }
  }
  
  // Reset TOIL thresholds to defaults
  public resetToilThresholds(): ToilThresholds {
    localStorage.setItem(TOIL_THRESHOLDS_KEY, JSON.stringify(DEFAULT_THRESHOLDS));
    return DEFAULT_THRESHOLDS;
  }
}

// Export a singleton instance of the TOILService
export const toilService = new TOILService();

// Start processing the queue
processTOILQueue();
