
import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Edit, Trash } from "lucide-react";
import { TimeEntry } from "@/types";

type TimeEntryListProps = {
  entries: TimeEntry[];
  onAddEntry: () => void;
};

const TimeEntryList: React.FC<TimeEntryListProps> = ({ entries, onAddEntry }) => {
  const totalHours = entries.reduce((total, entry) => total + entry.hours, 0);

  return (
    <div className="space-y-4">
      {entries.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">No time entries yet</h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your time for this day.
          </p>
          <Button onClick={onAddEntry} className="bg-brand-600 hover:bg-brand-700">
            <Plus className="h-4 w-4 mr-2" /> Add Entry
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Total: <span className="text-foreground">{totalHours} hours</span>
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={onAddEntry}
              className="bg-brand-600 hover:bg-brand-700"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Entry
            </Button>
          </div>

          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{entry.project}</h4>
                  <span className="text-sm font-medium">{entry.hours}h</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {entry.description}
                </p>
                <div className="flex justify-end space-x-2">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TimeEntryList;
