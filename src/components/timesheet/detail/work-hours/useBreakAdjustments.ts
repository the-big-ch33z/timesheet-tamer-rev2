
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
      if (actionStates.lunch && hasLunchBreakInSchedule) {
        adjustment -= 0.5; // Subtract 30 minutes for lunch
      }
      
      // Apply smoko break adjustment if toggled and part of schedule
      if (actionStates.smoko && hasSmokoBreakInSchedule) {
        adjustment -= 0.25; // Subtract 15 minutes for smoko
      }
    }
    
    return adjustment;
  }, [startTime, endTime, actionStates.lunch, actionStates.smoko, hasLunchBreakInSchedule, hasSmokoBreakInSchedule]);

  const breakConfig: BreakConfig = {
    lunch: hasLunchBreakInSchedule,
    smoko: hasSmokoBreakInSchedule
  };

  return {
    breakAdjustment: calculateAdjustedHours,
    breakConfig
  };
};
