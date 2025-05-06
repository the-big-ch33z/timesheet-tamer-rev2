
import React from "react";
import { useFormState } from "@/hooks/form/useFormState";
import HoursField from "../fields/field-types/HoursField";
import { Button } from "@/components/ui/button";
import { TimeEntry } from "@/types";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X } from "lucide-react";
import EntryField from "../fields/EntryField";

const FIELD_TYPES = {
  JOB_NUMBER: "jobNumber",
  TASK_NUMBER: "taskNumber",
  REGO: "rego",
  HOURS: "hours",
  DESCRIPTION: "description"
};

export interface TimeEntryFormData {
  hours: string;
  description: string;
  jobNumber: string;
  taskNumber: string;
  rego: string;
}

interface TimeEntryFormProps {
  onSubmit: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
  date: Date;
  userId: string;
  initialData?: Partial<TimeEntryFormData>;
  isSubmitting: boolean;
}

const renderFormField = (fieldType: string, value: string, onChange: (value: string) => void, required: boolean = false, error?: string) => {
  const fieldProps = {
    value,
    onChange,
    required
  };

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
    return <div className="w-full">
        <EntryField id={fieldType} name={config.name} value={value} onChange={onChange} placeholder={config.placeholder} required={required} 
        {...(fieldType === FIELD_TYPES.HOURS ? { type: "number", min: "0.25", step: "0.25" } : {})}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>;
  }
  return null;
};

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  onCancel,
  date,
  userId,
  initialData = {},
  isSubmitting
}) => {
  const { toast } = useToast();
  
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
    rego: initialData.rego || ''
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

    try {
      // Get the hours value as a string
      const hoursValue = formState.fields.hours.value;
      console.debug(`[TimeEntryForm] Raw hours value from form: "${hoursValue}" (${typeof hoursValue})`);
      
      // Explicit conversion to number with parseFloat
      const hoursNum = parseFloat(hoursValue);
      console.debug(`[TimeEntryForm] Parsed hours: ${hoursNum} (${typeof hoursNum})`);
      
      if (isNaN(hoursNum)) {
        toast({
          title: "Invalid hours format",
          description: "Hours must be a valid number",
          variant: "destructive"
        });
        return;
      }
      
      if (hoursNum <= 0) {
        toast({
          title: "Invalid hours",
          description: "Hours must be a positive number",
          variant: "destructive"
        });
        return;
      }
      
      console.debug(`[TimeEntryForm] Submitting entry with validated hours: ${hoursNum}`);
      
      // Create entry object with explicit numeric hours
      const entry: Omit<TimeEntry, "id"> = {
        date,
        userId,
        hours: hoursNum,
        description: formState.fields.description.value || "",
        jobNumber: formState.fields.jobNumber.value || undefined,
        taskNumber: formState.fields.taskNumber.value || undefined,
        rego: formState.fields.rego.value || undefined,
        project: "General"
      };
      
      // Add success toast before submission
      toast({
        title: "Submitting entry",
        description: `Saving ${hoursNum} hours for ${date.toLocaleDateString()}`,
      });
      
      onSubmit(entry);
      resetForm();
    } catch (error) {
      console.error("Error submitting entry:", error);
      toast({
        title: "Error saving entry",
        description: "There was a problem saving your entry",
        variant: "destructive"
      });
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
                onChange={value => {
                  let numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    numValue = Math.round(numValue * 4) / 4;
                    if (numValue < 0.25) numValue = 0.25;
                    if (numValue > 24) numValue = 24;
                    value = numValue.toString();
                  }
                  setFieldValue(FIELD_TYPES.HOURS, value);
                }} 
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
                value => setFieldValue(FIELD_TYPES.JOB_NUMBER, value)
              )}
            </div>
            
            <div className="w-full md:w-24">
              {renderFormField(
                FIELD_TYPES.REGO, 
                formState.fields.rego.value, 
                value => setFieldValue(FIELD_TYPES.REGO, value)
              )}
            </div>
            
            <div className="w-full md:w-32">
              {renderFormField(
                FIELD_TYPES.TASK_NUMBER, 
                formState.fields.taskNumber.value, 
                value => setFieldValue(FIELD_TYPES.TASK_NUMBER, value)
              )}
            </div>
          </div>

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
              disabled={isSubmitting}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formState.isValid}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
              data-testid="save-timeentry-button"
            >
              {isSubmitting ? (
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
