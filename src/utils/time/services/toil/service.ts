
/**
 * @file Main service implementation file
 * This file now re-exports the full implementation from the modular service files
 */

// Re-export the main service and instance
export { TOILService, toilService } from './service/main';

// Re-export individual service classes for advanced usage
export { TOILServiceCore } from './service/core';
export { TOILServiceCalculation } from './service/calculation';
export { TOILServiceUsage } from './service/usage';
export { TOILServiceProcessing } from './service/processing';
export { TOILServiceSettings } from './service/settings';

// Log module initialization for debugging
console.log('[TOIL-SERVICE] Service module initialized');
