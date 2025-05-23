
/**
 * @file TOIL Processing Service
 * This file now re-exports the modular implementation
 */

// Re-export the main processing service
export { TOILServiceProcessing } from './processing/index';

// Export individual components for advanced usage if needed
export { TOILProcessingCore } from './processing/core';
export { TOILProcessingStateManager } from './processing/state-management';
export { TOILProcessingSubmissions } from './processing/submissions';
export { TOILProcessingTesting } from './processing/testing';
