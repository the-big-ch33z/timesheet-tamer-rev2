
import React, { useEffect } from "react";
import { EntryFieldConfig, TimeEntry, WorkSchedule } from "@/types";
import TimeFields from "./fields/TimeFields";
import CustomFields from "./fields/CustomFields";
import InlineEntryForm from "./form/InlineEntryForm";
import TimeEntryFormButtons from "./form/TimeEntryFormButtons";
import { useEntryFormState } from "./form/useEntryFormState";

type TimeEntryFormProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onCancel?: () => void;
  onDelete?: (id?: string) => void;
  selectedDate: Date;
  visibleFields: EntryFieldConfig[];
  inline?: boolean;
  entryId?: string;
  initialData?: Partial<TimeEntry>;
  workSchedule?: WorkSchedule;
  formKey?: string | number;
  disabled?: boolean;
};

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSave,
  onCancel,
  onDelete,
  selectedDate,
  visibleFields,
  inline = false,
  entryId,
  initialData = {},
  workSchedule,
  formKey,
  disabled = false
}) => {
  const { 
    formState,
    handleFieldChange,
    getFormData,
    resetFormEdited
  } = useEntryFormState(initialData, formKey);

  // Auto-save for inline forms with debouncing only if edited
  useEffect(() => {
    if (inline && formState.formEdited && (formState.hours || formState.description || formState.jobNumber || formState.rego) && !disabled) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 800); // Increased debounce time to prevent multiple submissions
      
      return () => clearTimeout(timeoutId);
    }
  }, [formState.hours, formState.description, formState.jobNumber, formState.rego, formState.formEdited, disabled]);

  const handleSave = () => {
    if (!formState.hours && inline) return; // Only validate hours for inline form
    if (disabled) return; // Don't save if disabled

    onSave(getFormData(selectedDate));
    
    // Reset form edited state after save
    resetFormEdited();
  };

  // Check if time fields should be shown
  const showTimeFields = visibleFields.some(field => 
    (field.id === 'startTime' || field.id === 'endTime') && field.visible
  );

  // Render inline form
  if (inline) {
    return (
      <InlineEntryForm 
        visibleFields={visibleFields}
        formValues={formState}
        onFieldChange={handleFieldChange}
        onDelete={onDelete}
        entryId={entryId}
        disabled={disabled}
      />
    );
  }

  // Render full form
  return (
    <form 
      onSubmit={(e) => { 
        e.preventDefault(); 
        handleSave(); 
      }} 
      className="space-y-4"
      key={`form-${formKey || 'default'}`}
    >
      {showTimeFields && (
        <TimeFields 
          startTime={formState.startTime}
          endTime={formState.endTime}
          setStartTime={(val) => handleFieldChange('startTime', val)}
          setEndTime={(val) => handleFieldChange('endTime', val)}
          selectedDate={selectedDate}
          workSchedule={workSchedule}
          disabled={disabled}
        />
      )}

      <CustomFields
        visibleFields={visibleFields}
        jobNumber={formState.jobNumber}
        setJobNumber={(val) => handleFieldChange('jobNumber', val)}
        rego={formState.rego}
        setRego={(val) => handleFieldChange('rego', val)}
        description={formState.description}
        setDescription={(val) => handleFieldChange('description', val)}
        hours={formState.hours}
        setHours={(val) => handleFieldChange('hours', val)}
        disabled={disabled}
      />

      <TimeEntryFormButtons
        onSave={handleSave}
        onCancel={onCancel}
        onDelete={onDelete}
        entryId={entryId}
        inline={inline}
        disabled={disabled}
      />
    </form>
  );
};

export default TimeEntryForm;
