
import { useMemo } from 'react';
import { BreakConfig } from './types';

export const useBreakAdjustments = (
  startTime: string,
  endTime: string,
  actionStates: Record<string, boolean>,
  hasLunchBreakInSchedule: boolean,
  hasSmokoBreakInSchedule: boolean
) => {
  // Calculate effective total hours with break adjustments
  const calculateAdjustedHours = useMemo(() => {
    // Start with a base adjustment of 0
    let adjustment = 0;
    
    // Only subtract breaks if there's actually a start and end time entered
    if (startTime && endTime) {
      // Apply lunch break adjustment if toggled and part of schedule
      // Only subtract lunch if it's in the schedule AND NOT overridden with the lunch toggle
      if (hasLunchBreakInSchedule && !actionStates.lunch) {
        adjustment -= 0.5; // Subtract 30 minutes for lunch
      }
      
      // Apply smoko break adjustment if toggled and part of schedule
      // Only subtract smoko if it's in the schedule AND NOT overridden with the smoko toggle
      if (hasSmokoBreakInSchedule && !actionStates.smoko) {
        adjustment -= 0.25; // Subtract 15 minutes for smoko
      }
    }
    
    return adjustment;
  }, [startTime, endTime, actionStates.lunch, actionStates.smoko, hasLunchBreakInSchedule, hasSmokoBreakInSchedule]);

  // Base break configuration from the schedule
  const breakConfig: BreakConfig = {
    lunch: hasLunchBreakInSchedule,
    smoko: hasSmokoBreakInSchedule
  };
  
  // Display break configuration that considers both schedule and action states
  // This controls which break flags are displayed in the UI
  const displayBreakConfig: BreakConfig = {
    lunch: hasLunchBreakInSchedule && !actionStates.lunch,
    smoko: hasSmokoBreakInSchedule && !actionStates.smoko
  };

  return {
    breakAdjustment: calculateAdjustedHours,
    breakConfig,
    displayBreakConfig
  };
};
