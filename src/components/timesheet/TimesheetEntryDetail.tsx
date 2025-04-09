
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimeEntry } from "@/types";
import DetailHeader from "./detail/DetailHeader";
import WorkHoursSection from "./detail/WorkHoursSection";
import EntriesSection from "./detail/EntriesSection";

interface TimesheetEntryDetailProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: () => void;
  onDeleteEntry?: (id: string) => void;
}

const TimesheetEntryDetail: React.FC<TimesheetEntryDetailProps> = ({
  date,
  entries,
  onDeleteEntry
}) => {

  // Handler for saving a new entry
  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    // Create a new entry with ID
    const newEntry = {
      ...entry,
      id: Date.now().toString()
    };
    
    // Dispatch event to add the entry
    const mockEvent = new CustomEvent("entry-added", { detail: newEntry });
    document.dispatchEvent(mockEvent);
  };

  const handleDeleteEntry = (id: string) => {
    if (onDeleteEntry) {
      onDeleteEntry(id);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="p-0">
        <DetailHeader date={date} />
      </CardHeader>

      <CardContent className="px-6">
        <WorkHoursSection />
        
        <EntriesSection 
          date={date} 
          entries={entries} 
          onSaveEntry={handleSaveEntry} 
          onDeleteEntry={handleDeleteEntry}
        />
      </CardContent>
    </Card>
  );
};

export default TimesheetEntryDetail;
