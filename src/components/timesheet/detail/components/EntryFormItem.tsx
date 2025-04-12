
import React from "react";
import { Button } from "@/components/ui/button";
import InlineEntryForm from "../../entry-dialog/form/InlineEntryForm";
import { TimeEntryFormState } from "@/hooks/timesheet/useTimeEntryForm";

interface EntryFormItemProps {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  onDelete: () => void;
  entryId: string;
  disabled?: boolean;
}

const EntryFormItem: React.FC<EntryFormItemProps> = ({
  formState,
  handleFieldChange,
  handleSave,
  onDelete,
  entryId,
  disabled = false
}) => {
  return (
    <div className="bg-white rounded-md shadow p-3 border border-gray-200">
      <InlineEntryForm 
        visibleFields={[
          { id: "job", name: "Job Number", type: "text", required: false, visible: true },
          { id: "rego", name: "Rego", type: "text", required: false, visible: true },
          { id: "task", name: "Task Number", type: "text", required: false, visible: true },
          { id: "notes", name: "Notes", type: "text", required: false, visible: true },
          { id: "hours", name: "Hours", type: "number", required: true, visible: true }
        ]}
        formValues={formState}
        onFieldChange={handleFieldChange}
        onDelete={onDelete}
        entryId={entryId}
        disabled={disabled}
      />
      <div className="flex justify-end mt-2">
        <Button 
          size="sm" 
          onClick={handleSave}
          className="bg-green-500 hover:bg-green-600 text-white"
          disabled={disabled}
        >
          Save Entry
        </Button>
      </div>
    </div>
  );
};

export default EntryFormItem;
