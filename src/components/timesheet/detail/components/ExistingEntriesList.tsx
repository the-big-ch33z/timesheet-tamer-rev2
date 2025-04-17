
import React from "react";
import { TimeEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Briefcase, FileText } from "lucide-react";
import { format } from "date-fns";

interface ExistingEntriesListProps {
  entries: TimeEntry[];
  date: Date;
  interactive?: boolean;
  onDeleteEntry: (entryId: string) => boolean;
}

const ExistingEntriesList: React.FC<ExistingEntriesListProps> = ({
  entries,
  interactive = true,
  onDeleteEntry,
}) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-3 text-gray-500 bg-gray-50 rounded-md">
        No entries for this day
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="p-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  {entry.startTime || "--:--"} - {entry.endTime || "--:--"}
                </span>
                <span className="text-lg font-bold ml-2">
                  {typeof entry.hours === "number" ? entry.hours.toFixed(1) : "0.0"} hrs
                </span>
              </div>
              
              {entry.jobNumber && (
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-3 w-3 mr-1" />
                  <span>Job: {entry.jobNumber}</span>
                  {entry.taskNumber && (
                    <span className="ml-2">Task: {entry.taskNumber}</span>
                  )}
                </div>
              )}
              
              {entry.description && (
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <FileText className="h-3 w-3 mr-1" />
                  <span>{entry.description}</span>
                </div>
              )}
              
              {entry.rego && (
                <div className="text-xs text-gray-500 mt-1">
                  Rego: {entry.rego}
                </div>
              )}
            </div>
            
            {interactive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDeleteEntry(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ExistingEntriesList;
