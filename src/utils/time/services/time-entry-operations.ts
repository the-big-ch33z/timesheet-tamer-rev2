
import { TimeEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { validateTimeEntry, autoCalculateHours, calculateTotalHours } from "./entry-validation";
import { createTimeLogger } from '../errors/timeLogger';
import { ensureDate } from '../validation/dateValidation';
import { saveEntriesToStorage } from "./storage-operations";
import { TimeEntryServiceConfig } from "./types";
import { EventManager } from "./event-handling";

const logger = createTimeLogger('TimeEntryOperations');

/**
 * Class for handling time entry CRUD operations
 */
export class TimeEntryOperations {
  private config: Required<TimeEntryServiceConfig>;
  private invalidateCache: () => void;
  private getAllEntries: () => TimeEntry[];
  private eventManager: EventManager;

  constructor(
    config: Required<TimeEntryServiceConfig>,
    invalidateCache: () => void,
    getAllEntries: () => TimeEntry[],
    eventManager: EventManager
  ) {
    this.config = config;
    this.invalidateCache = invalidateCache;
    this.getAllEntries = getAllEntries;
    this.eventManager = eventManager;
  }

  /**
   * Create a new time entry
   */
  public createEntry(entryData: Omit<TimeEntry, "id">, deletedEntryIds: string[]): string | null {
    // Validate entry data
    const validation = validateTimeEntry(entryData);
    if (!validation.valid) {
      logger.error(`Invalid entry data: ${validation.message}`, entryData);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error: validation.message, context: 'createEntry', data: entryData }
      });
      
      return null;
    }
    
    // Ensure we have a valid date
    const entryDate = ensureDate(entryData.date);
    if (!entryDate) {
      const error = 'Invalid date in entry data';
      logger.error(error, entryData);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
      return null;
    }
    
    try {
      // Create the entry with a new ID
      const newId = uuidv4();
      const newEntry: TimeEntry = {
        ...entryData,
        id: newId,
        date: entryDate
      };
      
      // Get all entries and add the new one
      const allEntries = this.getAllEntries();
      allEntries.push(newEntry);
      
      // Save back to storage
      saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
            
            this.eventManager.dispatchEvent({
              type: 'entry-created',
              timestamp: new Date(),
              payload: { entry: newEntry },
              userId: newEntry.userId
            });
            
            logger.debug(`Created new entry with ID ${newId}`, newEntry);
          } else {
            logger.error('Failed to save new entry');
            
            this.eventManager.dispatchEvent({
              type: 'error',
              timestamp: new Date(),
              payload: { error: 'Failed to save new entry', context: 'createEntry', data: entryData }
            });
          }
        })
        .catch(error => {
          logger.error('Error saving new entry:', error);
          
          this.eventManager.dispatchEvent({
            type: 'error',
            timestamp: new Date(),
            payload: { error, context: 'createEntry', data: entryData }
          });
        });
      
      return newId;
    } catch (error) {
      logger.error('Error creating entry', error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'createEntry', data: entryData }
      });
      
      return null;
    }
  }

  /**
   * Update an existing entry
   */
  public updateEntry(entryId: string, updates: Partial<TimeEntry>, deletedEntryIds: string[]): boolean {
    if (!entryId) {
      logger.error('No entry ID provided for update');
      return false;
    }
    
    try {
      // Handle date update if present
      if (updates.date) {
        const validDate = ensureDate(updates.date);
        if (!validDate) {
          logger.error('Invalid date in update data', updates);
          return false;
        }
        updates.date = validDate;
      }
      
      // Get all entries
      const allEntries = this.getAllEntries();
      
      // Find the entry to update
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.error(`Entry with ID ${entryId} not found for update`);
        return false;
      }
      
      const originalEntry = allEntries[entryIndex];
      
      // Update the entry
      const updatedEntry = {
        ...originalEntry,
        ...updates
      };
      
      allEntries[entryIndex] = updatedEntry;
      
      // Save back to storage
      saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
            
            this.eventManager.dispatchEvent({
              type: 'entry-updated',
              timestamp: new Date(),
              payload: { 
                entryId,
                updates,
                original: originalEntry,
                updated: updatedEntry
              },
              userId: updatedEntry.userId
            });
            
            logger.debug(`Updated entry ${entryId}`, updates);
          } else {
            logger.error(`Failed to save update for entry ${entryId}`);
          }
        })
        .catch(error => {
          logger.error(`Error updating entry ${entryId}:`, error);
          
          this.eventManager.dispatchEvent({
            type: 'error',
            timestamp: new Date(),
            payload: { error, context: 'updateEntry', entryId, updates }
          });
        });
      
      return true;
    } catch (error) {
      logger.error(`Error updating entry ${entryId}`, error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'updateEntry', entryId, updates }
      });
      
      return false;
    }
  }

  /**
   * Delete an entry
   */
  public deleteEntry(entryId: string, deletedEntryIds: string[]): boolean {
    if (!entryId) {
      logger.error('No entry ID provided for deletion');
      return false;
    }
    
    try {
      // Get all entries
      const allEntries = this.getAllEntries();
      
      // Find the entry to delete
      const entryIndex = allEntries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        logger.warn(`Entry with ID ${entryId} not found for deletion`);
        return false;
      }
      
      const deletedEntry = allEntries[entryIndex];
      
      // Remove the entry
      allEntries.splice(entryIndex, 1);
      
      // Save back to storage and handle deleted entries list
      saveEntriesToStorage(allEntries, this.config.storageKey, deletedEntryIds)
        .then(saved => {
          if (saved) {
            this.invalidateCache();
            
            this.eventManager.dispatchEvent({
              type: 'entry-deleted',
              timestamp: new Date(),
              payload: { entryId, entry: deletedEntry },
              userId: deletedEntry.userId
            });
            
            // Dispatch custom event for compatibility with existing code
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('timesheet:entry-deleted', {
                detail: { entryId }
              }));
            }
            
            logger.debug(`Deleted entry ${entryId}`);
          } else {
            logger.error(`Failed to save after deleting entry ${entryId}`);
          }
        })
        .catch(error => {
          logger.error(`Error saving after deleting entry ${entryId}:`, error);
          
          this.eventManager.dispatchEvent({
            type: 'error',
            timestamp: new Date(),
            payload: { error, context: 'deleteEntry', entryId }
          });
        });
      
      return true;
    } catch (error) {
      logger.error(`Error deleting entry ${entryId}`, error);
      
      this.eventManager.dispatchEvent({
        type: 'error',
        timestamp: new Date(),
        payload: { error, context: 'deleteEntry', entryId }
      });
      
      return false;
    }
  }
}
