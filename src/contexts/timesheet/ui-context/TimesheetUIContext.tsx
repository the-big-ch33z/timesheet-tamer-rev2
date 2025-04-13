
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TimesheetUIContextType } from '../types';

const TimesheetUIContext = createContext<TimesheetUIContextType | undefined>(undefined);

export const useTimesheetUIContext = (): TimesheetUIContextType => {
  const context = useContext(TimesheetUIContext);
  if (!context) {
    throw new Error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  return context;
};

interface TimesheetUIProviderProps {
  children: ReactNode;
}

export const TimesheetUIProvider: React.FC<TimesheetUIProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>("timesheet");
  
  const value: TimesheetUIContextType = {
    activeTab,
    setActiveTab
  };
  
  return (
    <TimesheetUIContext.Provider value={value}>
      {children}
    </TimesheetUIContext.Provider>
  );
};
