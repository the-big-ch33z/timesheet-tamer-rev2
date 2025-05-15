
import React, { createContext, useContext, useState } from 'react';

export interface TimesheetUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TimesheetUIContext = createContext<TimesheetUIContextType | undefined>(undefined);

export const useTimesheetUIContext = () => {
  const context = useContext(TimesheetUIContext);
  if (context === undefined) {
    throw new Error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  return context;
};

export const TimesheetUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('entries');

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
