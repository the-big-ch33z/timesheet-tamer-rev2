import { createTimeLogger } from "@/utils/time/errors";
import { TOILServiceCore } from "./core";
import { TOILServiceCalculation } from "./calculation";
import { TOILServiceUsage } from "./usage";
import { TOILServiceProcessing } from "./processing";
import { TOILServiceSettings } from "./settings";
import { toilQueueManager } from "../queue/TOILQueueManager";
import { clearSummaryCache } from "../storage";

const logger = createTimeLogger('TOILService');

/**
 * Complete TOIL service that inherits all functionality from specialized service classes
 */
export class TOILService extends TOILServiceCore {
  private calculationService: TOILServiceCalculation;
  private usageService: TOILServiceUsage;
  private processingService: TOILServiceProcessing;
  private settingsService: TOILServiceSettings;
  private initialized: boolean = false;
  private initializationError: Error | null = null;
  
  constructor(calculationQueueEnabled: boolean = true) {
    super(calculationQueueEnabled);
    
    // Initialize specialized services
    this.calculationService = new TOILServiceCalculation(calculationQueueEnabled);
    this.usageService = new TOILServiceUsage(calculationQueueEnabled);
    this.processingService = new TOILServiceProcessing(calculationQueueEnabled);
    this.settingsService = new TOILServiceSettings(calculationQueueEnabled);
    
    logger.debug('TOILService core components initialized');
  }
  
  /**
   * Initialize the service and dependent components
   * This should be called once the app is ready
   */
  public initialize(): void {
    if (this.initialized) {
      logger.debug('TOILService already initialized');
      return;
    }
    
    try {
      logger.debug('Initializing TOILService and dependent components');
      
      // Clear any stored cache on initialization
      this.clearCache();
      
      // Initialize the queue manager now that all dependencies are ready
      toilQueueManager.initialize();
      
      this.initialized = true;
      this.initializationError = null;
      logger.debug('TOILService fully initialized');
    } catch (error) {
      logger.error('Error initializing TOILService:', error);
      this.initializationError = error instanceof Error 
        ? error 
        : new Error('Failed to initialize TOIL service: ' + String(error));
      throw this.initializationError;
    }
  }
  
  /**
   * Check if the service is fully initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get the error that occurred during initialization, if any
   */
  public getInitializationError(): Error | null {
    return this.initializationError;
  }
  
  /**
   * Clear all caches
   */
  public clearCache(): void {
    try {
      logger.debug('Clearing all TOIL caches');
      clearSummaryCache(); // Pass no parameters to clear all caches
      logger.debug('Cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }
  
  // ======= Delegation methods for calculation service =======
  public async calculateAndStoreTOIL(...args: Parameters<TOILServiceCalculation['calculateAndStoreTOIL']>) {
    try {
      const result = await this.calculationService.calculateAndStoreTOIL(...args);
      // Clear cache after calculation
      this.clearCache();
      return result;
    } catch (error) {
      logger.error('Error in calculateAndStoreTOIL:', error);
      throw error;
    }
  }
  
  public queueCalculation(...args: Parameters<TOILServiceCalculation['queueCalculation']>) {
    return this.calculationService.queueCalculation(...args);
  }
  
  // ======= Delegation methods for usage service =======
  public async recordTOILUsage(...args: Parameters<TOILServiceUsage['recordTOILUsage']>) {
    try {
      const result = await this.usageService.recordTOILUsage(...args);
      // Clear cache after usage recording
      this.clearCache();
      return result;
    } catch (error) {
      logger.error('Error in recordTOILUsage:', error);
      throw error;
    }
  }
  
  // ======= Delegation methods for processing service =======
  public fetchToilProcessingRecords() {
    return this.processingService.fetchToilProcessingRecords();
  }
  
  public getUserToilProcessingRecords(...args: Parameters<TOILServiceProcessing['getUserToilProcessingRecords']>) {
    return this.processingService.getUserToilProcessingRecords(...args);
  }
  
  public getToilProcessingRecordById(...args: Parameters<TOILServiceProcessing['getToilProcessingRecordById']>) {
    return this.processingService.getToilProcessingRecordById(...args);
  }
  
  public getToilProcessingRecordForMonth(...args: Parameters<TOILServiceProcessing['getToilProcessingRecordForMonth']>) {
    return this.processingService.getToilProcessingRecordForMonth(...args);
  }
  
  public submitToilProcessing(...args: Parameters<TOILServiceProcessing['submitToilProcessing']>) {
    return this.processingService.submitToilProcessing(...args);
  }
  
  public getMonthProcessingState(...args: Parameters<TOILServiceProcessing['getMonthProcessingState']>) {
    return this.processingService.getMonthProcessingState(...args);
  }
  
  public updateMonthProcessingState(...args: Parameters<TOILServiceProcessing['updateMonthProcessingState']>) {
    return this.processingService.updateMonthProcessingState(...args);
  }
  
  // ======= Delegation methods for settings service =======
  public fetchToilThresholds() {
    return this.settingsService.fetchToilThresholds();
  }
  
  public getToilThreshold(employmentType: string): number {
    return this.settingsService.getToilThreshold(employmentType);
  }
  
  public saveToilThresholds(...args: Parameters<TOILServiceSettings['saveToilThresholds']>) {
    return this.settingsService.saveToilThresholds(...args);
  }
  
  public resetToilThresholds() {
    return this.settingsService.resetToilThresholds();
  }
  
  // ======= Queue management helpers =======
  public getQueueLength(): number {
    return toilQueueManager.getQueueLength();
  }
  
  public isQueueProcessing(): boolean {
    return toilQueueManager.isQueueProcessing();
  }
  
  public clearQueue(): void {
    toilQueueManager.clearQueue();
  }
}

// Export a singleton instance of the TOILService
export const toilService = new TOILService();

// Don't automatically start processing the queue here anymore
// Instead, we'll initialize in the correct order elsewhere
