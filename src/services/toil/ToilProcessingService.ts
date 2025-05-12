
/**
 * @deprecated This file is now deprecated - use toilService from "@/utils/time/services/toil" instead
 * It's kept for backward compatibility during the transition
 */

import { toilService } from "@/utils/time/services/toil";
import { ToilProcessingFormData, ToilProcessingRecord, ToilMonthProcessingState, ToilProcessingStatus } from "@/types/monthEndToil";
import { TOILSummary } from "@/types/toil";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('ToilProcessingService');

// Re-export functions that use the unified service
export const fetchToilProcessingRecords = (): ToilProcessingRecord[] => {
  return toilService.fetchToilProcessingRecords();
};

export const getUserToilProcessingRecords = (userId: string): ToilProcessingRecord[] => {
  return toilService.getUserToilProcessingRecords(userId);
};

export const getToilProcessingRecordById = (id: string): ToilProcessingRecord | null => {
  return toilService.getToilProcessingRecordById(id);
};

export const getToilProcessingRecordForMonth = (userId: string, month: string): ToilProcessingRecord | null => {
  return toilService.getToilProcessingRecordForMonth(userId, month);
};

export const submitToilProcessing = (data: ToilProcessingFormData): ToilProcessingRecord => {
  return toilService.submitToilProcessing(data);
};

export const getMonthProcessingState = (userId: string, month: string): ToilMonthProcessingState | null => {
  return toilService.getMonthProcessingState(userId, month);
};

export const updateMonthProcessingState = (
  userId: string,
  month: string,
  status: ToilProcessingStatus
): void => {
  toilService.updateMonthProcessingState(userId, month, status);
};

export const fetchToilByMonth = async (userId: string, month: string): Promise<TOILSummary | null> => {
  return toilService.getTOILSummary(userId, month);
};

// For debugging: set the processing state directly (helpful for testing)
export const setProcessingStateForTesting = (
  userId: string, 
  month: string, 
  status: ToilProcessingStatus
): void => {
  toilService.updateMonthProcessingState(userId, month, status);
  logger.debug(`TEST: Set processing state for ${month} to ${status}`);
};
