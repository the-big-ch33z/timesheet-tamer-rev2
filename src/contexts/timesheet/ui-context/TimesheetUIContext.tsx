
import React, { createContext, useContext, useState } from 'react';

// Define the context state interface
export interface TimesheetUIState {
  activeTab: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

// Define the context type including state and setters
export interface TimesheetUIContextType extends TimesheetUIState {
  setActiveTab: (tab: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (hasError: boolean, message?: string) => void;
  clearError: () => void;
}

// Create the context with default values
const TimesheetUIContext = createContext<TimesheetUIContextType>({
  activeTab: 'daily',
  isLoading: false,
  hasError: false,
  errorMessage: null,
  setActiveTab: () => {},
  setLoading: () => {},
  setError: () => {},
  clearError: () => {}
});

// Export the hook for consuming the context
export const useTimesheetUIContext = () => {
  const context = useContext(TimesheetUIContext);
  if (!context) {
    console.error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  return context;
};

// Provider component
export const TimesheetUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Convenient methods for state management
  const setLoading = (loading: boolean) => setIsLoading(loading);
  
  const setError = (error: boolean, message?: string) => {
    setHasError(error);
    setErrorMessage(message || null);
  };
  
  const clearError = () => {
    setHasError(false);
    setErrorMessage(null);
  };

  const value: TimesheetUIContextType = {
    activeTab,
    isLoading,
    hasError,
    errorMessage,
    setActiveTab,
    setLoading,
    setError,
    clearError
  };

  return (
    <TimesheetUIContext.Provider value={value}>
      {children}
    </TimesheetUIContext.Provider>
  );
};

export default TimesheetUIContext;
