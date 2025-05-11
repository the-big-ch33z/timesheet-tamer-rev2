import { useState, useCallback, useEffect, useRef } from 'react';
import { FormState, FormField } from '@/contexts/form/types';
import { FieldValidations, validateField } from './validation/fieldValidation';

export const useFormState = (
  formKey?: string,
  initialState: Record<string, any> = {},
  validations: FieldValidations = {}
) => {
  const mounted = useRef(true);
  const stateUpdatesCounter = useRef(0);
  console.debug('[useFormState] Initializing with:', {
    formKey,
    initialState,
    validations: Object.keys(validations)
  });
  
  const [formState, setFormState] = useState<FormState>(() => {
    const initialFormState = {
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
    };
    
    console.debug('[useFormState] Initial form state created:', initialFormState);
    return initialFormState;
  });

  // Cleanup effect
  useEffect(() => {
    return () => {
      mounted.current = false;
      console.debug('[useFormState] Cleaning up form state for', formKey);
    };
  }, [formKey]);

  // Log when form state changes
  useEffect(() => {
    console.debug('[useFormState:useEffect] Form state updated:', {
      isValid: formState.isValid,
      isDirty: formState.isDirty,
      formEdited: formState.formEdited,
      fieldsCount: Object.keys(formState.fields).length
    });
  }, [formState]);

  const validateFieldValue = useCallback((fieldName: string, value: any) => {
    console.debug(`[useFormState:validateFieldValue] Validating field "${fieldName}" with value:`, value);
    const validation = validations[fieldName];
    const error = validateField(value, validation);
    console.debug(`[useFormState:validateFieldValue] Validation result for "${fieldName}":`, error || 'valid');
    return error;
  }, [validations]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    // Increment counter to track state updates
    const updateId = ++stateUpdatesCounter.current;
    console.debug(`[useFormState:setFieldValue] Setting field "${fieldName}" to:`, value, `(update #${updateId})`);
    
    if (!mounted.current) {
      console.warn(`[useFormState:setFieldValue] Component unmounted, ignoring update to "${fieldName}"`);
      return;
    }

    const error = validateFieldValue(fieldName, value);
    
    setFormState(prev => {
      // Safety check for race conditions - only proceed if still mounted
      if (!mounted.current) {
        console.warn(`[useFormState:setFieldValue] Component unmounted during state update for "${fieldName}"`);
        return prev;
      }
      
      // Check if the field exists in the current state
      if (!prev.fields[fieldName]) {
        console.warn(`[useFormState:setFieldValue] Field "${fieldName}" does not exist in form state`);
        // Create the field if it doesn't exist
        prev.fields[fieldName] = {
          name: fieldName,
          value: '',
          touched: false,
          required: validations[fieldName]?.required || false
        };
      }
      
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
      
      const newState = {
        ...prev,
        fields: newFields,
        isDirty: true,
        formEdited: true,
        isValid: !hasErrors
      };
      
      console.debug(`[useFormState:setFieldValue] Updated state for field "${fieldName}":`, {
        value,
        error,
        isValid: !hasErrors,
        updateId
      });
      
      return newState;
    });
  }, [validateFieldValue, validations]);

  const validateForm = useCallback(() => {
    console.debug('[useFormState:validateForm] Validating entire form');
    const newFields = { ...formState.fields };
    let isValid = true;

    Object.keys(newFields).forEach(key => {
      const field = newFields[key];
      const error = validateFieldValue(key, field.value);
      newFields[key] = { ...field, error };
      if (error) {
        console.debug(`[useFormState:validateForm] Field "${key}" failed validation with error:`, error);
        isValid = false;
      }
    });

    console.debug('[useFormState:validateForm] Overall validation result:', isValid ? 'VALID' : 'INVALID');

    setFormState(prev => ({
      ...prev,
      fields: newFields,
      isValid
    }));

    return isValid;
  }, [formState.fields, validateFieldValue]);

  const resetForm = useCallback(() => {
    console.debug('[useFormState:resetForm] Resetting form');
    setFormState(prev => {
      const resetState = {
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
      };
      console.debug('[useFormState:resetForm] Form reset complete');
      return resetState;
    });
  }, [initialState]);

  return {
    formState,
    setFieldValue,
    validateForm,
    resetForm,
    isMounted: () => mounted.current
  };
};
