/**
 * Time Entry Service
 * Provides a consistent interface for all timesheet entry operations
 */
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { createTimeLogger } from '../errors/timeErrorHandling';
import { ensureDate, isValidDate } from '../validation/dateValidation';
import { calculateHoursFromTimes } from '../calculations/hoursCalculations';

// Create a dedicated logger for this service
const logger = createTimeLogger('TimeEntryService');

// Storage key for consistency
export const STORAGE_KEY = 'timeEntries';

// Interface for the service
export interface TimeEntryService {
  // Read operations
  getAllEntries: () => TimeEntry[];
  getUserEntries: (userId: string) => TimeEntry[];
  getDayEntries: (date: Date, userId: string) => TimeEntry[];
  
  // Write operations
  createEntry: (entry: Omit<TimeEntry, "id">) => string | null;
  updateEntry: (entryId: string, updates: Partial<TimeEntry>) => boolean;
  deleteEntry: (entryId: string) => boolean;
  
  // Bulk operations
  saveEntries: (entries: TimeEntry[]) => boolean;
  
  // Utility methods
  calculateTotalHours: (entries: TimeEntry[]) => number;
  validateEntry: (entry: Partial<TimeEntry>) => { valid: boolean; message?: string };
  autoCalculateHours: (startTime: string, endTime: string) => number;
}

/**
 * Create a Time Entry Service instance
 * Handles all operations related to timesheet entries with consistent validation and error handling
 */
