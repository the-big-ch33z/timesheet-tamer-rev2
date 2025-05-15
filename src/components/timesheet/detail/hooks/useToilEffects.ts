
import { useEffect } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useToilEffects');

/**
 * Interface for the useToilEffects parameters
 * Combines the best of both parameter sets, making optional parameters explicit
 */
export interface UseToilEffectsProps {
  // Required parameters
  userId: string;
  date: Date;
  
  // Entry data
  entries: TimeEntry[];
  entriesCount?: number; // Optional counter to trigger recalculation

  // Schedule data
  schedule?: WorkSchedule;
  
  // Status flags
  hasEntries?: boolean; // Whether there are entries for the day
  leaveActive?: boolean; // Whether leave is active for the day
  toilActive?: boolean; // Whether TOIL is being used for the day
  isComplete?: boolean; // Whether the day is marked complete
  
  // Functions
  calculateToilForDay: () => Promise<void>; // Function to trigger TOIL calculation
}

/**
 * Hook that handles side effects for TOIL calculations
 * Automatically triggers TOIL calculations when conditions are met
 * 
 * TOIL is calculated when:
 * 1. We have entries for the day (hasEntries or entries.length > 0)
 * 2. No leave is active (leaveActive is false)
 * 3. Either the day is marked as complete OR TOIL is explicitly marked as active
 */
export const useToilEffects = ({
  userId,
  date,
  entries,
  schedule,
  hasEntries: explicitHasEntries,
  leaveActive = false,
  toilActive = false,
  isComplete = false,
  calculateToilForDay,
  entriesCount
}: UseToilEffectsProps) => {
  // Determine if we have entries, either from the explicit flag or by checking entries array
  const hasEntries = explicitHasEntries !== undefined 
    ? explicitHasEntries 
    : (entries && entries.length > 0);
  
  // Trigger TOIL calculation when entries change and day is complete or TOIL is active
  useEffect(() => {
    // Only calculate if:
    // 1. We have entries
    // 2. No leave is active
    // 3. The day is marked as complete OR TOIL is explicitly marked as active
    if (hasEntries && !leaveActive && (isComplete || toilActive)) {
      logger.debug(
        `[useToilEffects] Auto-calculating TOIL for day: ${date.toISOString().split('T')[0]}, ` +
        `isComplete: ${isComplete}, toilActive: ${toilActive}`
      );
      
      calculateToilForDay().catch(error => {
        logger.error('TOIL calculation failed:', error);
      });
    }
  }, [
    hasEntries, 
    leaveActive, 
    toilActive, 
    isComplete, 
    date, 
    calculateToilForDay, 
    entriesCount
  ]);
};

export default useToilEffects;
