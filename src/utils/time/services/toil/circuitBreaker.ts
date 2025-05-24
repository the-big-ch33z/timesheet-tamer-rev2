
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOILCircuitBreaker');

interface CalculationAttempt {
  timestamp: number;
  userId: string;
  monthYear: string;
}

class TOILCircuitBreaker {
  private static instance: TOILCircuitBreaker;
  private recentAttempts: CalculationAttempt[] = [];
  private calculationsInProgress = new Set<string>();
  private isGloballyDisabled = false;
  private readonly MIN_CALCULATION_INTERVAL = 2000; // 2 seconds
  private readonly MAX_ATTEMPTS_PER_MINUTE = 10;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  constructor() {
    // Clean up old attempts periodically
    setInterval(() => this.cleanupOldAttempts(), this.CLEANUP_INTERVAL);
  }

  static getInstance(): TOILCircuitBreaker {
    if (!TOILCircuitBreaker.instance) {
      TOILCircuitBreaker.instance = new TOILCircuitBreaker();
    }
    return TOILCircuitBreaker.instance;
  }

  /**
   * Check if a calculation should proceed
   */
  canCalculate(userId: string, monthYear: string): boolean {
    if (this.isGloballyDisabled) {
      logger.debug('TOIL calculations globally disabled');
      return false;
    }

    const key = `${userId}-${monthYear}`;
    
    // Check if calculation is already in progress
    if (this.calculationsInProgress.has(key)) {
      logger.debug(`TOIL calculation already in progress for ${key}`);
      return false;
    }

    const now = Date.now();
    
    // Check recent attempts for this specific user/month
    const recentForUser = this.recentAttempts.filter(
      attempt => attempt.userId === userId && 
                 attempt.monthYear === monthYear &&
                 now - attempt.timestamp < this.MIN_CALCULATION_INTERVAL
    );

    if (recentForUser.length > 0) {
      logger.debug(`Too soon for another TOIL calculation for ${key}, last was ${now - recentForUser[0].timestamp}ms ago`);
      return false;
    }

    // Check if too many attempts in the last minute
    const recentAttemptsCount = this.recentAttempts.filter(
      attempt => now - attempt.timestamp < 60000
    ).length;

    if (recentAttemptsCount >= this.MAX_ATTEMPTS_PER_MINUTE) {
      logger.warn(`Too many TOIL calculation attempts (${recentAttemptsCount}), blocking for rate limiting`);
      return false;
    }

    return true;
  }

  /**
   * Register that a calculation is starting
   */
  startCalculation(userId: string, monthYear: string): void {
    const key = `${userId}-${monthYear}`;
    this.calculationsInProgress.add(key);
    this.recentAttempts.push({
      timestamp: Date.now(),
      userId,
      monthYear
    });
    
    logger.debug(`Started TOIL calculation for ${key}, ${this.calculationsInProgress.size} calculations in progress`);
  }

  /**
   * Register that a calculation has finished
   */
  finishCalculation(userId: string, monthYear: string): void {
    const key = `${userId}-${monthYear}`;
    this.calculationsInProgress.delete(key);
    logger.debug(`Finished TOIL calculation for ${key}, ${this.calculationsInProgress.size} calculations remaining`);
  }

  /**
   * Stop all TOIL calculations
   */
  stopAllCalculations(): void {
    this.isGloballyDisabled = true;
    this.calculationsInProgress.clear();
    logger.warn('All TOIL calculations have been stopped');
  }

  /**
   * Resume TOIL calculations
   */
  resumeCalculations(): void {
    this.isGloballyDisabled = false;
    logger.info('TOIL calculations have been resumed');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      globallyDisabled: this.isGloballyDisabled,
      calculationsInProgress: this.calculationsInProgress.size,
      recentAttempts: this.recentAttempts.length,
      inProgressKeys: Array.from(this.calculationsInProgress)
    };
  }

  /**
   * Clean up old attempts
   */
  private cleanupOldAttempts(): void {
    const now = Date.now();
    const before = this.recentAttempts.length;
    this.recentAttempts = this.recentAttempts.filter(
      attempt => now - attempt.timestamp < 300000 // Keep last 5 minutes
    );
    
    if (this.recentAttempts.length !== before) {
      logger.debug(`Cleaned up ${before - this.recentAttempts.length} old calculation attempts`);
    }
  }

  /**
   * Force clear all state (for debugging)
   */
  reset(): void {
    this.calculationsInProgress.clear();
    this.recentAttempts = [];
    this.isGloballyDisabled = false;
    logger.info('Circuit breaker reset');
  }
}

export const toilCircuitBreaker = TOILCircuitBreaker.getInstance();
