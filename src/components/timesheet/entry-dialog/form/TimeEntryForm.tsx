import React, { useState } from "react";
import { useFormState } from "@/hooks/form/useFormState";
import HoursField from "../fields/field-types/HoursField";
import { Button } from "@/components/ui/button";
import { TimeEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X } from "lucide-react";
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
const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  onCancel,
  date,
  userId,
  initialData = {},
  showTimeInputs = false
}) => {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const {
    formState,
    setFieldValue,
    validateForm,
    resetForm
  } = useFormState('time-entry', {
    hours: initialData.hours || '',
    description: initialData.description || '',
    jobNumber: initialData.jobNumber || '',
    taskNumber: initialData.taskNumber || '',
    rego: initialData.rego || '',
    startTime: initialData.startTime || '09:00',
    endTime: initialData.endTime || '17:00'
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Invalid form data",
        description: "Please check the form for errors",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const hoursNum = parseFloat(formState.fields.hours.value);
      const entry: Omit<TimeEntry, "id"> = {
        date,
        userId,
        hours: hoursNum,
        description: formState.fields.description.value || "",
        jobNumber: formState.fields.jobNumber.value || undefined,
        taskNumber: formState.fields.taskNumber.value || undefined,
        rego: formState.fields.rego.value || undefined,
        startTime: formState.fields.startTime.value,
        endTime: formState.fields.endTime.value,
        project: "General"
      };
      onSubmit(entry);
      resetForm();
      toast({
        title: "Entry added",
        description: `Added ${hoursNum} hours to your timesheet`
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
  };
  return <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-24">
              <HoursField id="hours" value={formState.fields.hours.value} onChange={value => setFieldValue('hours', value)} required={true} />
              {formState.fields.hours.error && <p className="text-red-500 text-sm mt-1">{formState.fields.hours.error}</p>}
            </div>
            
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium mb-1">Job Number</label>
              <Input value={formState.fields.jobNumber.value} onChange={e => setFieldValue('jobNumber', e.target.value)} placeholder="Job No." />
            </div>
            
            <div className="w-full md:w-24">
              <label className="block text-sm font-medium mb-1">Rego</label>
              <Input value={formState.fields.rego.value} onChange={e => setFieldValue('rego', e.target.value)} placeholder="Rego" />
            </div>
            
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium mb-1">Task Number</label>
              <Input value={formState.fields.taskNumber.value} onChange={e => setFieldValue('taskNumber', e.target.value)} placeholder="Task No." />
            </div>
          </div>
          
          {showTimeInputs && <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                
                
              </div>
              <div className="w-full md:w-1/2">
                
                
              </div>
            </div>}
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea value={formState.fields.description.value} onChange={e => setFieldValue('description', e.target.value)} placeholder="Enter description" className="w-full" rows={2} />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex items-center gap-1">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formState.isValid} className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
              {isLoading ? <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Saving...
                </> : <>
                  <Check className="h-4 w-4" />
                  Save Entry
                </>}
            </Button>
          </div>
        </div>
      </form>
    </Card>;
};
export default TimeEntryForm;