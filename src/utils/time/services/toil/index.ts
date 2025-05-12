
export * from './service';
export * from './calculation';
export * from './storage';
export * from './batch-processing';
export * from './holiday-utils';
export * from './events';

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

// Use export type to fix the TypeScript 'isolatedModules' issue
export type { TOILDayInfo } from './types';

console.log('[TOIL-INDEX] TOIL module loaded and configured');
