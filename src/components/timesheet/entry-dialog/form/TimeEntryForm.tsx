
import React, { useState } from "react";
import { useFormState } from "@/hooks/form/useFormState";
import HoursField from "../fields/field-types/HoursField";
import { Button } from "@/components/ui/button";
import { TimeEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X } from "lucide-react";
import EntryField from "../fields/EntryField";
import TimeFields from "../fields/TimeFields";

// Common field definitions to reduce duplication
const FIELD_TYPES = {
  JOB_NUMBER: "jobNumber",
  TASK_NUMBER: "taskNumber",
  REGO: "rego",
  HOURS: "hours",
  DESCRIPTION: "description",
  START_TIME: "startTime",
  END_TIME: "endTime"
};

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

// Reusable field renderer to reduce duplication
const renderFormField = (
  fieldType: string,
  value: string,
  onChange: (value: string) => void,
  required: boolean = false,
  error?: string
) => {
  const fieldProps = {
    value,
    onChange,
    required
  };

  // Common field configurations
  const fieldConfig = {
    [FIELD_TYPES.JOB_NUMBER]: {
      name: "Job Number",
      placeholder: "Job No."
    },
    [FIELD_TYPES.TASK_NUMBER]: {
      name: "Task Number",
      placeholder: "Task No."
    },
    [FIELD_TYPES.REGO]: {
      name: "Rego",
      placeholder: "Rego"
    }
  };

  const config = fieldConfig[fieldType];
  
  if (config) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium mb-1">{config.name}</label>
        <EntryField
          id={fieldType}
          name={config.name}
          value={value}
          onChange={onChange}
          placeholder={config.placeholder}
          required={required}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
  
  return null;
};

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  onCancel,
  date,
  userId,
  initialData = {},
  showTimeInputs = false
}) => {
  const { toast } = useToast();
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

  // Standard form submission handler with toast notifications
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

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-24">
              <HoursField 
                id="hours" 
                value={formState.fields.hours.value} 
                onChange={value => setFieldValue(FIELD_TYPES.HOURS, value)} 
                required={true} 
              />
              {formState.fields.hours.error && (
                <p className="text-red-500 text-sm mt-1">{formState.fields.hours.error}</p>
              )}
            </div>
            
            <div className="w-full md:w-32">
              {renderFormField(
                FIELD_TYPES.JOB_NUMBER,
                formState.fields.jobNumber.value,
                value => setFieldValue(FIELD_TYPES.JOB_NUMBER, value),
                false,
                formState.fields.jobNumber.error
              )}
            </div>
            
            <div className="w-full md:w-24">
              {renderFormField(
                FIELD_TYPES.REGO,
                formState.fields.rego.value,
                value => setFieldValue(FIELD_TYPES.REGO, value),
                false,
                formState.fields.rego.error
              )}
            </div>
            
            <div className="w-full md:w-32">
              {renderFormField(
                FIELD_TYPES.TASK_NUMBER,
                formState.fields.taskNumber.value,
                value => setFieldValue(FIELD_TYPES.TASK_NUMBER, value),
                false,
                formState.fields.taskNumber.error
              )}
            </div>
          </div>
          
          {showTimeInputs && (
            <TimeFields
              startTime={formState.fields.startTime.value}
              endTime={formState.fields.endTime.value}
              setStartTime={value => setFieldValue(FIELD_TYPES.START_TIME, value)}
              setEndTime={value => setFieldValue(FIELD_TYPES.END_TIME, value)}
              selectedDate={date}
              disabled={isLoading}
            />
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea 
              value={formState.fields.description.value} 
              onChange={e => setFieldValue(FIELD_TYPES.DESCRIPTION, e.target.value)} 
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
              disabled={isLoading || !formState.isValid} 
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
