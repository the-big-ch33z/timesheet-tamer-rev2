import React, { useState, useCallback } from "react";
import HoursField from "../fields/field-types/HoursField";
import { Button } from "@/components/ui/button";
import { calculateHoursFromTimes } from "@/utils/time/calculations";
import { TimeEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  const {
    toast
  } = useToast();
  const [hours, setHours] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [jobNumber, setJobNumber] = useState<string>("");
  const [taskNumber, setTaskNumber] = useState<string>("");
  const [rego, setRego] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate hours from times on initial render
  React.useEffect(() => {
    if (startTime && endTime) {
      try {
        const calculatedHours = calculateHoursFromTimes(startTime, endTime);
        setHours(calculatedHours.toString());
      } catch (error) {
        console.error("Error calculating hours:", error);
      }
    }
  }, [startTime, endTime]);
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
        return;
      }

      // Create entry object
      const entry: Omit<TimeEntry, "id"> = {
        date,
        userId,
        startTime,
        endTime,
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

      // Hide form after successful submission
      onCancel();
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
  }, [hours, description, jobNumber, taskNumber, rego, date, userId, startTime, endTime, onSubmit, onCancel, toast]);
  return <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              
              
            </div>
            <div>
              
              
            </div>
          </div>

          <HoursField id="hours" value={hours} onChange={setHours} required={true} />

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter description" className="w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Number</label>
              <Input value={jobNumber} onChange={e => setJobNumber(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Task Number</label>
              <Input value={taskNumber} onChange={e => setTaskNumber(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rego</label>
            <Input value={rego} onChange={e => setRego(e.target.value)} placeholder="Optional" />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !hours} className="bg-green-600 hover:bg-green-700">
              {isLoading ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </div>
      </form>
    </Card>;
};
export default TimeEntryForm;