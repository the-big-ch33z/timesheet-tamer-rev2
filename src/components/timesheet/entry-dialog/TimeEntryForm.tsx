
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EntryFieldConfig, TimeEntry, WorkSchedule } from "@/types";
import CustomFields from "./fields/CustomFields";
import { Trash2 } from "lucide-react";
import TimeFields from "./fields/TimeFields";

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
  // Initialize state with initialData or defaults
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");
  const [rego, setRego] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [formEdited, setFormEdited] = useState(false);

  // Reset form values when initialData or formKey changes
  useEffect(() => {
    setHours(initialData.hours?.toString() || "");
    setDescription(initialData.description || "");
    setJobNumber(initialData.jobNumber || "");
    setRego(initialData.rego || "");
    setStartTime(initialData.startTime || "09:00");
    setEndTime(initialData.endTime || "17:00");
    setFormEdited(false);
  }, [initialData, formKey]);

  // Track form changes
  const handleFormChange = () => {
    if (!formEdited) {
      setFormEdited(true);
    }
  };

  // Auto-save for inline forms with debouncing only if edited
  useEffect(() => {
    if (inline && formEdited && (hours || description || jobNumber || rego) && !disabled) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 800); // Increased debounce time to prevent multiple submissions
      
      return () => clearTimeout(timeoutId);
    }
  }, [hours, description, jobNumber, rego, formEdited, disabled]);

  const handleSave = () => {
    if (!hours && inline) return; // Only validate hours for inline form
    if (disabled) return; // Don't save if disabled

    onSave({
      date: selectedDate,
      hours: parseFloat(hours) || 0,
      description,
      jobNumber,
      rego,
      startTime,
      endTime,
      project: initialData.project || "General",
    });
    
    // Reset form edited state after save
    setFormEdited(false);
  };

  // Check if time fields should be shown
  const showTimeFields = visibleFields.some(field => 
    (field.id === 'startTime' || field.id === 'endTime') && field.visible
  );

  if (inline) {
    return (
      <div className={`flex items-center gap-2 bg-white border rounded-md p-2 ${disabled ? 'opacity-75' : ''}`}>
        <CustomFields
          visibleFields={visibleFields}
          jobNumber={jobNumber}
          setJobNumber={(val) => {
            setJobNumber(val);
            handleFormChange();
          }}
          rego={rego}
          setRego={(val) => {
            setRego(val);
            handleFormChange();
          }}
          description={description}
          setDescription={(val) => {
            setDescription(val);
            handleFormChange();
          }}
          hours={hours}
          setHours={(val) => {
            setHours(val);
            handleFormChange();
          }}
          inline={true}
          disabled={disabled}
        />

        {onDelete && entryId && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(entryId)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

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
          startTime={startTime}
          endTime={endTime}
          setStartTime={(val) => {
            setStartTime(val);
            handleFormChange();
          }}
          setEndTime={(val) => {
            setEndTime(val);
            handleFormChange();
          }}
          selectedDate={selectedDate}
          workSchedule={workSchedule}
          disabled={disabled}
        />
      )}

      <CustomFields
        visibleFields={visibleFields}
        jobNumber={jobNumber}
        setJobNumber={(val) => {
          setJobNumber(val);
          handleFormChange();
        }}
        rego={rego}
        setRego={(val) => {
          setRego(val);
          handleFormChange();
        }}
        description={description}
        setDescription={(val) => {
          setDescription(val);
          handleFormChange();
        }}
        hours={hours}
        setHours={(val) => {
          setHours(val);
          handleFormChange();
        }}
        disabled={disabled}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-brand-600 hover:bg-brand-700" disabled={disabled}>Save Entry</Button>
      </div>
    </form>
  );
};

export default TimeEntryForm;
