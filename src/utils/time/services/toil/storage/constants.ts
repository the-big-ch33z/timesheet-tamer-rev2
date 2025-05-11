
/**
 * Constants for TOIL storage keys
 */

// Primary keys for TOIL records
export const TOIL_RECORDS_KEY = 'toilRecords';
export const TOIL_USAGE_KEY = 'toilUsage';
export const TOIL_SUMMARY_CACHE_KEY = 'toilSummaryCache';

// Time periods for storage operations
export const STORAGE_RETRY_DELAY = 200; // ms
export const STORAGE_MAX_RETRIES = 3;
export const DEBOUNCE_PERIOD = 300; // ms

// Fixed export for consistent reference
export default {
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  STORAGE_RETRY_DELAY,
  STORAGE_MAX_RETRIES,
  DEBOUNCE_PERIOD
};
