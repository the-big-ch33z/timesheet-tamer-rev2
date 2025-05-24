
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
 * Enhanced rate limiting utility with progressive debouncing for TOIL operations
 */
export class RateLimiter {
  private lastOperationTime = 0;
  private readonly debounceMs: number;
  private operationCount = 0;
  private readonly resetInterval = 5000; // Reset count every 5 seconds
  private lastResetTime = 0;
  
  constructor(debounceMs: number = 300) {
    this.debounceMs = debounceMs;
    this.lastResetTime = Date.now();
  }
  
  canProceed(): boolean {
    const now = Date.now();
    
    // Reset operation count periodically
    if (now - this.lastResetTime > this.resetInterval) {
      this.operationCount = 0;
      this.lastResetTime = now;
    }
    
    // Calculate progressive debounce time based on operation frequency
    const progressiveDelay = this.debounceMs + (this.operationCount * 50); // Add 50ms per recent operation
    const maxDelay = this.debounceMs * 3; // Cap at 3x original delay
    const effectiveDelay = Math.min(progressiveDelay, maxDelay);
    
    if (now - this.lastOperationTime < effectiveDelay) {
      logger.debug(`Rate limited: need to wait ${effectiveDelay}ms, only ${now - this.lastOperationTime}ms elapsed`);
      return false;
    }
    
    this.lastOperationTime = now;
    this.operationCount++;
    return true;
  }
  
  reset(): void {
    this.lastOperationTime = 0;
    this.operationCount = 0;
    this.lastResetTime = Date.now();
  }
  
  /**
   * Get current effective delay for monitoring
   */
  getEffectiveDelay(): number {
    const progressiveDelay = this.debounceMs + (this.operationCount * 50);
    return Math.min(progressiveDelay, this.debounceMs * 3);
  }
}
