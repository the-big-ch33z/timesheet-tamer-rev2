
// Storage keys
export const TOIL_RECORDS_KEY = 'toil_records';
export const TOIL_USAGE_KEY = 'toil_usage';
export const TOIL_SUMMARY_CACHE_KEY = 'toil_summary_cache';
export const TOIL_THRESHOLDS_KEY = 'toil_thresholds';
export const TOIL_PROCESSING_RECORDS_KEY = 'toil_processing_records';
export const TOIL_MONTH_PROCESSING_STATE_KEY = 'toil_month_processing_state';

// Operation constants
export const STORAGE_RETRY_DELAY = 200;
export const STORAGE_MAX_RETRIES = 3;
export const DEBOUNCE_PERIOD = 2000; // 2 seconds

// Job number for TOIL entries
export const TOIL_JOB_NUMBER = 'TOIL';

// Default thresholds
export const DEFAULT_THRESHOLDS = {
  fullTime: 38,
  partTime: 20,
  casual: 10
};
