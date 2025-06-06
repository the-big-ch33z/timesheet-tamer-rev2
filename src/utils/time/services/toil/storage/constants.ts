
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('TOIL-Storage-Constants');

/**
 * Constants for TOIL (Time Off In Lieu) storage
 */

// LocalStorage keys
export const TOIL_RECORDS_KEY = 'toilRecords';
export const TOIL_USAGE_KEY = 'toilUsage';
export const TOIL_SUMMARY_CACHE_KEY = 'toilSummary';
export const TOIL_SUMMARY_PREFIX = 'toilSummary';
export const TOIL_JOB_NUMBER = 'TOIL';
export const TOIL_PROCESSING_RECORDS_KEY = 'toilProcessingRecords';
export const TOIL_MONTH_PROCESSING_STATE_KEY = 'toilMonthProcessingState';
export const TOIL_THRESHOLDS_KEY = 'toilThresholds';

// Deletion tracking keys (added for unified deletion)
export const DELETED_TOIL_RECORDS_KEY = 'toil-records-deleted';
export const DELETED_TOIL_USAGE_KEY = 'toil-usage-deleted';

// Storage operation constants
export const STORAGE_RETRY_DELAY = 200; // ms
export const STORAGE_MAX_RETRIES = 3;

// Calculation constants
export const DEBOUNCE_PERIOD = 2000; // ms
