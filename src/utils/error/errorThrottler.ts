import { createTimeLogger } from "@/utils/time/errors/timeLogger";

const logger = createTimeLogger('ErrorThrottler');

// Default configuration
const DEFAULT_CONFIG = {
  maxErrorsPerMinute: 5,
  maxErrorsTotal: 20,
  resetWindowMs: 60000, // 1 minute
};

class ErrorThrottler {
  private errors: Array<{ message: string; timestamp: number }> = [];
  private config: typeof DEFAULT_CONFIG;
  private isEnabled: boolean = true;
  private lastErrorTime: number = 0;
  private minimumIntervalMs: number = 1000; // 1 second between errors
  
  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Reset error count periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.resetErrors(), this.config.resetWindowMs);
    }
  }
  
  private resetErrors() {
    const now = Date.now();
    // Keep only errors within the window
    this.errors = this.errors.filter(
      error => now - error.timestamp < this.config.resetWindowMs
    );
    
    logger.debug(`Reset error counter. Current count: ${this.errors.length}`);
  }
  
  /**
   * Check if an error should be reported or suppressed
   */
  public shouldReportError(error: Error): boolean {
    if (!this.isEnabled) return true;
    
    const now = Date.now();
    const errorMessage = error.message || 'Unknown error';
    
    // Check for very recent similar errors (exact duplicates)
    const recentDuplicates = this.errors.filter(
      e => e.message === errorMessage && now - e.timestamp < this.minimumIntervalMs
    );
    
    if (recentDuplicates.length > 0) {
      logger.debug(`Suppressing duplicate error: ${errorMessage}`);
      return false;
    }
    
    // Check rate limits
    const recentErrors = this.errors.filter(
      e => now - e.timestamp < this.config.resetWindowMs
    );
    
    if (recentErrors.length >= this.config.maxErrorsPerMinute) {
      logger.warn(`Error rate limit exceeded: ${recentErrors.length} errors in the last minute`);
      return false;
    }
    
    if (this.errors.length >= this.config.maxErrorsTotal) {
      logger.warn(`Total error limit exceeded: ${this.errors.length} errors`);
      // Remove oldest error to make room for new one
      this.errors.shift();
    }
    
    // Record this error
    this.errors.push({ message: errorMessage, timestamp: now });
    this.lastErrorTime = now;
    
    return true;
  }
  
  /**
   * Enable or disable throttling
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Clear all recorded errors
   */
  public clearErrors(): void {
    this.errors = [];
  }
}

// Export a singleton instance
export const errorThrottler = new ErrorThrottler();

// Export the class for creating specialized instances
export default ErrorThrottler;
