
export * from './service';
export * from './calculation';
export * from './storage';
export * from './batch-processing';
export * from './holiday-utils';
export * from './events';

// Re-export specific types while avoiding ambiguous exports
export { 
  TOIL_JOB_NUMBER,
  // Don't re-export storage keys from here to avoid ambiguity
  // TOIL_RECORDS_KEY, 
  // TOIL_USAGE_KEY
} from './types';

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
export type { TOILDayInfo } from './storage';

// Add debugging exports for tracking calls
console.log('[TOIL-INDEX] TOIL module loaded and configured');
