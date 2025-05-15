
import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors/timeLogger';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { WORK_HOURS_EVENTS } from '@/utils/events/eventTypes';
import { UseWorkHoursOptions } from '../types/workHoursTypes';

const logger = createTimeLogger('useWorkHoursActions');

/**
 * Hook for work hours action management
 * Handles action states like leave, sick, TOIL, etc.
 */
export const useWorkHoursActions = (options: UseWorkHoursOptions = {}) => {
  const { date, userId } = options;
  
  // Action states for leave, TOIL, etc.
  const [actionStates, setActionStates] = useState({
    leave: false,
    sick: false,
    toil: false,
    lunch: false,
    smoko: false
  });
  
  // Toggle action states like leave, sick, TOIL
  const handleToggleAction = useCallback((type: string, scheduledHours: number): void => {
    setActionStates(prev => {
      const newStates = { ...prev };
      
      // Special handling for leave and sick which are mutually exclusive
      if (type === 'leave' || type === 'sick') {
        newStates.leave = type === 'leave' ? !prev.leave : false;
        newStates.sick = type === 'sick' ? !prev.sick : false;
        newStates.toil = false; // Turn off TOIL if leave/sick is enabled
      } 
      // Special handling for TOIL
      else if (type === 'toil') {
        newStates.toil = !prev.toil;
        newStates.leave = false; // Turn off leave if TOIL is enabled
        newStates.sick = false;  // Turn off sick if TOIL is enabled
      }
      // Handle breaks
      else {
        newStates[type] = !prev[type];
      }
      
      return newStates;
    });
    
    // Notify about action state changes
    if (date && userId) {
      timeEventsService.publish(WORK_HOURS_EVENTS.ACTION_TOGGLED, {
        date: format(date, 'yyyy-MM-dd'),
        userId,
        actionType: type,
        scheduledHours,
        timestamp: Date.now()
      });
    }
  }, [date, userId]);

  return {
    actionStates,
    handleToggleAction
  };
};
