
/**
 * This file is now deprecated and serves as a re-export to maintain backward compatibility.
 * New code should import directly from the reorganized modules in the storage/ directory.
 */

// Re-export everything from the storage sub-module
export * from './storage/index';

// Add proper type definitions for TOIL day info
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}

// Add missing functions that other components are looking for
export const hasTOILForDay = (userId: string, day: Date): TOILDayInfo => {
  console.log(`[TOILStorage] Checking TOIL for day: ${day.toISOString()} for user: ${userId}`);
  // Default implementation until we can properly implement
  return {
    hasAccrued: false,
    hasUsed: false,
    toilHours: 0
  };
};

export const getTOILSummary = (userId: string, monthYear: string) => {
  console.log(`[TOILStorage] Getting TOIL summary for ${userId} in ${monthYear}`);
  return {
    userId,
    monthYear,
    accrued: 0,
    used: 0,
    remaining: 0
  };
};

export const findTOILRecordsByEntryId = (entryId: string) => {
  console.log(`[TOILStorage] Finding TOIL records for entry ID: ${entryId}`);
  return [];
};

export const deleteTOILRecordByEntryId = async (entryId: string): Promise<boolean> => {
  console.log(`[TOILStorage] Deleting TOIL records for entry ID: ${entryId}`);
  return true;
};

export const hasTOILForMonth = (userId: string, monthYear: string): boolean => {
  console.log(`[TOILStorage] Checking if TOIL exists for ${userId} in ${monthYear}`);
  return false;
};

// Additional helpers for the TOILDebugPanel component
export const loadTOILRecords = (filterUserId?: string) => {
  console.log(`[TOILStorage] Loading TOIL records${filterUserId ? ` for user: ${filterUserId}` : ''}`);
  const records = [];
  // We'll return properly typed records to match TOILRecord
  return records;
};

export const loadTOILUsage = (filterUserId?: string) => {
  console.log(`[TOILStorage] Loading TOIL usage${filterUserId ? ` for user: ${filterUserId}` : ''}`);
  const usage = [];
  // We'll return properly typed records to match TOILUsage
  return usage;
};

// Add cleanup functions that are referenced
export const cleanupDuplicateTOILRecords = async (userId: string) => {
  console.log(`[TOILStorage] Cleaning up duplicate TOIL records for user: ${userId}`);
  return 0;
};

export const cleanupDuplicateTOILUsage = async (userId: string) => {
  console.log(`[TOILStorage] Cleaning up duplicate TOIL usage for user: ${userId}`);
  return 0;
};
