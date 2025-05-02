
/**
 * Export all storage-related functions to maintain consistent API
 */

// Export core storage functions
export * from './core';

// Export record management functions
export * from './record-management';

// Export query functions directly (not through cleanup to avoid circular deps)
export * from './queries';

// Export cleanup functions 
export * from './cleanup';
