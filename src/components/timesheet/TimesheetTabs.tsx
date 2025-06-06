
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContent from "./TabContent";
import { useTimesheetUIContext } from "@/contexts/timesheet";
import MonthlyToilManager from "../toil/MonthlyToilManager";

/**
 * TimesheetTabs component that renders the main navigation tabs for the timesheet page
 * Including calendar view, recent entries, and TOIL management
 */
const TimesheetTabs = () => {
  const {
    activeTab,
    setActiveTab
  } = useTimesheetUIContext();
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8" defaultValue="timesheet">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">Calendar View</TabsTrigger>
        <TabsTrigger value="recent">Recent Entries</TabsTrigger>
        <TabsTrigger value="toil-management">TOIL Management</TabsTrigger>
      </TabsList>

      {/* Content for timesheet and recent entries tabs */}
      <TabContent />
      
      {/* Month-End TOIL Tab Content */}
      <TabsContent value="toil-management">
        <MonthlyToilManager />
      </TabsContent>
    </Tabs>
  );
};

export default TimesheetTabs;
