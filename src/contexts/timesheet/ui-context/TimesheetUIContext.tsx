
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { TimesheetUIContextType } from '../types';

// Create the context
const TimesheetUIContext = createContext<TimesheetUIContextType | undefined>(undefined);

// Custom hook to use the context
export const useTimesheetUIContext = () => {
  const context = useContext(TimesheetUIContext);
  if (!context) {
    throw new Error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  return context;
};

export const TimesheetUIProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('timesheet');
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  return (
    <TimesheetUIContext.Provider value={{ 
      activeTab, 
      setActiveTab,
      showHelpPanel,
      setShowHelpPanel 
    }}>
      {children}
    </TimesheetUIContext.Provider>
  );
};
