
import { TimeEntry } from '@/types';
import { format, parseISO } from 'date-fns';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('toilCalculationUtils');

/**
 * Groups entries by date for batch processing
 */
export function groupEntriesByDate(entries: TimeEntry[]): Record<string, TimeEntry[]> {
  const grouped: Record<string, TimeEntry[]> = {};
  
  entries.forEach(entry => {
    let entryDate: Date;
    
    // Handle both Date objects and string dates
    if (entry.date instanceof Date) {
      entryDate = entry.date;
    } else if (typeof entry.date === 'string') {
      entryDate = parseISO(entry.date);
    } else {
      logger.warn('Invalid date format in entry:', entry);
      return;
    }
    
    const dateKey = format(entryDate, 'yyyy-MM-dd');
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(entry);
  });
  
  return grouped;
}

/**
 * Validates if required data is present for TOIL calculation
 */
export function validateCalculationData(userId: string, date?: Date, entries?: TimeEntry[]): boolean {
  if (!userId) {
    logger.debug('Missing userId for TOIL calculation');
    return false;
  }
  
  if (!date) {
    logger.debug('Missing date for TOIL calculation');
    return false;
  }
  
  return true;
}

/**
 * Rate limiting utility for TOIL operations
 */
export class RateLimiter {
  private lastOperationTime = 0;
  private readonly debounceMs: number;
  
  constructor(debounceMs: number = 150) {
    this.debounceMs = debounceMs;
  }
  
  canProceed(): boolean {
    const now = Date.now();
    if (now - this.lastOperationTime < this.debounceMs) {
      return false;
    }
    this.lastOperationTime = now;
    return true;
  }
  
  reset(): void {
    this.lastOperationTime = 0;
  }
}
