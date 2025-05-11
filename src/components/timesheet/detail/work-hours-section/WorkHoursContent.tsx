
import React, { Suspense } from "react";
import { WorkSchedule } from "@/types";
import { Card } from "@/components/ui/card";
import WorkHoursInterface from "../WorkHoursInterface";
import TimeEntryController from "../../entry-control/TimeEntryController";

/**
 * WorkHoursContent Component Props
 */
export interface WorkHoursContentProps {
  /** The date to display work hours for */
  date: Date;
  /** The user ID */
  userId: string;
  /** Time entries for the day */
  dayEntries: any[];
  /** Work schedule for the user */
  workSchedule?: WorkSchedule;
  /** Whether the interface is interactive */
  interactive?: boolean;
  /** Callback when a new entry is created */
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

/**
 * WorkHoursContent Component
 * Displays the work hours interface and time entry controller
 * 
 * @param {WorkHoursContentProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const WorkHoursContent: React.FC<WorkHoursContentProps> = ({
  date,
  userId,
  dayEntries,
  workSchedule,
  interactive = true,
  onCreateEntry
}) => {
  return (
    <div className="space-y-6 w-full">
      <Card className="p-0 m-0 w-full rounded-lg shadow-sm border border-gray-200">
        <WorkHoursInterface 
          date={date} 
          userId={userId} 
          interactive={interactive} 
          entries={dayEntries} 
          workSchedule={workSchedule} 
        />
      </Card>

      <div className="w-full">
        <Suspense fallback={<div className="text-center py-4">Loading entries...</div>}>
          <TimeEntryController 
            date={date} 
            userId={userId} 
            interactive={interactive} 
            onCreateEntry={onCreateEntry} 
          />
        </Suspense>
      </div>
    </div>
  );
};

export default WorkHoursContent;
