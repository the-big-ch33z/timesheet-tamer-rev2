
/**
 * @file Re-export of refactored TOIL service module
 * This maintains backward compatibility with existing imports
 */

// Re-export TOIL_JOB_NUMBER to fix import errors in components
export { TOIL_JOB_NUMBER } from './toil/toilService';
export * from './toil';
