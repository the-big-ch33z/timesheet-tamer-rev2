
/**
 * This file is now deprecated and serves as a re-export to maintain backward compatibility.
 * New code should import directly from the reorganized modules.
 */

// Re-export everything from the storage sub-module
export * from './storage/index';

// Re-export TOILDayInfo type
export type { TOILDayInfo } from './types';

// Re-export TOIL constants for backwards compatibility
export {
  TOIL_RECORDS_KEY,
  TOIL_USAGE_KEY,
  TOIL_SUMMARY_CACHE_KEY,
  TOIL_JOB_NUMBER
} from './storage/constants';
