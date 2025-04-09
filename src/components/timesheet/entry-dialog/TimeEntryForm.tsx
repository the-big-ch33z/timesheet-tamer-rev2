
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EntryFieldConfig, TimeEntry } from "@/types";
import CustomFields from "./fields/CustomFields";
import { Trash2 } from "lucide-react";

type TimeEntryFormProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onCancel?: () => void;
  onDelete?: (id?: string) => void;
  selectedDate: Date;
  visibleFields: EntryFieldConfig[];
  inline?: boolean;
  entryId?: string;
  initialData?: Partial<TimeEntry>;
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
}) => {
  const [hours, setHours] = useState(initialData.hours?.toString() || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [jobNumber, setJobNumber] = useState(initialData.jobNumber || "");
  const [rego, setRego] = useState(initialData.rego || "");

  useEffect(() => {
    if (inline && (hours || description || jobNumber || rego)) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hours, description, jobNumber, rego]);

  const handleSave = () => {
    if (!hours) return;

    onSave({
      date: selectedDate,
      hours: parseFloat(hours) || 0,
      description,
      jobNumber,
      rego,
      project: initialData.project || "General", // Adding a default project value
    });
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2 bg-white border rounded-md p-2">
        <CustomFields
          visibleFields={visibleFields}
          jobNumber={jobNumber}
          setJobNumber={setJobNumber}
          rego={rego}
          setRego={setRego}
          description={description}
          setDescription={setDescription}
          hours={hours}
          setHours={setHours}
          inline={true}
        />

        {onDelete && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(entryId)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
      <CustomFields
        visibleFields={visibleFields}
        jobNumber={jobNumber}
        setJobNumber={setJobNumber}
        rego={rego}
        setRego={setRego}
        description={description}
        setDescription={setDescription}
        hours={hours}
        setHours={setHours}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-brand-600 hover:bg-brand-700">Save Entry</Button>
      </div>
    </form>
  );
};

export default TimeEntryForm;
