
import React, { useEffect } from "react";
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
  
  console.debug('[TimeEntryForm] Rendering with props:', { 
    date, 
    userId, 
    initialData, 
    isSubmitting,
    hasOnSubmit: !!onSubmit,
    hasOnCancel: !!onCancel
  });
  
  const validations = {
    hours: {
      required: true,
      rules: [
        {
          validate: (value: string) => parseFloat(value) > 0,
          message: "Hours must be greater than 0"
        }
      ]
    },
    description: {
      required: true
    }
  };
  
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
  }, validations);
  
  // Add effect to log formState changes
  useEffect(() => {
    console.debug('[TimeEntryForm:useEffect] Form state updated:', formState);
  }, [formState]);
  
  // Add effect to log isSubmitting changes
  useEffect(() => {
    console.debug('[TimeEntryForm:useEffect] isSubmitting changed to:', isSubmitting);
  }, [isSubmitting]);
  
  console.debug('[TimeEntryForm] Current form state:', {
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    formEdited: formState.formEdited,
    fields: formState.fields
  });

  const handleSubmit = async (e: React.FormEvent) => {
    console.debug('[TimeEntryForm:handleSubmit] Submit event triggered');
    e.preventDefault();
    
    console.debug('[TimeEntryForm:handleSubmit] Validating form...');
    const isValid = validateForm();
    console.debug('[TimeEntryForm:handleSubmit] Form validation result:', isValid);
    
    if (!isValid) {
      console.debug('[TimeEntryForm:handleSubmit] Form validation failed');
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
      console.debug(`[TimeEntryForm:handleSubmit] Raw hours value from form: "${hoursValue}" (${typeof hoursValue})`);
      
      console.debug('[TimeEntryForm:handleSubmit] Validating submission with hours:', hoursValue);
      if (!validateSubmission(hoursValue)) {
        console.debug('[TimeEntryForm:handleSubmit] Hours validation failed');
        return;
      }
      
      // Explicit conversion to number with parseFloat
      const hoursNum = parseFloat(hoursValue);
      console.debug(`[TimeEntryForm:handleSubmit] Parsed hours: ${hoursNum} (${typeof hoursNum})`);
      
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
      
      console.debug('[TimeEntryForm:handleSubmit] Submitting entry:', entry);
      
      // Add success toast before submission
      toast({
        title: "Submitting entry",
        description: `Saving ${hoursNum} hours for ${date.toLocaleDateString()}`,
      });
      
      onSubmit(entry);
      console.debug('[TimeEntryForm:handleSubmit] onSubmit called successfully');
      
      resetForm();
      console.debug('[TimeEntryForm:handleSubmit] Form reset completed');
    } catch (error) {
      console.error("[TimeEntryForm:handleSubmit] Error submitting entry:", error);
      toast({
        title: "Error saving entry",
        description: "There was a problem saving your entry",
        variant: "destructive"
      });
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    console.debug(`[TimeEntryForm:handleFieldChange] START: Setting field value: ${field} = "${value}"`);
    try {
      setFieldValue(field, value);
      console.debug(`[TimeEntryForm:handleFieldChange] Field ${field} updated to "${value}" successfully`);
    } catch (error) {
      console.error(`[TimeEntryForm:handleFieldChange] ERROR updating field ${field}:`, error);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <FormFields 
            formState={formState} 
            onChange={handleFieldChange} 
            disabled={isSubmitting}
          />
          
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
