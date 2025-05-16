
/**
 * TOIL types that are used across multiple modules
 * Extracted to prevent circular dependencies
 */

// Export TOILDayInfo interface
export interface TOILDayInfo {
  hasAccrued: boolean;
  hasUsed: boolean;
  toilHours: number;
}
