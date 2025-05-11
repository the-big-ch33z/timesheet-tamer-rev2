
import React from "react";
import { useFormState } from "@/hooks/form/useFormState";
import { Card } from "@/components/ui/card";
import { TimeEntry } from "@/types";
import { useToast } from "@/hooks/use-toast";
import FormFields from "./components/FormFields";
import FormButtons from "./components/FormButtons";
import { useFormValidation } from "./components/FormValidation";

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

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSubmit,
  onCancel,
  date,
  userId,
  initialData = {},
  isSubmitting
}) => {
  const { toast } = useToast();
  const { validateSubmission } = useFormValidation();
  
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
      const hoursValue = formState.fields.hours?.value || '';
      console.debug(`[TimeEntryForm] Raw hours value from form: "${hoursValue}" (${typeof hoursValue})`);
      
      if (!validateSubmission(hoursValue)) {
        return;
      }
      
      // Explicit conversion to number with parseFloat
      const hoursNum = parseFloat(hoursValue);
      console.debug(`[TimeEntryForm] Parsed hours: ${hoursNum} (${typeof hoursNum})`);
      
      // Create entry object with explicit numeric hours
      const entry: Omit<TimeEntry, "id"> = {
        date,
        userId,
        hours: hoursNum,
        description: formState.fields.description?.value || "",
        jobNumber: formState.fields.jobNumber?.value || undefined,
        taskNumber: formState.fields.taskNumber?.value || undefined,
        rego: formState.fields.rego?.value || undefined,
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
          <FormFields formState={formState} setFieldValue={setFieldValue} />
          
          <FormButtons 
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            isValid={formState.isValid}
          />
        </div>
      </form>
    </Card>
  );
};

export default TimeEntryForm;
