
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
  inline?: boolean;
};

const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  onSave,
  onCancel,
  selectedDate,
  visibleFields,
  inline = false,
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
    
    // Reset fields after save
    setHours("");
    setDescription("");
    setJobNumber("");
    setRego("");
  };

  if (inline) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
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

        <div className="flex gap-2 ml-auto">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            size="sm"
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-brand-600 hover:bg-brand-700" size="sm">Save</Button>
        </div>
      </form>
    );
  }

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
