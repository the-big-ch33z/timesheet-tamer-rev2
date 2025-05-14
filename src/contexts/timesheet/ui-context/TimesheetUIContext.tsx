
import React, { createContext, useContext, useState } from 'react';

interface TimesheetUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showHelpPanel: boolean;
  setShowHelpPanel: (show: boolean) => void;
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
  const [activeTab, setActiveTab] = useState<string>('timesheet');
  const [showHelpPanel, setShowHelpPanel] = useState<boolean>(false);

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
