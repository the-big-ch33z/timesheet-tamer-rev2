import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { EntryFieldConfig, TimeEntry } from "@/types";
import CustomFields from "./fields/CustomFields";

type TimeEntryFormProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onCancel: () => void;
  selectedDate: Date;
  visibleFields: EntryFieldConfig[];
};

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSave,
  onCancel,
  selectedDate,
  visibleFields,
}) => {
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date: selectedDate,
      project: "No Project",
      hours: parseFloat(hours) || 0,
      description,
      jobNumber,
      rego,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-brand-600 hover:bg-brand-700">Save Entry</Button>
      </DialogFooter>
    </form>
  );
};

export default TimeEntryForm;
