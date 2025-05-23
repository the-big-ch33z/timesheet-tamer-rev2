
/**
 * @file Main service implementation file
 * This file now re-exports the full implementation from the modular service files
 */

// Re-export the main service
export { TOILService } from './service/main';

// Re-export the toilService instance from factory
export { toilService } from './service/factory';

// Re-export individual service classes for advanced usage
export { TOILServiceCore } from './service/core';
export { TOILServiceCalculation } from './service/calculation';
export { TOILServiceUsage } from './service/usage';
export { TOILServiceProcessing } from './service/processing';
export { TOILServiceSettings } from './service/settings';
export { TOILServiceInitializer } from './service/initializer';
export { TOILServiceQueueManagement } from './service/queue-management';

// Log module initialization for debugging
console.log('[TOIL-SERVICE] Service module initialized');
