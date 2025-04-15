
import { createTimeLogger } from '../time/errors/timeLogger';
import { timeEntryService } from '../time/services/timeEntryService';
import { unifiedTimeEntryService } from '../time/services/unifiedTimeEntryService';

const logger = createTimeLogger('PreDeploymentValidation');

/**
 * Types of validation checks
 */
export type ValidationType = 
  | 'schema'
  | 'dataIntegrity'
  | 'stateConsistency'
  | 'typeChecks'
  | 'requiredFields'
  | 'crossComponentDependencies';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  type: ValidationType;
  component: string;
  message?: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
}

/**
 * Pre-deployment validation
 * Runs various validation checks before deployment
 */
export class PreDeploymentValidator {
  private results: ValidationResult[] = [];
  
  /**
   * Run all validation checks
   */
  public async validateAll(): Promise<ValidationResult[]> {
    this.results = [];
    
    // Run all validation checks
    await this.validateStorage();
    await this.validateComponentDependencies();
    await this.validateTypes();
    this.validateTimeEntrySchemas();
    
    return this.results;
  }
  
  /**
   * Validate storage integrity
   */
  private async validateStorage(): Promise<void> {
    try {
      // Check localStorage access
      const testKey = '_test_storage_access';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved !== 'test') {
        this.addResult({
          valid: false,
          type: 'dataIntegrity',
          component: 'storage',
          message: 'Storage access test failed - values cannot be correctly retrieved',
          severity: 'error'
        });
      }
      
      // Check existing storage keys
      const timeEntries = localStorage.getItem('timeEntries');
      if (!timeEntries) {
        this.addResult({
          valid: true,
          type: 'dataIntegrity',
          component: 'timeEntries',
          message: 'No time entries found in storage - this is normal for new installs',
          severity: 'info'
        });
      } else {
        try {
          // Check if entries are valid JSON
          const parsedEntries = JSON.parse(timeEntries);
          
          // Check if entries are an array
          if (!Array.isArray(parsedEntries)) {
            this.addResult({
              valid: false,
              type: 'schema',
              component: 'timeEntries',
              message: 'Time entries storage is not an array',
              severity: 'error',
              details: { type: typeof parsedEntries }
            });
          } else {
            this.addResult({
              valid: true,
              type: 'dataIntegrity',
              component: 'timeEntries',
              message: `Found ${parsedEntries.length} time entries in storage`,
              severity: 'info',
              details: { count: parsedEntries.length }
            });
          }
        } catch (error) {
          this.addResult({
            valid: false,
            type: 'dataIntegrity',
            component: 'timeEntries',
            message: 'Time entries storage contains invalid JSON',
            severity: 'error',
            details: { error }
          });
        }
      }
    } catch (error) {
      this.addResult({
        valid: false,
        type: 'dataIntegrity',
        component: 'storage',
        message: 'Storage access test failed with exception',
        severity: 'error',
        details: { error }
      });
    }
  }
  
  /**
   * Validate component dependencies
   */
  private async validateComponentDependencies(): Promise<void> {
    // Check that required hooks can be initialized without error
    try {
      const testMethod = unifiedTimeEntryService.getAllEntries;
      if (typeof testMethod !== 'function') {
        this.addResult({
          valid: false,
          type: 'crossComponentDependencies',
          component: 'unifiedTimeEntryService',
          message: 'Unified time entry service is missing required methods',
          severity: 'error'
        });
      } else {
        this.addResult({
          valid: true,
          type: 'crossComponentDependencies',
          component: 'unifiedTimeEntryService',
          message: 'Unified time entry service has required methods',
          severity: 'info'
        });
      }
    } catch (error) {
      this.addResult({
        valid: false,
        type: 'crossComponentDependencies',
        component: 'unifiedTimeEntryService',
        message: 'Error initializing unified time entry service',
        severity: 'error',
        details: { error }
      });
    }
    
    // Legacy service check for backward compatibility
    try {
      if (typeof timeEntryService.getAllEntries !== 'function') {
        this.addResult({
          valid: false,
          type: 'crossComponentDependencies',
          component: 'legacyTimeEntryService',
          message: 'Legacy time entry service is missing required methods',
          severity: 'warning'
        });
      }
    } catch (error) {
      this.addResult({
        valid: false,
        type: 'crossComponentDependencies',
        component: 'legacyTimeEntryService',
        message: 'Error initializing legacy time entry service',
        severity: 'warning',
        details: { error }
      });
    }
  }
  
  /**
   * Validate type integrity
   */
  private async validateTypes(): Promise<void> {
    // This would normally use TypeScript's compiler API to validate types at runtime
    // For now, we'll implement a simpler check
    
    // Verify that the unified service implements all methods from the legacy service
    const legacyMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(timeEntryService));
    const unifiedMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(unifiedTimeEntryService));
    
    const missingMethods = legacyMethods.filter(method => 
      !unifiedMethods.includes(method) && 
      typeof (timeEntryService as any)[method] === 'function' &&
      method !== 'constructor'
    );
    
    if (missingMethods.length > 0) {
      this.addResult({
        valid: false,
        type: 'typeChecks',
        component: 'unifiedTimeEntryService',
        message: `Unified service is missing methods from legacy service: ${missingMethods.join(', ')}`,
        severity: 'warning',
        details: { missingMethods }
      });
    } else {
      this.addResult({
        valid: true,
        type: 'typeChecks',
        component: 'unifiedTimeEntryService',
        message: 'Unified service implements all legacy service methods',
        severity: 'info'
      });
    }
  }
  
  /**
   * Validate time entry schemas
   */
  private validateTimeEntrySchemas(): void {
    try {
      const allEntries = timeEntryService.getAllEntries();
      
      // Check for invalid entries
      const invalidEntries = allEntries.filter(entry => {
        const validation = timeEntryService.validateEntry(entry);
        return !validation.valid;
      });
      
      if (invalidEntries.length > 0) {
        this.addResult({
          valid: false,
          type: 'schema',
          component: 'timeEntries',
          message: `Found ${invalidEntries.length} invalid time entries`,
          severity: 'warning',
          details: { count: invalidEntries.length }
        });
      } else {
        this.addResult({
          valid: true,
          type: 'schema',
          component: 'timeEntries',
          message: 'All time entries are valid',
          severity: 'info'
        });
      }
      
      // Check for entries with missing required fields
      const entriesWithMissingFields = allEntries.filter(entry => {
        return !entry.id || !entry.userId || !entry.date || entry.hours === undefined;
      });
      
      if (entriesWithMissingFields.length > 0) {
        this.addResult({
          valid: false,
          type: 'requiredFields',
          component: 'timeEntries',
          message: `Found ${entriesWithMissingFields.length} entries with missing required fields`,
          severity: 'warning',
          details: { count: entriesWithMissingFields.length }
        });
      }
    } catch (error) {
      this.addResult({
        valid: false,
        type: 'schema',
        component: 'timeEntries',
        message: 'Error validating time entry schemas',
        severity: 'error',
        details: { error }
      });
    }
  }
  
  /**
   * Add a validation result
   */
  private addResult(result: ValidationResult): void {
    this.results.push(result);
    
    // Log the result
    const logMethod = result.valid ? logger.debug : (
      result.severity === 'error' ? logger.error : 
      result.severity === 'warning' ? logger.warn : 
      logger.info
    );
    
    logMethod(`[${result.type}] ${result.message}`);
  }
  
  /**
   * Get validation errors
   */
  public getErrors(): ValidationResult[] {
    return this.results.filter(result => !result.valid && result.severity === 'error');
  }
  
  /**
   * Get validation warnings
   */
  public getWarnings(): ValidationResult[] {
    return this.results.filter(result => !result.valid && result.severity === 'warning');
  }
  
  /**
   * Check if validation passed
   */
  public hasPassed(): boolean {
    return this.getErrors().length === 0;
  }
  
  /**
   * Run validation and get a report
   */
  public static async validate(): Promise<{
    passed: boolean;
    results: ValidationResult[];
    errors: ValidationResult[];
    warnings: ValidationResult[];
  }> {
    const validator = new PreDeploymentValidator();
    const results = await validator.validateAll();
    
    return {
      passed: validator.hasPassed(),
      results,
      errors: validator.getErrors(),
      warnings: validator.getWarnings()
    };
  }
  
  /**
   * Run validation and log results
   */
  public static async validateAndLog(): Promise<boolean> {
    const { passed, errors, warnings } = await this.validate();
    
    if (!passed) {
      logger.error(`Validation failed with ${errors.length} errors and ${warnings.length} warnings`);
      errors.forEach(error => {
        logger.error(`[${error.type}] ${error.message}`, error.details);
      });
      warnings.forEach(warning => {
        logger.warn(`[${warning.type}] ${warning.message}`, warning.details);
      });
    } else if (warnings.length > 0) {
      logger.warn(`Validation passed with ${warnings.length} warnings`);
      warnings.forEach(warning => {
        logger.warn(`[${warning.type}] ${warning.message}`, warning.details);
      });
    } else {
      logger.info('Validation passed with no issues');
    }
    
    return passed;
  }
}

// Export a singleton instance
export const preDeploymentValidator = new PreDeploymentValidator();
