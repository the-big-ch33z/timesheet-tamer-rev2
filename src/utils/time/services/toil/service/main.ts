import { createTimeLogger } from "@/utils/time/errors";
import { TOILServiceCore } from "./core";
import { TOILServiceCalculation } from "./calculation";
import { TOILServiceUsage } from "./usage";
import { TOILServiceProcessing } from "./processing";
import { TOILServiceSettings } from "./settings";
import { TOILServiceInitializer } from "./initializer";
import { TOILServiceQueueManagement } from "./queue-management";
import { format } from 'date-fns';
import { TOILSummary } from "@/types/toil";

const logger = createTimeLogger('TOILService');

/**
 * Complete TOIL service that inherits all functionality from specialized service classes
 */
export class TOILService extends TOILServiceCore {
  private calculationService: TOILServiceCalculation;
  private usageService: TOILServiceUsage;
  private processingService: TOILServiceProcessing;
  private settingsService: TOILServiceSettings;
  private initializer: TOILServiceInitializer;
  private queueManager: TOILServiceQueueManagement;
  
  constructor(calculationQueueEnabled: boolean = true) {
    super(calculationQueueEnabled);
    
    // Initialize specialized services
    this.calculationService = new TOILServiceCalculation(calculationQueueEnabled);
    this.usageService = new TOILServiceUsage(calculationQueueEnabled);
    this.processingService = new TOILServiceProcessing(calculationQueueEnabled);
    this.settingsService = new TOILServiceSettings(calculationQueueEnabled);
    this.initializer = new TOILServiceInitializer();
    this.queueManager = new TOILServiceQueueManagement();
    
    logger.debug('TOILService core components initialized');
  }
  
  /**
   * Get TOIL summary for a user for a specific month
   * This is now a synchronous method that returns a TOILSummary object directly
   */
  public getTOILSummary(userId: string, monthYear: string): TOILSummary | null {
    try {
      // Call the parent class's synchronous method that returns TOILSummary directly
      const summary = super.getTOILSummary(userId, monthYear);
      return summary;
    } catch (error) {
      logger.error(`Error getting TOIL summary for ${userId}, ${monthYear}:`, error);
      return null;
    }
  }
  
  // ======= Initialization and caching =======
  public initialize(): void {
    this.initializer.initialize();
  }
  
  public isInitialized(): boolean {
    return this.initializer.isInitialized();
  }
  
  public getInitializationError(): Error | null {
    return this.initializer.getInitializationError();
  }
  
  public clearCache(): void {
    this.initializer.clearCache();
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
    return this.queueManager.getQueueLength();
  }
  
  public isQueueProcessing(): boolean {
    return this.queueManager.isQueueProcessing();
  }
  
  public clearQueue(): void {
    this.queueManager.clearQueue();
  }
}

// Export a singleton instance of the TOILService
export const toilService = new TOILService();
