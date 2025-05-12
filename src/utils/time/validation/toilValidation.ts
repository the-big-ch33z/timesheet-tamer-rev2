
/**
 * Centralized validation logic for TOIL hours.
 */

const MIN_TOIL_HOURS = 0;
const MAX_TOIL_HOURS = 24; // Assuming a person cannot accrue/use more than 24h per day.

/**
 * Check if the provided hours value is valid for TOIL calculations
 * @param hours The hours value to validate
 * @returns True if the value is a valid TOIL hours value
 */
export function isValidTOILHours(hours: any): boolean {
  // Must be a finite number, not NaN, not null, not undefined.
  if (typeof hours !== "number" || !isFinite(hours)) return false;
  // Must be within plausible range.
  if (hours < MIN_TOIL_HOURS || hours > MAX_TOIL_HOURS) return false;
  return true;
}

/**
 * Get a sanitized version of the provided hours value
 * @param hours The hours value to sanitize
 * @returns A valid TOIL hours value, or 0 if the input was invalid
 */
export function getSanitizedTOILHours(hours: any): number {
  // Clamp hours to [MIN, MAX], fallback to 0 for invalid input.
  if (!isValidTOILHours(hours)) return 0;
  return Number(hours);
}

/**
 * Get a validation message for a TOIL hours value
 * @param hours The hours value to validate
 * @returns A validation message or null if the value is valid
 */
export function getTOILHoursValidationMessage(hours: any): string | null {
  if (typeof hours !== "number" || isNaN(hours)) return "TOIL hours must be a number";
  if (hours < MIN_TOIL_HOURS) return "TOIL hours cannot be negative";
  if (hours > MAX_TOIL_HOURS) return `TOIL hours cannot exceed ${MAX_TOIL_HOURS} per day`;
  return null;
}
