
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContent from "./TabContent";
import { TimeEntry } from "@/types";

interface TimesheetTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  entries: TimeEntry[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
}

const TimesheetTabs: React.FC<TimesheetTabsProps> = ({
  activeTab,
  setActiveTab,
  entries,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}) => {
  return (
    <Tabs value={activeTab} className="mb-6" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-4 w-full max-w-md">
        <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
        <TabsTrigger value="toil">TOIL</TabsTrigger>
        <TabsTrigger value="dta">DTA</TabsTrigger>
        <TabsTrigger value="recent">Recent Entries</TabsTrigger>
      </TabsList>

      <TabContent 
        entries={entries} 
        currentMonth={currentMonth} 
        onPrevMonth={onPrevMonth} 
        onNextMonth={onNextMonth} 
        onDayClick={onDayClick} 
      />
    </Tabs>
  );
};

export default TimesheetTabs;
