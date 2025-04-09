
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { EntryFieldConfig, TimeEntry } from "@/types";
import DateField from "./fields/DateField";
import TimeFields from "./fields/TimeFields";
import ProjectField from "./fields/ProjectField";
import CustomFields from "./fields/CustomFields";
import { calculateHours } from "./utils/timeCalculations";

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
  const [date, setDate] = useState<Date>(selectedDate);
  const [project, setProject] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");

  // Update hours when start/end time changes
  useEffect(() => {
    if (startTime && endTime) {
      const calculatedHours = calculateHours(startTime, endTime);
      setHours(calculatedHours.toFixed(2));
    }
  }, [startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      project,
      hours: parseFloat(hours),
      description,
      startTime,
      endTime,
      jobNumber,
      rego,
    });
    
    // Reset form handled by parent component
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DateField date={date} setDate={setDate} />
      
      <TimeFields 
        startTime={startTime}
        endTime={endTime}
        setStartTime={setStartTime}
        setEndTime={setEndTime}
      />
      
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
      
      <ProjectField project={project} setProject={setProject} />

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
