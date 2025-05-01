
import { createTimeLogger } from "@/utils/time/errors/timeLogger";

const logger = createTimeLogger("ErrorRecovery");

/**
 * Helper to detect and recover from common error states
 */
export class AppStateRecovery {
  private static instance: AppStateRecovery;
  private lastRecoveryAttempt: number = 0;
  private recoveryCount: number = 0;
  private readonly RECOVERY_COOLDOWN_MS = 60000; // 1 minute between recovery attempts
  private readonly MAX_RECOVERY_ATTEMPTS = 3; // Maximum number of automatic recovery attempts
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): AppStateRecovery {
    if (!AppStateRecovery.instance) {
      AppStateRecovery.instance = new AppStateRecovery();
    }
    return AppStateRecovery.instance;
  }
  
  /**
   * Resets problematic localStorage items
   */
  public resetProblematicState(): void {
    const now = Date.now();
    
    // Enforce cooldown between recovery attempts
    if (now - this.lastRecoveryAttempt < this.RECOVERY_COOLDOWN_MS) {
      logger.warn("Recovery attempted too soon, enforcing cooldown");
      return;
    }
    
    // Track recovery attempts
    this.lastRecoveryAttempt = now;
    this.recoveryCount++;
    
    if (this.recoveryCount > this.MAX_RECOVERY_ATTEMPTS) {
      logger.warn(`Exceeded maximum recovery attempts (${this.MAX_RECOVERY_ATTEMPTS})`);
      return;
    }
    
    logger.info(`Performing app state recovery #${this.recoveryCount}`);
    
    try {
      // Clear potentially problematic caches
      localStorage.removeItem('time-entries-cache-timestamp');
      localStorage.removeItem('error-state');
      
      // Only if we're desperate, clear more problematic data
      if (this.recoveryCount >= 3) {
        logger.warn("Performing deep recovery - clearing all timesheet caches");
        localStorage.removeItem('time-entries-cache');
        localStorage.removeItem('timesheet-work-hours');
      }
      
      // Verify auth data integrity
      this.verifyStoredDataIntegrity();
      
      logger.info("Recovery completed successfully");
    } catch (error) {
      logger.error("Error during recovery process:", error);
    }
  }
  
  /**
   * Checks if localStorage contains valid JSON for critical data
   */
  private verifyStoredDataIntegrity(): void {
    const criticalKeys = ['currentUser', 'users', 'teams', 'teamMemberships'];
    
    criticalKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          // Try to parse the data
          JSON.parse(data);
        }
      } catch (error) {
        logger.warn(`Found corrupted data in ${key}, removing it`, error);
        localStorage.removeItem(key);
      }
    });
  }
  
  /**
   * This method can be called from error boundaries to attempt recovery
   */
  public static attemptRecovery(): void {
    const recoveryService = AppStateRecovery.getInstance();
    recoveryService.resetProblematicState();
  }
  
  /**
   * Advanced recovery that forces a page reload
   */
  public static forceReload(): void {
    logger.info("Forcing application reload for recovery");
    
    // Mark that we're in a reload cycle to prevent infinite loops
    localStorage.setItem('app_recovery_reload', Date.now().toString());
    
    // Force page reload
    window.location.reload();
  }
  
  /**
   * Check if we've already tried reloading for recovery
   */
  public static hasRecentlyReloaded(): boolean {
    try {
      const lastReload = localStorage.getItem('app_recovery_reload');
      if (!lastReload) return false;
      
      const reloadTimestamp = parseInt(lastReload, 10);
      const now = Date.now();
      const timeSinceReload = now - reloadTimestamp;
      
      // If we reloaded within the last 30 seconds, consider it recent
      return timeSinceReload < 30000;
    } catch (error) {
      return false;
    }
  }
}

export default AppStateRecovery;
