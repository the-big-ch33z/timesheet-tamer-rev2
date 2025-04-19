
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFormContext } from '@/contexts/form/FormContext';
import { FormState, FormField } from '@/contexts/form/types';
import { FieldValidations, validateField } from './validation/fieldValidation';

export const useFormState = (
  formId: string, 
  initialState: Record<string, any> = {},
  validations: FieldValidations = {}
) => {
  const { registerForm, unregisterForm, setFormValid, setFormDirty } = useFormContext();
  const mounted = useRef(true);
  
  const [formState, setFormState] = useState<FormState>(() => ({
    fields: Object.entries(initialState).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: {
        name: key,
        value,
        touched: false,
        required: validations[key]?.required || false,
        error: undefined
      }
    }), {}),
    isValid: true,
    isDirty: false,
    formEdited: false
  }));

  // Cleanup effect
  useEffect(() => {
    registerForm(formId);
    
    return () => {
      mounted.current = false;
      unregisterForm(formId);
      console.debug(`[useFormState] Cleaning up form state for ${formId}`);
    };
  }, [formId, registerForm, unregisterForm]);

  const validateFieldValue = useCallback((fieldName: string, value: any) => {
    const validation = validations[fieldName];
    return validateField(value, validation);
  }, [validations]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    if (!mounted.current) return;

    const error = validateFieldValue(fieldName, value);
    
    setFormState(prev => {
      const newFields = {
        ...prev.fields,
        [fieldName]: {
          ...prev.fields[fieldName],
          value,
          touched: true,
          error
        }
      };
      
      const hasErrors = Object.values(newFields).some(field => field.error);
      
      return {
        ...prev,
        fields: newFields,
        isDirty: true,
        formEdited: true,
        isValid: !hasErrors
      };
    });
    
    setFormDirty(formId, true);
    setFormValid(formId, !error);
  }, [formId, setFormDirty, setFormValid, validateFieldValue]);

  const validateForm = useCallback(() => {
    const newFields = { ...formState.fields };
    let isValid = true;

    Object.keys(newFields).forEach(key => {
      const field = newFields[key];
      const error = validateFieldValue(key, field.value);
      newFields[key] = { ...field, error };
      if (error) isValid = false;
    });

    setFormState(prev => ({
      ...prev,
      fields: newFields,
      isValid
    }));
    setFormValid(formId, isValid);

    return isValid;
  }, [formState.fields, formId, setFormValid, validateFieldValue]);

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
      isValid: true,
      formEdited: false
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
