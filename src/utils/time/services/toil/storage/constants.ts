
/**
 * Centralized constants for TOIL storage
 * All TOIL-related storage keys should be defined here
 */

// Primary keys for TOIL records
export const TOIL_RECORDS_KEY = 'toilRecords';
export const TOIL_USAGE_KEY = 'toilUsage';
export const TOIL_SUMMARY_CACHE_KEY = 'toilSummaryCache';

// Month-end processing keys
export const TOIL_PROCESSING_RECORDS_KEY = 'toil_processing_records';
export const TOIL_MONTH_PROCESSING_STATE_KEY = 'toil_month_processing_state';
export const TOIL_THRESHOLDS_KEY = 'toil_thresholds';

// Time periods for storage operations
export const STORAGE_RETRY_DELAY = 200; // ms
export const STORAGE_MAX_RETRIES = 3;
export const DEBOUNCE_PERIOD = 300; // ms

// TOIL job number constant
export const TOIL_JOB_NUMBER = "TOIL";

// Fixed export for consistent reference
export default {
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  TOIL_PROCESSING_RECORDS_KEY,
  TOIL_MONTH_PROCESSING_STATE_KEY,
  TOIL_THRESHOLDS_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES,
  DEBOUNCE_PERIOD,
  TOIL_JOB_NUMBER
};
