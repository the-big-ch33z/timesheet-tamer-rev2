
import React from "react";
import { EntryFieldConfig, TimeEntry } from "@/types";
import CustomFields from "./fields/CustomFields";
import InlineEntryForm from "./form/InlineEntryForm";
import TimeEntryFormButtons from "./form/TimeEntryFormButtons";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";

type TimeEntryFormProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  selectedDate: Date;
  visibleFields: EntryFieldConfig[];
  inline?: boolean;
  entryId?: string;
  initialData?: Partial<TimeEntry>;
  formKey?: string | number;
  disabled?: boolean;
  userId?: string;
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
  formKey,
  disabled = false,
  userId
}) => {
  // Use our unified form hook
  const { 
    formState,
    handleFieldChange,
    handleSave,
    getFormData
  } = useTimeEntryForm({
    initialData: {
      ...initialData,
      userId: initialData.userId || userId
    },
    formKey,
    onSave,
    selectedDate,
    userId,
    autoSave: inline,
    disabled,
    autoCalculateHours: false
  });

  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

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
      onSubmit={onSubmit} 
      className="space-y-4"
      key={`form-${formKey || 'default'}`}
    >
      <CustomFields
        visibleFields={visibleFields}
        jobNumber={formState.jobNumber}
        setJobNumber={(val) => handleFieldChange('jobNumber', val)}
        rego={formState.rego}
        setRego={(val) => handleFieldChange('rego', val)}
        taskNumber={formState.taskNumber}
        setTaskNumber={(val) => handleFieldChange('taskNumber', val)}
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
