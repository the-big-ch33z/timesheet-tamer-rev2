
import { useCallback } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';
import { useTimeEntryContext } from '@/contexts/timesheet/entries-context';
import { useWorkSchedule } from '@/contexts/work-schedule';
import { calculateDailyScheduledHours } from '@/utils/time/scheduleUtils';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { WORK_HOURS_EVENTS } from '@/utils/events/eventTypes';

const logger = createTimeLogger('useLeaveActions');

interface UseLeaveActionsOptions {
  userId?: string;
}

/**
 * Hook to handle leave-related actions
 * Manages creating and removing leave entries when the leave action is toggled
 */
export const useLeaveActions = ({ userId }: UseLeaveActionsOptions = {}) => {
  const { createEntry, getDayEntries, deleteEntry } = useTimeEntryContext();
  const { getUserSchedule } = useWorkSchedule();
  
  /**
   * Creates a leave entry for the specified date
   */
  const createLeaveEntry = useCallback(async (date: Date, userId: string) => {
    if (!userId) {
      logger.warn('Cannot create leave entry: No user ID provided');
      return null;
    }
    
    try {
      // Get user's schedule to calculate scheduled hours
      const userSchedule = getUserSchedule(userId);
      if (!userSchedule) {
        logger.warn(`No work schedule found for user ${userId}`);
        return null;
      }
      
      // Calculate scheduled hours for the day
      const scheduledHours = calculateDailyScheduledHours(date, userSchedule);
      if (scheduledHours <= 0) {
        logger.warn(`No scheduled hours for date ${format(date, 'yyyy-MM-dd')}`);
        return null;
      }
      
      logger.debug(`Creating leave entry for ${format(date, 'yyyy-MM-dd')} with ${scheduledHours} hours`);
      
      // Create the leave entry
      const entryId = createEntry({
        userId,
        date,
        jobNumber: 'LEAVE',
        project: 'Annual Leave',
        hours: scheduledHours,
        description: 'Annual Leave',
        entryType: 'LEAVE'
      });
      
      if (entryId) {
        logger.debug(`Leave entry created successfully: ${entryId}`);
        
        // Notify that a leave entry was created
        timeEventsService.publish(WORK_HOURS_EVENTS.CHANGED, {
          userId,
          date: format(date, 'yyyy-MM-dd'),
          actionType: 'leave',
          entryId,
          hours: scheduledHours,
          timestamp: Date.now()
        });
        
        return entryId;
      } else {
        logger.error('Failed to create leave entry');
        return null;
      }
    } catch (error) {
      logger.error('Error creating leave entry:', error);
      return null;
    }
  }, [createEntry, getUserSchedule]);
  
  /**
   * Removes any leave entries for the specified date
   */
  const removeLeaveEntries = useCallback(async (date: Date, userId: string) => {
    if (!userId) {
      logger.warn('Cannot remove leave entries: No user ID provided');
      return false;
    }
    
    try {
      // Get all entries for the day
      const dayEntries = getDayEntries(date);
      
      // Find leave entries
      const leaveEntries = dayEntries.filter(entry => 
        entry.userId === userId && 
        (entry.jobNumber === 'LEAVE' || entry.entryType === 'LEAVE')
      );
      
      if (leaveEntries.length === 0) {
        logger.debug(`No leave entries found for date ${format(date, 'yyyy-MM-dd')}`);
        return true;
      }
      
      logger.debug(`Removing ${leaveEntries.length} leave entries for ${format(date, 'yyyy-MM-dd')}`);
      
      // Delete each leave entry
      const results = await Promise.all(
        leaveEntries.map(entry => deleteEntry(entry.id))
      );
      
      const allDeleted = results.every(Boolean);
      
      if (allDeleted) {
        logger.debug('All leave entries removed successfully');
        
        // Notify that leave entries were removed
        timeEventsService.publish(WORK_HOURS_EVENTS.CHANGED, {
          userId,
          date: format(date, 'yyyy-MM-dd'),
          actionType: 'leave-removed',
          timestamp: Date.now()
        });
      } else {
        logger.warn('Some leave entries failed to be removed');
      }
      
      return allDeleted;
    } catch (error) {
      logger.error('Error removing leave entries:', error);
      return false;
    }
  }, [getDayEntries, deleteEntry]);
  
  /**
   * Handles the leave action toggle event
   */
  const handleLeaveToggle = useCallback(async (event: any) => {
    // Extract event data
    const { userId: eventUserId, date: dateString, actionType, isActive } = event;
    const relevantUserId = eventUserId || userId;
    
    if (actionType !== 'leave' || !relevantUserId || !dateString) {
      return;
    }
    
    const date = new Date(dateString);
    
    logger.debug(`Leave toggle event: ${isActive ? 'ON' : 'OFF'} for ${dateString}`);
    
    if (isActive) {
      // Create leave entry when toggled on
      await createLeaveEntry(date, relevantUserId);
    } else {
      // Remove leave entries when toggled off
      await removeLeaveEntries(date, relevantUserId);
    }
  }, [userId, createLeaveEntry, removeLeaveEntries]);
  
  /**
   * Checks if a date has leave entries
   */
  const hasLeaveEntries = useCallback((date: Date, checkUserId?: string) => {
    const effectiveUserId = checkUserId || userId;
    if (!effectiveUserId) return false;
    
    const dayEntries = getDayEntries(date);
    
    return dayEntries.some(entry => 
      entry.userId === effectiveUserId && 
      (entry.jobNumber === 'LEAVE' || entry.entryType === 'LEAVE')
    );
  }, [userId, getDayEntries]);
  
  return {
    createLeaveEntry,
    removeLeaveEntries,
    handleLeaveToggle,
    hasLeaveEntries
  };
};

export default useLeaveActions;
