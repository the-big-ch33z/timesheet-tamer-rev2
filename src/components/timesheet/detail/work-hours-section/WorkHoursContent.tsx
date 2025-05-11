
import React, { Suspense } from "react";
import { WorkSchedule } from "@/types";
import { Card } from "@/components/ui/card";
import WorkHoursInterface from "../WorkHoursInterface";
import TimeEntryController from "../../entry-control/TimeEntryController";

interface WorkHoursContentProps {
  date: Date;
  userId: string;
  dayEntries: any[];
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

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
