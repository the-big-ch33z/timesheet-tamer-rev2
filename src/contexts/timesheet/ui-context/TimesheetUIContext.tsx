
import React, { createContext, useContext, useState } from 'react';

// Define the context state interface
export interface TimesheetUIState {
  activeTab: string;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  showHelpPanel: boolean;
}

// Define the context type including state and setters
export interface TimesheetUIContextType extends TimesheetUIState {
  setActiveTab: (tab: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (hasError: boolean, message?: string) => void;
  clearError: () => void;
  setShowHelpPanel: (show: boolean) => void;
}

// Create the context with default values
const TimesheetUIContext = createContext<TimesheetUIContextType>({
  activeTab: 'timesheet',  // Changed default from 'daily' to 'timesheet' to match other code
  isLoading: false,
  hasError: false,
  errorMessage: null,
  showHelpPanel: false,
  setActiveTab: () => {},
  setLoading: () => {},
  setError: () => {},
  clearError: () => {},
  setShowHelpPanel: () => {}
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
  const [activeTab, setActiveTab] = useState<string>('timesheet'); // Changed default from 'daily' to 'timesheet'
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpPanel, setShowHelpPanel] = useState<boolean>(false);

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
    showHelpPanel,
    setActiveTab,
    setLoading,
    setError,
    clearError,
    setShowHelpPanel
  };

  return (
    <TimesheetUIContext.Provider value={value}>
      {children}
    </TimesheetUIContext.Provider>
  );
};

export default TimesheetUIContext;
