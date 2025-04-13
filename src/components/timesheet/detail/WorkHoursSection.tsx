
import React, { useMemo } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import WorkHoursContainer from "./WorkHoursContainer";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = (props) => {
  // Create a key based on date and entries to ensure proper re-rendering
  const sectionKey = useMemo(() => 
    props.date ? 
      `work-hours-${props.date.toISOString()}-${props.entries.length}-${Date.now()}` : 
      'no-date'
  , [props.date, props.entries.length]);
  
  return (
    <WorkHoursContainer
      {...props}
      key={sectionKey}
    />
  );
};

export default WorkHoursSection;
