
export type ValidationRule = {
  validate: (value: any) => boolean;
  message: string;
};

export type FieldValidation = {
  required?: boolean;
  rules?: ValidationRule[];
};

export type FieldValidations = Record<string, FieldValidation>;

export const validateField = (
  value: any, 
  validation?: FieldValidation
): string | undefined => {
  if (!validation) return undefined;
  
  if (validation.required && !value) {
    return "This field is required";
  }
  
  if (validation.rules) {
    for (const rule of validation.rules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
  }
  
  return undefined;
};
