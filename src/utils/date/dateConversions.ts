
/**
 * Safely converts various date formats to a proper Date object
 * @param input The date input (string, Date object, number timestamp)
 * @returns A valid Date object or null if conversion fails
 */
export const toDate = (input: string | Date | number | undefined | null): Date | null => {
  if (!input) return null;
  
  try {
    // If it's already a Date, just return it
    if (input instanceof Date) return input;
    
    // If it's a number, treat as timestamp
    if (typeof input === 'number') return new Date(input);
    
    // If it's a string, try to parse it
    if (typeof input === 'string') {
      const parsedDate = new Date(input);
      // Check if the date is valid
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    // If we get here, conversion failed
    console.warn('Invalid date conversion input:', input);
    return null;
  } catch (error) {
    console.error('Error converting date:', error);
    return null;
  }
};

/**
 * Creates a new Date object for the current date with time set to 00:00:00
 */
export const today = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

/**
 * Formats a date as an ISO string date (YYYY-MM-DD) without time components
 */
export const toISODateString = (date: Date | string | number | null | undefined): string => {
  const safeDate = toDate(date);
  if (!safeDate) return '';
  
  return safeDate.toISOString().split('T')[0];
};
