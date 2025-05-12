
import { TOILServiceCore } from "./core";
import { createTimeLogger } from "@/utils/time/errors";
import { 
  TOIL_PROCESSING_RECORDS_KEY,
  TOIL_MONTH_PROCESSING_STATE_KEY
} from "../storage/constants";
import { 
  ToilProcessingFormData, 
  ToilProcessingRecord, 
  ToilMonthProcessingState, 
  ToilProcessingStatus 
} from "@/types/monthEndToil";
import { v4 as uuidv4 } from "uuid";

const logger = createTimeLogger('TOILService-Processing');

/**
 * TOIL month-end processing functionality
 */
export class TOILServiceProcessing extends TOILServiceCore {
  /**
   * Fetch TOIL processing records
   */
  public fetchToilProcessingRecords(): ToilProcessingRecord[] {
    try {
      const records = localStorage.getItem(TOIL_PROCESSING_RECORDS_KEY);
      return records ? JSON.parse(records) : [];
    } catch (error) {
      logger.error("Error fetching TOIL processing records:", error);
      return [];
    }
  }

  /**
   * Save TOIL processing records
   */
  private saveToilProcessingRecords(records: ToilProcessingRecord[]): void {
    localStorage.setItem(TOIL_PROCESSING_RECORDS_KEY, JSON.stringify(records));
    logger.debug(`Saved ${records.length} TOIL processing records`);
  }

  /**
   * Get TOIL processing records for a user
   */
  public getUserToilProcessingRecords(userId: string): ToilProcessingRecord[] {
    const records = this.fetchToilProcessingRecords();
    return records.filter(record => record.userId === userId);
  }

  /**
   * Get TOIL processing record by ID
   */
  public getToilProcessingRecordById(id: string): ToilProcessingRecord | null {
    const records = this.fetchToilProcessingRecords();
    const record = records.find(record => record.id === id);
    return record || null;
  }

  /**
   * Get TOIL processing record for a specific month
   */
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

  /**
   * Submit TOIL processing request
   */
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

  /**
   * Get TOIL month processing state
   */
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

  /**
   * Update TOIL month processing state
   */
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
}
