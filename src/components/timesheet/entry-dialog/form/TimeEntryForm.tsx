
import React, { useState, useCallback } from "react";
import HoursField from "../fields/field-types/HoursField";
import { Button } from "@/components/ui/button";
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { TimeEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X } from "lucide-react";
import TimeInputField from "../../detail/components/TimeInputField";

interface TimeEntryFormProps {
  startTime: string;
  endTime: string;
  onSubmit: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
  date: Date;
  userId: string;
}

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  startTime,
  endTime,
  onSubmit,
  onCancel,
  date,
  userId
}) => {
  const { toast } = useToast();
  const [hours, setHours] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [jobNumber, setJobNumber] = useState<string>("");
  const [taskNumber, setTaskNumber] = useState<string>("");
  const [rego, setRego] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Track local time values for immediate feedback
  const [localStartTime, setLocalStartTime] = useState(startTime);
  const [localEndTime, setLocalEndTime] = useState(endTime);

  // Calculate hours from times on initial render and when times change
  React.useEffect(() => {
    if (localStartTime && localEndTime) {
      try {
        const calculatedHours = calculateHoursFromTimes(localStartTime, localEndTime);
        setHours(calculatedHours.toString());
      } catch (error) {
        console.error("Error calculating hours:", error);
      }
    }
  }, [localStartTime, localEndTime]);
  
  // Handle time changes
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setLocalStartTime(value);
    } else {
      setLocalEndTime(value);
    }
  };
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validate hours
      const hoursNum = parseFloat(hours);
      if (isNaN(hoursNum) || hoursNum <= 0) {
        toast({
          title: "Invalid hours",
          description: "Please enter valid hours greater than zero",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Create entry object
      const entry: Omit<TimeEntry, "id"> = {
        date,
        userId,
        startTime: localStartTime,
        endTime: localEndTime,
        hours: hoursNum,
        description: description || "",
        jobNumber: jobNumber || undefined,
        taskNumber: taskNumber || undefined,
        rego: rego || undefined,
        project: "General" // Add default project value
      };

      // Submit the entry
      onSubmit(entry);

      // Clear form
      setDescription("");
      setJobNumber("");
      setTaskNumber("");
      setRego("");
      setHours("");
      
      toast({
        title: "Entry added",
        description: `Added ${hoursNum} hours to your timesheet`,
      });
    } catch (error) {
      console.error("Error submitting entry:", error);
      toast({
        title: "Error saving entry",
        description: "There was a problem saving your entry",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [hours, description, jobNumber, taskNumber, rego, date, userId, localStartTime, localEndTime, onSubmit, toast]);
  
  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Time fields */}
            <div className="flex gap-2 items-center w-full md:w-auto">
              <TimeInputField 
                label="Start"
                value={localStartTime}
                onChange={(value) => handleTimeChange('start', value)}
                testId="start-time-input"
              />
              <span className="mx-1">-</span>
              <TimeInputField 
                label="End"
                value={localEndTime}
                onChange={(value) => handleTimeChange('end', value)}
                testId="end-time-input"
              />
            </div>
            
            {/* Hours field */}
            <div className="w-full md:w-24">
              <HoursField id="hours" value={hours} onChange={setHours} required={true} />
            </div>
            
            {/* Job Number field */}
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium mb-1">Job Number</label>
              <Input value={jobNumber} onChange={e => setJobNumber(e.target.value)} placeholder="Job No." />
            </div>
            
            {/* Rego field */}
            <div className="w-full md:w-24">
              <label className="block text-sm font-medium mb-1">Rego</label>
              <Input value={rego} onChange={e => setRego(e.target.value)} placeholder="Rego" />
            </div>
            
            {/* Task Number field */}
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium mb-1">Task Number</label>
              <Input value={taskNumber} onChange={e => setTaskNumber(e.target.value)} placeholder="Task No." />
            </div>
          </div>
          
          {/* Description field */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Enter description" 
              className="w-full"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !hours} 
              className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default TimeEntryForm;
