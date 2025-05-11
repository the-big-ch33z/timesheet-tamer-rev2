
/**
 * Utility functions for form fields
 */

import { FormField, FormState } from '../types/formTypes';

/**
 * Safely access properties from a form field
 * This handles potential undefined fields and provides type safety
 */
export const getFieldSafely = (formState: FormState, fieldName: string): FormField => {
  const field = formState.fields[fieldName];
  console.debug(`[FormFieldUtils:getFieldSafely] Accessing field "${fieldName}":`, field);
  if (!field) {
    // Return a default field if it doesn't exist
    console.warn(`[FormFieldUtils:getFieldSafely] Field "${fieldName}" not found in formState`);
    return { value: '', touched: false };
  }
  return field;
};

/**
 * Safely get a field's error message
 */
export const getFieldError = (formState: FormState, fieldName: string): string | undefined => {
  const field = formState.fields[fieldName];
  if (!field) return undefined;
  return field.error;
};
