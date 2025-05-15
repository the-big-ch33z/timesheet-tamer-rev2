
import React, { createContext, useContext, useState, useMemo } from "react";

// Define the shape of our UI context
export interface TimesheetUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showHelpPanel: boolean;
  setShowHelpPanel: (show: boolean) => void;
}

// Create the context with default values
const TimesheetUIContext = createContext<TimesheetUIContextType | undefined>(undefined);

// Provider props
interface TimesheetUIProviderProps {
  children: React.ReactNode;
}

// Provider component
export const TimesheetUIProvider: React.FC<TimesheetUIProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("timesheet");
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  
  // Memoize the value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      showHelpPanel,
      setShowHelpPanel
    }),
    [activeTab, showHelpPanel]
  );
  
  return (
    <TimesheetUIContext.Provider value={contextValue}>
      {children}
    </TimesheetUIContext.Provider>
  );
};

// Hook for consuming the UI context
export const useTimesheetUIContext = (): TimesheetUIContextType => {
  const context = useContext(TimesheetUIContext);
  
  if (context === undefined) {
    throw new Error("useTimesheetUIContext must be used within a TimesheetUIProvider");
  }
  
  return context;
};
