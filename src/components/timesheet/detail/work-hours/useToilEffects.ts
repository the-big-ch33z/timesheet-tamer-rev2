
import { useEffect } from "react";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('useToilEffects');

/**
 * Interface for the useToilEffects parameters
 */
export interface UseToilEffectsParams {
  hasEntries: boolean;
  leaveActive: boolean;
  toilActive: boolean;
  isComplete: boolean;
  calculateToilForDay: () => Promise<any>;
  entriesCount: number;
}

/**
 * Hook to manage TOIL calculation effects
 * Sets up an effect to calculate TOIL for the day when conditions are met
 * 
 * @param params - Object containing all necessary parameters
 */
export const useToilEffects = (params: UseToilEffectsParams): void => {
  const { 
    hasEntries, 
    leaveActive, 
    toilActive, 
    isComplete, 
    calculateToilForDay,
    entriesCount
  } = params;

  // Set up TOIL calculation effect
  useEffect(() => {
    // Only calculate TOIL when:
    // 1. We have entries
    // 2. It's not a leave day
    // 3. Hours are complete or we've explicitly marked this as a TOIL day
    if (hasEntries && !leaveActive && (isComplete || toilActive)) {
      logger.debug('TOIL calculation triggered by state change');
      calculateToilForDay().catch(error => {
        logger.error('TOIL calculation failed:', error);
      });
    }
  }, [hasEntries, leaveActive, toilActive, isComplete, calculateToilForDay, entriesCount]);
};

export default useToilEffects;
