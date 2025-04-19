
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FormValidation } from './types';

interface FormContextValue {
  registerForm: (formId: string) => void;
  unregisterForm: (formId: string) => void;
  setFormValid: (formId: string, isValid: boolean) => void;
  isFormValid: (formId: string) => boolean;
  setFormDirty: (formId: string, isDirty: boolean) => void;
  isFormDirty: (formId: string) => boolean;
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formStates, setFormStates] = useState<Record<string, FormValidation>>({});

  const registerForm = useCallback((formId: string) => {
    setFormStates(prev => ({
      ...prev,
      [formId]: { isValid: true, isDirty: false }
    }));
  }, []);

  const unregisterForm = useCallback((formId: string) => {
    setFormStates(prev => {
      const newState = { ...prev };
      delete newState[formId];
      return newState;
    });
  }, []);

  const setFormValid = useCallback((formId: string, isValid: boolean) => {
    setFormStates(prev => ({
      ...prev,
      [formId]: { ...prev[formId], isValid }
    }));
  }, []);

  const isFormValid = useCallback((formId: string) => {
    return formStates[formId]?.isValid ?? true;
  }, [formStates]);

  const setFormDirty = useCallback((formId: string, isDirty: boolean) => {
    setFormStates(prev => ({
      ...prev,
      [formId]: { ...prev[formId], isDirty }
    }));
  }, []);

  const isFormDirty = useCallback((formId: string) => {
    return formStates[formId]?.isDirty ?? false;
  }, [formStates]);

  return (
    <FormContext.Provider value={{
      registerForm,
      unregisterForm,
      setFormValid,
      isFormValid,
      setFormDirty,
      isFormDirty
    }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};
