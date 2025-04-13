
/**
 * Calculations utilities index file
 * This file exports all calculation utilities in a way that allows for tree-shaking
 * This helps reduce bundle size by only including the functions that are actually used
 */

// Re-export from our consolidated timeUtils file
export { 
  calculateHoursFromTimes, 
  formatHours,
  calculateHoursVariance,
  isUndertime
} from '../timeUtils';
