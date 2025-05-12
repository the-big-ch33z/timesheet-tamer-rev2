
/**
 * @fileoverview Re-export with functionality now consolidated in main useWorkHours
 * This file is kept for backward compatibility with existing imports
 */

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { timeEventsService } from '@/utils/time/events/timeEventsService';
import { deprecationWarning } from '@/utils/deprecation/deprecationWarnings';

export const useWorkHoursActions = (date: Date, userId: string) => {
  // Show a deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    deprecationWarning(
      'useWorkHoursActions',
      'This hook is deprecated. Its functionality is now in useWorkHours from @/hooks/timesheet/useWorkHours.'
    );
  }

  const [actionStates, setActionStates] = useState({
    leave: false,
    sick: false,
    toil: false,
    lunch: false,
    smoko: false
  });

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
    timeEventsService.publish('work-hours-action-toggled', {
      date: format(date, 'yyyy-MM-dd'),
      userId,
      actionType: type,
      scheduledHours,
      timestamp: Date.now()
    });
  }, [date, userId]);

  return {
    actionStates,
    handleToggleAction
  };
};

export default useWorkHoursActions;
