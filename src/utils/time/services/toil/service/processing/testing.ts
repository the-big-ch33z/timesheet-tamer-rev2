
import { createTimeLogger } from "@/utils/time/errors";
import { ToilProcessingStatus } from "@/types/monthEndToil";
import { TOILProcessingSubmissions } from "./submissions";

const logger = createTimeLogger('TOILService-Processing-Testing');

/**
 * Test functionality for TOIL processing
 */
export class TOILProcessingTesting extends TOILProcessingSubmissions {
  /**
   * For testing: simulate approval of a TOIL processing record
   */
  public approveProcessingRecordForTesting(
    userId: string,
    month: string,
    approverId: string = "manager-123"
  ): void {
    try {
      const records = this.fetchToilProcessingRecords();
      const recordIndex = records.findIndex(
        record => record.userId === userId && record.month === month
      );
      
      if (recordIndex >= 0) {
        records[recordIndex] = {
          ...records[recordIndex],
          status: "approved",
          approverId,
          approvedAt: new Date().toISOString()
        };
        
        this.saveToilProcessingRecords(records);
        this.updateMonthProcessingState(userId, month, ToilProcessingStatus.COMPLETED);
        
        logger.debug(`Test approval completed for ${month}`);
      } else {
        logger.error(`No processing record found for user ${userId}, month ${month}`);
      }
    } catch (error) {
      logger.error("Error in test approval:", error);
    }
  }
}
