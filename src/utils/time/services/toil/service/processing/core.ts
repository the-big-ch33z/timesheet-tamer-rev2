
import { TOILServiceCore } from "../core";
import { createTimeLogger } from "@/utils/time/errors";
import { ToilProcessingRecord } from "@/types/monthEndToil";
import { TOIL_PROCESSING_RECORDS_KEY } from "../../storage/constants";

const logger = createTimeLogger('TOILService-Processing-Core');

/**
 * Core processing functionality for TOIL service
 */
export class TOILProcessingCore extends TOILServiceCore {
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
  protected saveToilProcessingRecords(records: ToilProcessingRecord[]): void {
    try {
      localStorage.setItem(TOIL_PROCESSING_RECORDS_KEY, JSON.stringify(records));
      logger.debug(`Saved ${records.length} TOIL processing records`);
    } catch (error) {
      logger.error("Error saving TOIL processing records:", error);
      throw new Error(`Failed to save TOIL processing records: ${error instanceof Error ? error.message : String(error)}`);
    }
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
}
