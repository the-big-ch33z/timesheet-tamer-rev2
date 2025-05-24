
import { useEffect } from 'react';
import { TimeEntry, WorkSchedule } from '@/types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('useToilEffects');

/**
 * Interface for the useToilEffects parameters
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
  
  // Status flags - simplified
  hasEntries?: boolean; // Whether there are entries for the day
  leaveActive?: boolean; // Whether leave is active for the day
  
  // Functions
  calculateToilForDay: () => Promise<void>; // Function to trigger TOIL calculation
}

/**
 * Hook that handles side effects for TOIL calculations
 * SIMPLIFIED: Now triggers TOIL calculations more aggressively
 * 
 * TOIL is calculated when:
 * 1. We have entries for the day (hasEntries or entries.length > 0)
 * 2. No leave is active (leaveActive is false)
 * 
 * Removed restrictive conditions: isComplete and toilActive are no longer required
 */
export const useToilEffects = ({
  userId,
  date,
  entries,
  schedule,
  hasEntries: explicitHasEntries,
  leaveActive = false,
  calculateToilForDay,
  entriesCount
}: UseToilEffectsProps) => {
  // Determine if we have entries, either from the explicit flag or by checking entries array
  const hasEntries = explicitHasEntries !== undefined 
    ? explicitHasEntries 
    : (entries && entries.length > 0);
  
  // SIMPLIFIED: Trigger TOIL calculation when entries exist and no leave is active
  useEffect(() => {
    // Only calculate if:
    // 1. We have entries
    // 2. No leave is active
    // REMOVED: isComplete and toilActive conditions that were too restrictive
    if (hasEntries && !leaveActive) {
      logger.debug(
        `[useToilEffects] Auto-calculating TOIL for day: ${date.toISOString().split('T')[0]}, ` +
        `entriesCount: ${entries?.length || 0}`
      );
      
      calculateToilForDay().catch(error => {
        logger.error('TOIL calculation failed:', error);
      });
    } else {
      logger.debug(
        `[useToilEffects] Skipping TOIL calculation: hasEntries=${hasEntries}, leaveActive=${leaveActive}`
      );
    }
  }, [
    hasEntries, 
    leaveActive, 
    date, 
    calculateToilForDay, 
    entriesCount
  ]);
};

export default useToilEffects;
