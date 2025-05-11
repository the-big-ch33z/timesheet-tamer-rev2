
/**
 * This file re-exports variance calculation functions from the main timeCalculations.ts
 * to maintain backward compatibility.
 */

export { 
  calculateHoursVariance, 
  isUndertime, 
  safeCalculateVariance 
} from './timeCalculations';
