
import { useMemo } from 'react';
import { BreakConfig } from './types';

/**
 * Options for the useBreakAdjustments hook
 */
export interface BreakAdjustmentsOptions {
  /** Start time in HH:MM format */
  startTime: string;
  /** End time in HH:MM format */
  endTime: string;
  /** Record of action states (toggles) */
  actionStates: Record<string, boolean>;
  /** Whether lunch break is included in schedule */
  hasLunchBreakInSchedule: boolean;
  /** Whether smoko break is included in schedule */
  hasSmokoBreakInSchedule: boolean;
}

/**
 * Hook to calculate break adjustments for work hours
 * 
 * Calculates how breaks affect the total work hours and provides
 * configuration for displaying break indicators.
 * 
 * @param {BreakAdjustmentsOptions} options - Break adjustment options
 * @returns {Object} Break adjustment values and configurations
 */
export const useBreakAdjustments = ({
  startTime,
  endTime,
  actionStates,
  hasLunchBreakInSchedule,
  hasSmokoBreakInSchedule
}: BreakAdjustmentsOptions) => {
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
