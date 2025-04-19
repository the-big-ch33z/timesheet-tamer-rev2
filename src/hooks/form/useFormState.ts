
import { useState, useCallback, useEffect } from 'react';
import { useFormContext } from '@/contexts/form/FormContext';
import { FormState, FormField } from '@/contexts/form/types';

export const useFormState = (formId: string, initialState: Record<string, any> = {}) => {
  const { registerForm, unregisterForm, setFormValid, setFormDirty } = useFormContext();
  
  const [formState, setFormState] = useState<FormState>(() => ({
    fields: Object.entries(initialState).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: {
        name: key,
        value,
        touched: false,
        required: false
      }
    }), {}),
    isValid: true,
    isDirty: false
  }));

  useEffect(() => {
    registerForm(formId);
    return () => unregisterForm(formId);
  }, [formId, registerForm, unregisterForm]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          value,
          touched: true
        }
      },
      isDirty: true
    }));
    setFormDirty(formId, true);
  }, [formId, setFormDirty]);

  const validateField = useCallback((field: FormField): string | undefined => {
    if (field.required && !field.value) {
      return `${field.name} is required`;
    }
    return undefined;
  }, []);

  const validateForm = useCallback(() => {
    const fields = { ...formState.fields };
    let isValid = true;

    Object.keys(fields).forEach(key => {
      const field = fields[key];
      const error = validateField(field);
      fields[key] = { ...field, error };
      if (error) isValid = false;
    });

    setFormState(prev => ({
      ...prev,
      fields,
      isValid
    }));
    setFormValid(formId, isValid);

    return isValid;
  }, [formState.fields, formId, setFormValid, validateField]);

  const resetForm = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      fields: Object.entries(prev.fields).reduce((acc, [key, field]) => ({
        ...acc,
        [key]: {
          ...field,
          value: initialState[key] || '',
          error: undefined,
          touched: false
        }
      }), {}),
      isDirty: false,
      isValid: true
    }));
    setFormDirty(formId, false);
    setFormValid(formId, true);
  }, [formId, initialState, setFormDirty, setFormValid]);

  return {
    formState,
    setFieldValue,
    validateForm,
    resetForm
  };
};
