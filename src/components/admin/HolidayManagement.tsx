
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Holiday, initializeHolidays, saveHolidays } from "@/lib/holidays";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HolidayManagement = () => {
  const { toast } = useToast();
  
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayRegion, setNewHolidayRegion] = useState("Queensland");

  useEffect(() => {
    // Initialize holidays from localStorage or defaults
    const initialHolidays = initializeHolidays();
    setHolidays(initialHolidays);
  }, []);

  const saveHolidaySettings = () => {
    saveHolidays(holidays);
    toast({
      title: "Holidays saved",
      description: "Your holiday settings have been updated",
    });
  };

  const addHoliday = () => {
    if (!newHolidayName || !newHolidayDate) {
      toast({
        title: "Error",
        description: "Please provide both name and date for the holiday",
        variant: "destructive",
      });
      return;
    }

    // Validate date format
    try {
      // Try to parse the date to ensure it's valid
      const parsedDate = new Date(newHolidayDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date");
      }
      
      const newHoliday: Holiday = {
        id: Date.now().toString(),
        name: newHolidayName,
        date: newHolidayDate,
        region: newHolidayRegion,
      };
      
      setHolidays([...holidays, newHoliday]);
      setNewHolidayName("");
      setNewHolidayDate("");
    } catch (error) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid date in YYYY-MM-DD format",
        variant: "destructive",
      });
    }
  };

  const removeHoliday = (id: string) => {
    setHolidays(holidays.filter(holiday => holiday.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Holidays</CardTitle>
        <CardDescription>
          Manage public holidays that will be displayed in the calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new holiday form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <Label htmlFor="holiday-name">Holiday Name</Label>
              <Input 
                id="holiday-name" 
                value={newHolidayName} 
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="e.g. Christmas Day"
              />
            </div>
            
            <div>
              <Label htmlFor="holiday-date">Date (YYYY-MM-DD)</Label>
              <Input 
                id="holiday-date" 
                value={newHolidayDate} 
                onChange={(e) => setNewHolidayDate(e.target.value)}
                placeholder="2025-12-25"
              />
            </div>
            
            <div>
              <Label htmlFor="holiday-region">Region</Label>
              <Select value={newHolidayRegion} onValueChange={setNewHolidayRegion}>
                <SelectTrigger id="holiday-region">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Queensland">Queensland</SelectItem>
                  <SelectItem value="New South Wales">New South Wales</SelectItem>
                  <SelectItem value="Victoria">Victoria</SelectItem>
                  <SelectItem value="National">National (All Australia)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-3">
              <Button onClick={addHoliday} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Add Holiday
              </Button>
            </div>
          </div>
          
          {/* Holiday list */}
          <div className="border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-100 font-medium">
              <div>Name</div>
              <div>Date</div>
              <div>Region</div>
              <div>Actions</div>
            </div>
            
            {holidays.map((holiday) => (
              <div key={holiday.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-t">
                <div>{holiday.name}</div>
                <div>{holiday.date}</div>
                <div>{holiday.region}</div>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHoliday(holiday.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}
            
            {holidays.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No holidays added yet. Add some above.
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button onClick={saveHolidaySettings}>Save Holiday Settings</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HolidayManagement;
