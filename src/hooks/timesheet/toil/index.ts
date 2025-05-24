
/**
 * TOIL (Time Off In Lieu) Hooks
 * 
 * This module provides hooks for working with TOIL functionality.
 * 
 * The main hook to use is useUnifiedTOIL, which provides a single comprehensive API.
 * The other hooks are kept for backward compatibility but are now deprecated.
 */

export * from './types';
export * from './useTOILEntryChecker';
export * from './useToilCalculator';
export * from './useToilCacheClearer';
export * from './useToilRefresher';
export * from './useWorkScheduleLogger';
export * from './useTOILCalculations';
export * from './useUnifiedTOIL';

// Export new modular hooks (these are the preferred ones to use)
export * from './hooks/useToilState';
export * from './hooks/useToilCache';
export * from './hooks/useToilEvents';
export * from './hooks/useToilCalculation';

// Export utilities
export * from './utils/toilCalculationUtils';
export * from './utils/toilEventUtils';

/**
 * @deprecated Use useUnifiedTOIL instead, which provides a simplified and unified API
 * for all TOIL-related operations.
 */
import { useTOILCalculations } from './useTOILCalculations';
export { useTOILCalculations };

/**
 * @deprecated Use the new modular hooks from ./hooks/useToilState instead
 */
import { useToilState as deprecatedUseToilState } from './useToilState';
export { deprecatedUseToilState };
