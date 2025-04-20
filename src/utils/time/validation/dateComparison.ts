
import { isValidDate } from './dateValidation';
import { format } from 'date-fns';
import { createTimeLogger } from '../errors';

const logger = createTimeLogger('dateComparison');

/**
 * Consistently compare two dates to determine if they represent the same day
 * Uses a normalized format (YYYY-MM-DD) for string comparison to avoid timezone issues
 */
export const isSameDayConsistent = (dateA: Date | string | null | undefined, dateB: Date | string | null | undefined): boolean => {
  try {
    // Convert to Date objects
    const dateObjA = dateA instanceof Date ? dateA : dateA ? new Date(dateA) : null;
    const dateObjB = dateB instanceof Date ? dateB : dateB ? new Date(dateB) : null;
    
    // Both must be valid dates
    if (!dateObjA || !dateObjB || !isValidDate(dateObjA) || !isValidDate(dateObjB)) {
      return false;
    }
    
    // Compare using local date format for most reliable day comparison
    // This should work regardless of time zones
    const formatA = format(dateObjA, 'yyyy-MM-dd');
    const formatB = format(dateObjB, 'yyyy-MM-dd');
    
    return formatA === formatB;
  } catch (err) {
    logger.error('Error comparing dates:', err);
    return false;
  }
};

/**
 * Debug utility to log detailed information about date comparison
 */
export const logDateComparison = (dateA: any, dateB: any, context: string): void => {
  const dateObjA = dateA instanceof Date ? dateA : dateA ? new Date(dateA) : null;
  const dateObjB = dateB instanceof Date ? dateB : dateB ? new Date(dateB) : null;
  
  logger.debug(`Date comparison [${context}]:`, {
    dateA: dateA ? (dateA instanceof Date ? dateA.toISOString() : dateA) : 'null',
    dateB: dateB ? (dateB instanceof Date ? dateB.toISOString() : dateB) : 'null',
    dateObjA: dateObjA ? dateObjA.toISOString() : 'invalid date',
    dateObjB: dateObjB ? dateObjB.toISOString() : 'invalid date',
    areSameDay: dateObjA && dateObjB ? isSameDayConsistent(dateObjA, dateObjB) : false
  });
};
