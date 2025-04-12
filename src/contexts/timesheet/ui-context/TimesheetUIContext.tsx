
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TimesheetUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TimesheetUIContext = createContext<TimesheetUIContextType | undefined>(undefined);

export const useTimesheetUIContext = (): TimesheetUIContextType => {
  const context = useContext(TimesheetUIContext);
  if (!context) {
    throw new Error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  return context;
};

export const TimesheetUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>("timesheet");
  
  const value = {
    activeTab,
    setActiveTab
  };
  
  return (
    <TimesheetUIContext.Provider value={value}>
      {children}
    </TimesheetUIContext.Provider>
  );
};
