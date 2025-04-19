
export interface FormValidation {
  isValid: boolean;
  isDirty: boolean;
}

export interface FormField {
  name: string;
  value: any;
  error?: string;
  touched: boolean;
  required?: boolean;
}

export interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isDirty: boolean;
}
