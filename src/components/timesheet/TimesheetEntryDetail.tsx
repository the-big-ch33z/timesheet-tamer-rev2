
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
  Thermometer
} from "lucide-react";
import { TimeEntry } from "@/types";

interface TimesheetEntryDetailProps {
  date: Date;
  entries: TimeEntry[];
  onAddEntry: () => void;
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
  onAddEntry
}) => {
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [totalHours, setTotalHours] = useState<string>("0.0");

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
        
        {/* Entries Section */}
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="border p-4 rounded-lg">
                <div className="flex justify-between">
                  <h4 className="font-medium">{entry.project}</h4>
                  <span>{entry.hours} hours</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                {entry.startTime && entry.endTime && (
                  <div className="text-xs text-gray-500 mt-2">
                    {entry.startTime} - {entry.endTime}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-6">No entries for this date.</p>
            <Button 
              onClick={onAddEntry} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-5 w-5 mr-1" /> Add Entry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimesheetEntryDetail;
