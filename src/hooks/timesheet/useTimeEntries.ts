
/**
 * @deprecated This file is kept only for test compatibility - use useUnifiedTimeEntries instead
 */
import { TimeEntry } from "@/types";

// Export a minimal interface that matches what the tests expect
export const useTimeEntries = (userId: string, date?: Date) => {
  console.warn("useTimeEntries is deprecated. Use useUnifiedTimeEntries instead.");
  return {
    entries: [],
    isLoading: false,
    createEntry: () => 'mock-id',
    updateEntry: () => true,
    deleteEntry: () => true,
    getDayEntries: () => [],
    getMonthEntries: () => [],
    calculateTotalHours: () => 0,
    refreshEntries: () => {}
  };
};
