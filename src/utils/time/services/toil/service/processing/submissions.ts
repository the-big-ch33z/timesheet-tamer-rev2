
import { createTimeLogger } from "@/utils/time/errors";
import { 
  ToilProcessingFormData, 
  ToilProcessingRecord,
  ToilProcessingStatus
} from "@/types/monthEndToil";
import { v4 as uuidv4 } from "uuid";
import { TOILProcessingStateManager } from "./state-management";

const logger = createTimeLogger('TOILService-Processing-Submissions');

/**
 * Submission handling for TOIL processing
 */
export class TOILProcessingSubmissions extends TOILProcessingStateManager {
  /**
   * Submit TOIL processing request
   */
  public submitToilProcessing(data: ToilProcessingFormData): ToilProcessingRecord {
    try {
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
      const event = new CustomEvent("toil-month-end-submitted", { 
        detail: { 
          record: processingRecord,
          userId: data.userId,
          month: data.month
        } 
      });
      window.dispatchEvent(event);
      
      logger.debug(`TOIL processing submitted successfully for ${data.month}`, processingRecord);
      
      return processingRecord;
    } catch (error) {
      logger.error(`Error submitting TOIL processing: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
