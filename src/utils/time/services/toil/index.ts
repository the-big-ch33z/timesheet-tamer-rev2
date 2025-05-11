
/**
 * TOIL Service Index
 * This file provides a consolidated export of TOIL-related functionality.
 */

// Export TOIL service and types
export { 
  TOILService, 
  TOIL_JOB_NUMBER,
  TOIL_STORAGE_KEY
} from './service';

export type { 
  TOILBalanceEntry,
  TOILUsageEntry
} from './service';

// Re-export calculation functions
export { 
  calculateTOILBalance,
  calculateTOILAccrual,
  getAvailableTOILHours
} from './calculation';

// Re-export batch processing functions
export {
  processTOILBatch,
  validateTOILBatchItem
} from './batch-processing';

// Re-export storage functions
export {
  loadTOILData,
  saveTOILData,
  clearTOILCache
} from './storage';

// Export event functionality
export {
  dispatchTOILEvent,
  addTOILEventListener,
  removeTOILEventListener
} from './events';

// Re-export holiday utilities
export { isHoliday } from './holiday-utils';
