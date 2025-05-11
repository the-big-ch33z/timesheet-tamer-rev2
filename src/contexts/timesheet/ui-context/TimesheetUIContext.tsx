
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { TimesheetUIContextType } from '../types';
import { createTimeLogger } from '@/utils/time/errors';

const logger = createTimeLogger('TimesheetUIContext');

// Create the context
const TimesheetUIContext = createContext<TimesheetUIContextType | undefined>(undefined);

export interface TimesheetUIProviderProps {
  children: ReactNode;
  initialTab?: string;
}

/**
 * TimesheetUIProvider
 * 
 * Provides UI state for the timesheet
 * 
 * @dependency None - This is a root-level context that doesn't depend on other contexts
 */
export const TimesheetUIProvider: React.FC<TimesheetUIProviderProps> = ({
  children, 
  initialTab = 'timesheet'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  
  // Log UI context initialization
  React.useEffect(() => {
    logger.debug('TimesheetUIContext initialized', { initialTab });
  }, [initialTab]);

  const value: TimesheetUIContextType = { 
    activeTab, 
    setActiveTab,
    showHelpPanel,
    setShowHelpPanel 
  };

  return (
    <TimesheetUIContext.Provider value={value}>
      {children}
    </TimesheetUIContext.Provider>
  );
};

/**
 * useTimesheetUIContext
 * 
 * Hook to access UI state for the timesheet
 * 
 * @returns {TimesheetUIContextType} Timesheet UI context value
 * @throws {Error} If used outside of a TimesheetUIProvider
 */
export const useTimesheetUIContext = (): TimesheetUIContextType => {
  const context = useContext(TimesheetUIContext);
  if (!context) {
    throw new Error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  return context;
};
