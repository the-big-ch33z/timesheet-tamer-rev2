
/**
 * TOIL services index
 * Central export point for all TOIL-related functionality
 */

// Export the main TOIL service
export { toilService } from './toilService';

// Re-export types
export type { TOILRecord, TOILUsage, TOILSummary } from '@/types/toil';

// Export storage utilities
export {
  // Storage constants
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  
  // Core functions
  clearSummaryCache,
  clearAllTOILCaches,
  
  // Record management
  loadTOILRecords,
  loadTOILUsage,
  storeTOILRecord,
  storeTOILUsage,
  
  // Queries
  getUserTOILRecords,
  findTOILRecordsByEntryId,
  deleteTOILRecordByEntryId,
  hasTOILForDay,
  hasTOILForMonth,
  getTOILSummary,
  
  // Types
  TOILDayInfo,
  
  // Cleanup
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage,
  clearTOILStorageForMonth
} from './storage';

// Add deprecation notices using console warnings in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Direct imports from TOIL storage files are deprecated.\n' +
    'Please import from @/utils/time/services/toil instead.'
  );
}
