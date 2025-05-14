
import React, { createContext, useContext, useState } from 'react';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TimesheetUIContext');

// Define the context type
export interface TimesheetUIContextType {
  /** Currently active tab in the timesheet */
  activeTab: string;
  /** Function to set the active tab */
  setActiveTab: (tab: string) => void;
  /** Whether the help panel is visible */
  showHelpPanel: boolean;
  /** Function to toggle the help panel visibility */
  setShowHelpPanel: (show: boolean) => void;
}

// Create the context with default values
const TimesheetUIContext = createContext<TimesheetUIContextType | null>(null);

// Props for the provider component
interface TimesheetUIProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for timesheet UI state
 */
export const TimesheetUIProvider: React.FC<TimesheetUIProviderProps> = ({ children }) => {
  // Initialize state
  const [activeTab, setActiveTab] = useState('timesheet');
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  logger.debug('TimesheetUIProvider rendering with activeTab:', activeTab);

  // Create the context value
  const value: TimesheetUIContextType = {
    activeTab,
    setActiveTab,
    showHelpPanel,
    setShowHelpPanel,
  };

  return (
    <TimesheetUIContext.Provider value={value}>
      {children}
    </TimesheetUIContext.Provider>
  );
};

/**
 * Hook to access the timesheet UI context
 */
export const useTimesheetUIContext = (): TimesheetUIContextType => {
  const context = useContext(TimesheetUIContext);
  
  if (!context) {
    throw new Error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  
  return context;
};
