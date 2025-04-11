
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContent from "./TabContent";
import { useTimesheetContext } from "@/contexts/timesheet";

const TimesheetTabs = () => {
  const { activeTab, setActiveTab } = useTimesheetContext();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">Calendar View</TabsTrigger>
        <TabsTrigger value="recent">Recent Entries</TabsTrigger>
      </TabsList>

      <TabContent />
    </Tabs>
  );
};

export default TimesheetTabs;
