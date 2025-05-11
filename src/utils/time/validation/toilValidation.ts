
/**
 * Centralized validation logic for TOIL hours.
 */

const MIN_TOIL_HOURS = 0;
const MAX_TOIL_HOURS = 24; // Assuming a person cannot accrue/use more than 24h per day.

export function isValidTOILHours(hours: any): boolean {
  // Must be a finite number, not NaN, not null, not undefined.
  if (typeof hours !== "number" || !isFinite(hours)) return false;
  // Must be within plausible range.
  if (hours < MIN_TOIL_HOURS || hours > MAX_TOIL_HOURS) return false;
  return true;
}

export function getSanitizedTOILHours(hours: any): number {
  // Clamp hours to [MIN, MAX], fallback to 0 for invalid input.
  if (!isValidTOILHours(hours)) return 0;
  return Number(hours);
}

// Validation messages for UI or logs
export function getTOILHoursValidationMessage(hours: any): string | null {
  if (typeof hours !== "number" || isNaN(hours)) return "TOIL hours must be a number";
  if (hours < MIN_TOIL_HOURS) return "TOIL hours cannot be negative";
  if (hours > MAX_TOIL_HOURS) return `TOIL hours cannot exceed ${MAX_TOIL_HOURS} per day`;
  return null;
}