export const createTimeEntryService = (): TimeEntryService => {
  // Read all entries from storage
  const getAllEntries = (): TimeEntry[] => {
    try {
      logger.debug("Loading all entries from storage");
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      
      if (!savedEntries) {
        logger.debug("No entries found in storage");
        return [];
      }
      
      const parsedEntries = JSON.parse(savedEntries).map((entry: any) => {
        // Ensure date is a valid Date object
        const entryDate = ensureDate(entry.date);
        if (!entryDate) {
          logger.warn("Invalid date in entry:", entry);
        }
        
        return {
          ...entry,
          date: entryDate || new Date()
        };
      });
      
      logger.debug(`Loaded ${parsedEntries.length} entries from storage`);
      return parsedEntries;
    } catch (error) {
      logger.error("Error loading entries from storage:", error);
      return [];
    }
  };
  
  // Save all entries to storage
  const saveEntries = (entries: TimeEntry[]): boolean => {
    try {
      logger.debug(`Saving ${entries.length} entries to storage`);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      logger.error("Error saving entries to storage:", error);
      return false;
    }
  };
  
  // Get entries for a specific user
  const getUserEntries = (userId: string): TimeEntry[] => {
    if (!userId) {
      logger.warn("No userId provided to getUserEntries");
      return [];
    }
    
    const allEntries = getAllEntries();
    const userEntries = allEntries.filter(entry => entry.userId === userId);
    
    logger.debug(`Found ${userEntries.length} entries for user ${userId}`);
    return userEntries;
  };
  
  // Get entries for a specific day and user
  const getDayEntries = (date: Date, userId: string): TimeEntry[] => {
    if (!isValidDate(date)) {
      logger.warn("Invalid date provided to getDayEntries:", date);
      return [];
    }
    
    if (!userId) {
      logger.warn("No userId provided to getDayEntries");
      return [];
    }
    
    const userEntries = getUserEntries(userId);
    
    const dayEntries = userEntries.filter(entry => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });
    
    logger.debug(`Found ${dayEntries.length} entries for user ${userId} on ${date.toDateString()}`);
    return dayEntries;
  };
  
  // Create a new entry
  const createEntry = (entryData: Omit<TimeEntry, "id">): string | null => {
    // Validate entry data
    const validation = validateEntry(entryData);
    if (!validation.valid) {
      logger.error(`Invalid entry data: ${validation.message}`, entryData);
      return null;
    }
    
    // Ensure we have a valid date
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      logger.error("Invalid date in entry data", entryData);
      return null;
    }
    
    // Create the entry with a new ID
    const newId = uuidv4();
    const newEntry: TimeEntry = {
      ...entryData,
      id: newId,
      date: entryDate
    };
    
    // Get all entries and add the new one
    const allEntries = getAllEntries();
    allEntries.push(newEntry);
    
    // Save back to storage
    const saved = saveEntries(allEntries);
    
    if (saved) {
      logger.debug(`Created new entry with ID ${newId}`, newEntry);
      return newId;
    }
    
    logger.error("Failed to save new entry");
    return null;
  };
  
  // Update an existing entry
  const updateEntry = (entryId: string, updates: Partial<TimeEntry>): boolean => {
    if (!entryId) {
      logger.error("No entry ID provided for update");
      return false;
    }
    
    // Handle date update if present
    if (updates.date) {
      const validDate = ensureDate(updates.date);
      if (!validDate) {
        logger.error("Invalid date in update data", updates);
        return false;
      }
      updates.date = validDate;
    }
    
    // Get all entries
    const allEntries = getAllEntries();
    
    // Find the entry to update
    const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
      logger.error(`Entry with ID ${entryId} not found for update`);
      return false;
    }
    
    // Update the entry
    allEntries[entryIndex] = {
      ...allEntries[entryIndex],
      ...updates
    };
    
    // Save back to storage
    const saved = saveEntries(allEntries);
    
    if (saved) {
      logger.debug(`Updated entry ${entryId}`, updates);
      return true;
    }
    
    logger.error(`Failed to save update for entry ${entryId}`);
    return false;
  };
  
  // Delete an entry and update storage
  const deleteEntry = (entryId: string): boolean => {
    if (!entryId) {
      logger.error("No entry ID provided for deletion");
      return false;
    }
    
    try {
      // Get all entries directly from storage
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      const allEntries = savedEntries ? JSON.parse(savedEntries) : [];
      
      // Find and remove the entry
      const entryIndex = allEntries.findIndex((entry: TimeEntry) => entry.id === entryId);
      if (entryIndex === -1) {
        logger.warn(`Entry with ID ${entryId} not found for deletion`);
        return false;
      }
      
      // Remove the entry
      allEntries.splice(entryIndex, 1);
      
      // Immediately save back to storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries));
      
      logger.debug(`Successfully deleted entry ${entryId}`);
      
      // Trigger storage event for cross-tab sync
      window.dispatchEvent(new Event('timesheet:entry-deleted'));
      
      return true;
    } catch (error) {
      logger.error(`Error deleting entry ${entryId}:`, error);
      return false;
    }
  };
  
  // Calculate total hours from a list of entries
  const calculateTotalHours = (entries: TimeEntry[]): number => {
    const totalHours = entries.reduce((total, entry) => {
      return total + (entry.hours || 0);
    }, 0);
    
    return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
  };
  
  // Validate entry data
  const validateEntry = (entry: Partial<TimeEntry>): { valid: boolean; message?: string } => {
    // Check for required fields
    if (!entry.userId) {
      return { valid: false, message: "User ID is required" };
    }
    
    if (!entry.date) {
      return { valid: false, message: "Date is required" };
    }
    
    // Validate date
    const validDate = ensureDate(entry.date);
    if (!validDate) {
      return { valid: false, message: "Invalid date format" };
    }
    
    // Validate hours if provided
    if (entry.hours !== undefined && (isNaN(entry.hours) || entry.hours < 0)) {
      return { valid: false, message: "Hours must be a positive number" };
    }
    
    return { valid: true };
  };
  
  // Auto-calculate hours from start and end times
  const autoCalculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) {
      return 0;
    }
    
    try {
      return calculateHoursFromTimes(startTime, endTime);
    } catch (error) {
      logger.error("Error calculating hours:", error);
      return 0;
    }
  };
  
  // Return the service interface
  return {
    getAllEntries,
    getUserEntries,
    getDayEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    saveEntries,
    calculateTotalHours,
    validateEntry,
    autoCalculateHours
  };
};

// Export a singleton instance for convenience
export const timeEntryService = createTimeEntryService();
