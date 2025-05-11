import { useState, useCallback, useEffect, useRef } from 'react';
import { FormState, FormField } from '@/contexts/form/types';
import { FieldValidations, validateField } from './validation/fieldValidation';

export const useFormState = (
  formKey?: string,
  initialState: Record<string, any> = {},
  validations: FieldValidations = {}
) => {
  const stateUpdatesCounter = useRef(0);
  const formInstanceId = useRef<string>(formKey || Math.random().toString(36));

  console.debug('[useFormState] Initializing with:', {
    formKey,
    formInstanceId: formInstanceId.current,
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

  const validateFieldValue = useCallback((fieldName: string, value: any) => {
    const validation = validations[fieldName];
    const error = validateField(value, validation);
    return error;
  }, [validations]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    const updateId = ++stateUpdatesCounter.current;
    console.debug(`[useFormState:setFieldValue] Setting field "${fieldName}" to:`, value, `(update #${updateId})`);

    const error = validateFieldValue(fieldName, value);

    setFormState(prev => {
      if (!prev.fields[fieldName]) {
        console.warn(`[useFormState:setFieldValue] Field "${fieldName}" does not exist. Initializing.`);
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

      console.debug(`[useFormState:setFieldValue] Updated state for "${fieldName}":`, {
        value,
        error,
        isValid: !hasErrors,
        updateId
      });

      return newState;
    });
  }, [validateFieldValue, validations]);

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
      return resetState;
    });
  }, [initialState]);

  return {
    formState,
    setFieldValue,
    validateForm,
    resetForm,
    isMounted: () => true // always allow
  };
};
