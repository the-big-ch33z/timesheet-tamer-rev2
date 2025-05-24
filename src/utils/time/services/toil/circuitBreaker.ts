
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TOIL-CircuitBreaker');

export interface CircuitBreakerStatus {
  globallyDisabled: boolean;
  calculationsInProgress: number;
  lastCalculationTime: number;
  consecutiveFailures: number;
}

/**
 * ENHANCED: Circuit breaker for TOIL calculations with bypass mode
 * Now supports bypassing for critical operations like post-deletion regeneration
 */
class TOILCircuitBreaker {
  private globallyDisabled = false;
  private calculationsInProgress = new Map<string, number>();
  private lastCalculationTime = new Map<string, number>();
  private consecutiveFailures = new Map<string, number>();
  private bypassMode = false; // NEW: Bypass mode for critical operations

  private readonly MAX_CONCURRENT = 3;
  private readonly MIN_INTERVAL = 1000; // 1 second
  private readonly MAX_FAILURES = 5;

  /**
   * NEW: Enable bypass mode for critical operations
   */
  public enableBypassMode(): void {
    console.log(`[TOIL-DEBUG] 🔓 Circuit breaker bypass mode ENABLED`);
    this.bypassMode = true;
    logger.debug('Circuit breaker bypass mode enabled');
  }

  /**
   * NEW: Disable bypass mode
   */
  public disableBypassMode(): void {
    console.log(`[TOIL-DEBUG] 🔒 Circuit breaker bypass mode DISABLED`);
    this.bypassMode = false;
    logger.debug('Circuit breaker bypass mode disabled');
  }

  /**
   * ENHANCED: Check if calculation can proceed (with bypass support)
   */
  public canCalculate(userId: string, contextKey: string = 'default'): boolean {
    // BYPASS: Allow calculations in bypass mode
    if (this.bypassMode) {
      console.log(`[TOIL-DEBUG] ✅ Circuit breaker bypassed for ${userId}-${contextKey}`);
      return true;
    }

    if (this.globallyDisabled) {
      console.log(`[TOIL-DEBUG] ❌ Circuit breaker globally disabled for ${userId}-${contextKey}`);
      logger.debug(`Circuit breaker globally disabled, blocking calculation for ${userId}-${contextKey}`);
      return false;
    }

    const key = `${userId}-${contextKey}`;
    const inProgress = this.calculationsInProgress.get(key) || 0;
    const lastTime = this.lastCalculationTime.get(key) || 0;
    const failures = this.consecutiveFailures.get(key) || 0;

    // Check concurrent calculations
    if (inProgress >= this.MAX_CONCURRENT) {
      console.log(`[TOIL-DEBUG] ❌ Too many concurrent calculations for ${key}: ${inProgress}`);
      logger.debug(`Too many concurrent calculations for ${key}: ${inProgress}`);
      return false;
    }

    // Check minimum interval
    const now = Date.now();
    if (now - lastTime < this.MIN_INTERVAL) {
      console.log(`[TOIL-DEBUG] ❌ Too frequent calculations for ${key}: ${now - lastTime}ms`);
      logger.debug(`Too frequent calculations for ${key}: ${now - lastTime}ms`);
      return false;
    }

    // Check consecutive failures
    if (failures >= this.MAX_FAILURES) {
      console.log(`[TOIL-DEBUG] ❌ Too many consecutive failures for ${key}: ${failures}`);
      logger.debug(`Too many consecutive failures for ${key}: ${failures}`);
      return false;
    }

    console.log(`[TOIL-DEBUG] ✅ Circuit breaker allows calculation for ${key}`);
    return true;
  }

  /**
   * Start a calculation
   */
  public startCalculation(userId: string, contextKey: string = 'default'): void {
    const key = `${userId}-${contextKey}`;
    const current = this.calculationsInProgress.get(key) || 0;
    this.calculationsInProgress.set(key, current + 1);
    this.lastCalculationTime.set(key, Date.now());
    
    console.log(`[TOIL-DEBUG] 🔄 Started calculation for ${key}, in progress: ${current + 1}`);
    logger.debug(`Started calculation for ${key}, in progress: ${current + 1}`);
  }

  /**
   * Finish a calculation (success)
   */
  public finishCalculation(userId: string, contextKey: string = 'default'): void {
    const key = `${userId}-${contextKey}`;
    const current = this.calculationsInProgress.get(key) || 0;
    this.calculationsInProgress.set(key, Math.max(0, current - 1));
    
    // Reset failures on success
    this.consecutiveFailures.set(key, 0);
    
    console.log(`[TOIL-DEBUG] ✅ Finished calculation for ${key}, in progress: ${Math.max(0, current - 1)}`);
    logger.debug(`Finished calculation for ${key}, in progress: ${Math.max(0, current - 1)}`);
  }

  /**
   * Record a calculation failure
   */
  public recordFailure(userId: string, contextKey: string = 'default'): void {
    const key = `${userId}-${contextKey}`;
    const current = this.calculationsInProgress.get(key) || 0;
    this.calculationsInProgress.set(key, Math.max(0, current - 1));
    
    // Increment failures
    const failures = this.consecutiveFailures.get(key) || 0;
    this.consecutiveFailures.set(key, failures + 1);
    
    console.log(`[TOIL-DEBUG] ❌ Recorded failure for ${key}, failures: ${failures + 1}`);
    logger.debug(`Recorded failure for ${key}, failures: ${failures + 1}`);
  }

  /**
   * Stop all calculations globally
   */
  public stopAllCalculations(): void {
    this.globallyDisabled = true;
    console.log(`[TOIL-DEBUG] ⏹️ All TOIL calculations stopped globally`);
    logger.info('All TOIL calculations stopped globally');
  }

  /**
   * Resume calculations globally
   */
  public resumeCalculations(): void {
    this.globallyDisabled = false;
    this.calculationsInProgress.clear();
    this.consecutiveFailures.clear();
    console.log(`[TOIL-DEBUG] ▶️ TOIL calculations resumed globally`);
    logger.info('TOIL calculations resumed globally');
  }

  /**
   * Get current status
   */
  public getStatus(): CircuitBreakerStatus {
    const totalInProgress = Array.from(this.calculationsInProgress.values())
      .reduce((sum, count) => sum + count, 0);
    
    return {
      globallyDisabled: this.globallyDisabled,
      calculationsInProgress: totalInProgress,
      lastCalculationTime: Math.max(...Array.from(this.lastCalculationTime.values()), 0),
      consecutiveFailures: Math.max(...Array.from(this.consecutiveFailures.values()), 0)
    };
  }

  /**
   * Reset circuit breaker state
   */
  public reset(): void {
    this.globallyDisabled = false;
    this.bypassMode = false;
    this.calculationsInProgress.clear();
    this.lastCalculationTime.clear();
    this.consecutiveFailures.clear();
    console.log(`[TOIL-DEBUG] 🔄 Circuit breaker reset`);
    logger.info('Circuit breaker reset');
  }
}

// Export singleton instance
export const toilCircuitBreaker = new TOILCircuitBreaker();
