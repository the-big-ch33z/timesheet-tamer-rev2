
import React, { useState, useCallback, useEffect } from "react";
import HoursField from "../fields/field-types/HoursField";
import { Button } from "@/components/ui/button";
import { TimeEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X } from "lucide-react";
import { calculateHoursFromTimes } from "@/utils/time/calculations";

export interface TimeEntryFormData {
  hours: string;
  description: string;
  jobNumber: string;
  taskNumber: string;
  rego: string;
  startTime?: string;
  endTime?: string;
}

interface TimeEntryFormProps {
  onSubmit: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
  date: Date;
  userId: string;
  initialData?: Partial<TimeEntryFormData>;
  showTimeInputs?: boolean;
}

/**
 * Consolidated form component for creating and editing time entries
 */
const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  onCancel,
  date,
  userId,
  initialData = {},
  showTimeInputs = false
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TimeEntryFormData>({
    hours: initialData.hours || "",
    description: initialData.description || "",
    jobNumber: initialData.jobNumber || "",
    taskNumber: initialData.taskNumber || "",
    rego: initialData.rego || "",
    startTime: initialData.startTime || "09:00",
    endTime: initialData.endTime || "17:00"
  });
  const [isLoading, setIsLoading] = useState(false);

  // Recalculate hours when start/end times change
  useEffect(() => {
    if (showTimeInputs && formData.startTime && formData.endTime) {
      try {
        const calculatedHours = calculateHoursFromTimes(formData.startTime, formData.endTime);
        setFormData(prev => ({
          ...prev,
          hours: calculatedHours.toString()
        }));
      } catch (error) {
        console.error("Error calculating hours from times:", error);
      }
    }
  }, [formData.startTime, formData.endTime, showTimeInputs]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof TimeEntryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Additional logic for time fields
    if ((field === 'startTime' || field === 'endTime') && showTimeInputs) {
      console.debug(`[TimeEntryForm] ${field} changed to ${value}`);
    }
  }, [showTimeInputs]);

  // Form validation
  const validateForm = useCallback((): { valid: boolean; message?: string } => {
    // Check required hours field
    const hoursNum = parseFloat(formData.hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      return { valid: false, message: "Please enter valid hours greater than zero" };
    }
    
    return { valid: true };
  }, [formData.hours]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: "Invalid form data",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert hours to number
      const hoursNum = parseFloat(formData.hours);
      
      // Create entry object
      const entry: Omit<TimeEntry, "id"> = {
        date,
        userId,
        hours: hoursNum,
        description: formData.description || "",
        jobNumber: formData.jobNumber || undefined,
        taskNumber: formData.taskNumber || undefined,
        rego: formData.rego || undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        project: "General" // Default project value
      };

      // Submit the entry
      onSubmit(entry);

      // Clear form
      setFormData({
        hours: "",
        description: "",
        jobNumber: "",
        taskNumber: "",
        rego: "",
        startTime: "09:00",
        endTime: "17:00"
      });
      
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
  }, [formData, date, userId, onSubmit, toast, validateForm]);
  
  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Hours field */}
            <div className="w-full md:w-24">
              <HoursField 
                id="hours" 
                value={formData.hours} 
                onChange={(value) => handleFieldChange('hours', value)} 
                required={true} 
              />
            </div>
            
            {/* Job Number field */}
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium mb-1">Job Number</label>
              <Input 
                value={formData.jobNumber} 
                onChange={e => handleFieldChange('jobNumber', e.target.value)} 
                placeholder="Job No." 
              />
            </div>
            
            {/* Rego field */}
            <div className="w-full md:w-24">
              <label className="block text-sm font-medium mb-1">Rego</label>
              <Input 
                value={formData.rego} 
                onChange={e => handleFieldChange('rego', e.target.value)} 
                placeholder="Rego" 
              />
            </div>
            
            {/* Task Number field */}
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium mb-1">Task Number</label>
              <Input 
                value={formData.taskNumber} 
                onChange={e => handleFieldChange('taskNumber', e.target.value)} 
                placeholder="Task No." 
              />
            </div>
          </div>
          
          {/* Time inputs (optional) */}
          {showTimeInputs && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={e => handleFieldChange('startTime', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium mb-1">End Time</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={e => handleFieldChange('endTime', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          {/* Description field */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea 
              value={formData.description} 
              onChange={e => handleFieldChange('description', e.target.value)} 
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
              disabled={isLoading || !formData.hours} 
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
