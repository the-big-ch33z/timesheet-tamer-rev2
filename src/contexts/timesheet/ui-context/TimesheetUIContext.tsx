
import React, { createContext, useContext, useState } from 'react';

type TabType = 'timesheet' | 'month' | 'leave' | 'stats';

interface TimesheetUIContextProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  showHelpPanel: boolean;
  setShowHelpPanel: (show: boolean) => void;
}

const TimesheetUIContext = createContext<TimesheetUIContextProps | undefined>(undefined);

export const useTimesheetUIContext = () => {
  const context = useContext(TimesheetUIContext);
  if (context === undefined) {
    throw new Error('useTimesheetUIContext must be used within a TimesheetUIProvider');
  }
  return context;
};

export const TimesheetUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('timesheet');
  const [showHelpPanel, setShowHelpPanel] = useState(false);

  return (
    <TimesheetUIContext.Provider 
      value={{ 
        activeTab, 
        setActiveTab, 
        showHelpPanel, 
        setShowHelpPanel 
      }}
    >
      {children}
    </TimesheetUIContext.Provider>
  );
};
