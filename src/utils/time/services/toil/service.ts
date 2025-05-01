import { 
  TOILRecord, TOILSummary, TOILUsage 
} from "@/types/toil";
import { TimeEntry, WorkSchedule } from "@/types";
import { Holiday } from "@/lib/holidays";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { PendingTOILCalculation } from "./types";
import { calculateTOILHours } from "./calculation";
import { 
  loadTOILRecords, 
  loadTOILUsage,
  clearSummaryCache,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
} from "./storage";
import { queueTOILCalculation, processTOILQueue } from "./batch-processing";
import { dispatchTOILEvent } from "./events";
import { createTimeLogger } from "../../errors/timeLogger";

const logger = createTimeLogger('TOILService');

// TOIL Service class for managing TOIL calculations and storage
export class TOILService {
  private calculationQueueEnabled: boolean = true;
  
  constructor(calculationQueueEnabled: boolean = true) {
    this.calculationQueueEnabled = calculationQueueEnabled;
  }
  
  // Clear all TOIL-related caches
  public clearCache(): void {
    try {
      localStorage.removeItem(TOIL_RECORDS_KEY);
      localStorage.removeItem(TOIL_USAGE_KEY);
      
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
      if (!entries || entries.length === 0) {
        logger.debug('No entries to calculate TOIL for');
        return null;
      }
      
      const monthYear = format(date, 'yyyy-MM');
      
      // Calculate TOIL hours
      const toilHours = calculateTOILHours(entries, date, workSchedule, holidays);
      
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
        entryId: entries[0].id, // Reference first entry for simplicity
        status: 'active'
      };
      
      // Store the TOIL record
      const stored = await this.storeTOILRecord(toilRecord);
      
      if (!stored) {
        logger.error('Failed to store TOIL record');
        return null;
      }
      
      // Get updated summary
      const summary = await this.getTOILSummary(userId, monthYear);
      
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

  // Store a TOIL record
  private async storeTOILRecord(record: TOILRecord): Promise<boolean> {
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

  // Record TOIL usage
  public async recordTOILUsage(entry: TimeEntry): Promise<boolean> {
    try {
      if (!entry) {
        logger.error('No entry provided for TOIL usage');
        return false;
      }
      
      const usage: TOILUsage = {
        id: uuidv4(),
        userId: entry.userId,
        date: entry.date,
        hours: entry.hours,
        entryId: entry.id,
        monthYear: format(entry.date, 'yyyy-MM')
      };
      
      const usages = loadTOILUsage();
      usages.push(usage);
      localStorage.setItem(TOIL_USAGE_KEY, JSON.stringify(usages));
      
      // Clear the summary cache for this month
      clearSummaryCache(entry.userId, usage.monthYear);
      
      logger.debug(`Recorded TOIL usage for entry ${entry.id}`);
      
      // Get updated summary
      const summary = await this.getTOILSummary(entry.userId, usage.monthYear);
      
      // Dispatch TOIL update event
      dispatchTOILEvent(summary);
      
      return true;
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
      const monthYear = format(date, 'yyyy-MM');
      
      // Calculate TOIL hours
      const toilHours = calculateTOILHours(entries, date, workSchedule, holidays);
      
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
        entryId: entries[0].id, // Reference first entry for simplicity
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
          
          // Get updated summary
          this.getTOILSummary(userId, monthYear);
          
          // Get updated summary
          const summary = this.getTOILSummary(userId, monthYear);
          
          // Dispatch TOIL update event
          dispatchTOILEvent(summary);
          
          resolve(summary);
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
}

// Export a singleton instance of the TOILService
export const toilService = new TOILService();

// Start processing the queue
processTOILQueue();
