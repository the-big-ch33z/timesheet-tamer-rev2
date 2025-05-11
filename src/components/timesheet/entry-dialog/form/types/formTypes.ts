
/**
 * Type definitions for form fields
 */

export interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isDirty: boolean;
  formEdited: boolean;
}

export interface FormField {
  name?: string;
  value: string;
  touched: boolean;
  required?: boolean;
  error?: string;
}

export interface FormFieldsProps {
  formState: FormState;
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
}
