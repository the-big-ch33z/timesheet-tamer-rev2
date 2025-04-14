
import { TimeEntry } from "@/types";
import { useLogger } from "../../useLogger";
import { areSameDates, formatDateForComparison, ensureDate, isValidDate } from "@/utils/time/validation";

// Query functions for working with entries
export const createEntryQueries = (
  entries: TimeEntry[],
  userId: string | undefined,
  logger: ReturnType<typeof useLogger>
) => {
  // Get entries for a specific user
  const getUserEntries = (userIdToFilter?: string) => {
    const targetUserId = userIdToFilter || userId;
    // If no viewed user is found, return empty array
    if (!targetUserId) {
      logger.debug("No user ID provided for filtering entries");
      return [];
    }
    
    // Return entries for the viewed user
    const filteredEntries = entries.filter(entry => entry.userId === targetUserId);
    logger.debug("Filtered entries for user", { userId: targetUserId, count: filteredEntries.length });
    return filteredEntries;
  };

  // Get entries for a specific day and user
  const getDayEntries = (day: Date, userIdToFilter?: string) => {
    // Validate date
    if (!day || !isValidDate(day)) {
      logger.warn("Invalid date provided to getDayEntries", { day });
      return [];
    }
    
    const userEntries = getUserEntries(userIdToFilter);
    const dayFormatted = formatDateForComparison(day);
    
    logger.debug(`Getting entries for date: ${dayFormatted}`, {
      totalUserEntries: userEntries.length
    });
    
    const dayEntries = userEntries.filter(entry => {
      // Ensure entry.date is a Date object
      const entryDate = entry.date instanceof Date 
        ? entry.date 
        : ensureDate(entry.date);
      
      if (!entryDate) {
        logger.warn("Invalid date in entry during day filtering:", entry);
        return false;
      }
      
      return areSameDates(entryDate, day);
    });
    
    logger.debug("Retrieved entries for day", { 
      date: dayFormatted, 
      count: dayEntries.length
    });
    
    return dayEntries;
  };

  return {
    getUserEntries,
    getDayEntries
  };
};
