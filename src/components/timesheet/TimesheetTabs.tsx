
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContent from "./TabContent";
import { useTimesheetUIContext } from "@/contexts/timesheet";
import TOILManagement from "./TOILManagement";

const TimesheetTabs = () => {
  const { activeTab, setActiveTab } = useTimesheetUIContext();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8" defaultValue="timesheet">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">Calendar View</TabsTrigger>
        <TabsTrigger value="recent">Recent Entries</TabsTrigger>
        <TabsTrigger value="toil">TOIL Management</TabsTrigger>
      </TabsList>

      <TabContent />
      
      {/* TOIL Management Tab Content */}
      <TabsContent value="toil">
        <TOILManagement />
      </TabsContent>
    </Tabs>
  );
};

export default TimesheetTabs;
