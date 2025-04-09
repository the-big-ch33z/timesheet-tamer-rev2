
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus,
  Utensils,
  Coffee,
  Plane,
  Thermometer,
  Trash2
} from "lucide-react";
import { TimeEntry } from "@/types";
import TimeEntryDialog from "./TimeEntryDialog";

interface TimesheetEntryDetailProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: () => void;
  onDeleteEntry?: (id: string) => void;
}

// Helper function to get icon component from name
const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case 'utensils': return <Utensils className="h-5 w-5" />;
    case 'coffee': return <Coffee className="h-5 w-5" />;
    case 'plane': return <Plane className="h-5 w-5" />;
    case 'thermometer': return <Thermometer className="h-5 w-5" />;
    default: return null;
  }
};

const TimesheetEntryDetail: React.FC<TimesheetEntryDetailProps> = ({
  date,
  entries,
  onAddEntry,
  onDeleteEntry
}) => {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [totalHours, setTotalHours] = useState<string>("0.0");
  const [showInlineForm, setShowInlineForm] = useState(false);

  // Calculate total hours when start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      let hours = endHours - startHours;
      let minutes = endMinutes - startMinutes;
      
      if (minutes < 0) {
        hours--;
        minutes += 60;
      }
      
      const totalDecimalHours = hours + (minutes / 60);
      setTotalHours(totalDecimalHours.toFixed(1));
    } else {
      setTotalHours("0.0");
    }
  }, [startTime, endTime]);

  // Handler for saving a new entry
  const handleSaveEntry = (entry: Omit<TimeEntry, "id">) => {
    // Create a new entry with ID
    const newEntry = {
      ...entry,
      id: Date.now().toString()
    };
    
    // Add the entry (we're mimicking what the parent component would do)
    if (onAddEntry) {
      // We need to pass the entry back to the parent Timesheet component
      const mockEvent = new CustomEvent("entry-added", { detail: newEntry });
      document.dispatchEvent(mockEvent);
    }
    
    // Hide the form
    setShowInlineForm(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-gray-100">
            <CalendarIcon className="h-5 w-5 text-gray-700" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Entries for {format(date, "MMM dd, yyyy")}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1 text-sm">
            <CalendarIcon className="h-4 w-4" />
            {format(date, "dd MMM yyyy")}
          </Button>
          
          {/* Action buttons */}
          <div className="flex gap-1">
            <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
              <Utensils className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
              <Coffee className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
              <Plane className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
              <Thermometer className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
              <Clock className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="outline" className="ml-2">
            DTA
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6">
        {/* Work Hours Section */}
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-medium">Work Hours</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Start Time</label>
              <div className="relative">
                <Input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pr-10 bg-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">End Time</label>
              <div className="relative">
                <Input 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pr-10 bg-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Total Hours</label>
              <Input 
                type="text" 
                value={totalHours} 
                readOnly 
                className="bg-white"
              />
            </div>
          </div>
        </div>
        
        {/* Add Entry Button */}
        <div className="mb-4">
          {!showInlineForm && (
            <Button 
              onClick={() => setShowInlineForm(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Entry
            </Button>
          )}
          
          {showInlineForm && (
            <TimeEntryDialog 
              onSave={handleSaveEntry}
              selectedDate={date}
              onCancel={() => setShowInlineForm(false)}
            />
          )}
        </div>
        
        {/* Entries Section */}
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div className="flex-grow">
                  <div className="flex justify-between mb-1">
                    <h4 className="font-medium">{entry.project}</h4>
                    <span>{entry.hours} hours</span>
                  </div>
                  <p className="text-sm text-gray-600">{entry.description}</p>
                  {(entry.jobNumber || entry.rego) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {entry.jobNumber && `Job: ${entry.jobNumber}`} 
                      {entry.jobNumber && entry.rego && ' • '} 
                      {entry.rego && `Rego: ${entry.rego}`}
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDeleteEntry && onDeleteEntry(entry.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-2">No entries for this date.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimesheetEntryDetail;
