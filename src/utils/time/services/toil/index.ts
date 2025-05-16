
export * from './service';
export * from './calculation';
export * from './storage';
export * from './batch-processing';
export * from './holiday-utils';
export * from './events';
export * from './types';

// Re-export queue manager
export { toilQueueManager } from './queue/TOILQueueManager';

// Re-export settings defaults
export { TOIL_DEFAULT_THRESHOLDS } from './service/settings';

// Re-export keys from constants
export { 
  TOIL_JOB_NUMBER,
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  TOIL_PROCESSING_RECORDS_KEY,
  TOIL_MONTH_PROCESSING_STATE_KEY,
  TOIL_THRESHOLDS_KEY,
  DEBOUNCE_PERIOD
} from './storage/constants';

// Make sure the critical functions are properly exported
import { 
  getTOILSummary,
  findTOILRecordsByEntryId,
  deleteTOILRecordByEntryId,
  hasTOILForDay,
  hasTOILForMonth
} from './storage';

// Re-export them
export {
  getTOILSummary,
  findTOILRecordsByEntryId,
  deleteTOILRecordByEntryId,
  hasTOILForDay,
  hasTOILForMonth
};

console.log('[TOIL-INDEX] TOIL module loaded and configured');
