
/**
 * TOIL Service Index
 * This file provides a consolidated export of TOIL-related functionality.
 */

// Export the TOIL service instance
import { toilService } from "../toil-service";
export { toilService };

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

// Re-export calculation functions from calculation.ts
export { 
  calculateTOILBalance,
  calculateTOILAccrual,
  getAvailableTOILHours
} from './calculation';

// Re-export storage functions from storage.ts
export {
  loadTOILData,
  saveTOILData,
  clearTOILCache,
  clearAllTOILCaches,
  cleanupDuplicateTOILRecords,
  cleanupDuplicateTOILUsage,
  loadTOILRecords,
  loadTOILUsage,
  getTOILSummary,
  findTOILRecordsByEntryId,
  deleteTOILRecordByEntryId,
  hasTOILForDay,
  hasTOILForMonth
} from './storage';

// Export TOILDayInfo interface
export type { TOILDayInfo } from './storage/queries';

// Export event functionality from events.ts
export {
  dispatchTOILEvent,
  addTOILEventListener,
  removeTOILEventListener
} from './events';

// Re-export holiday utilities
export { isHoliday } from './holiday-utils';
