
import React from "react";
import EntryField from "../EntryField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TOIL_JOB_NUMBER } from "@/utils/time/services/toil/toilService"; // Fixed import path

interface JobNumberFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inline?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}

const JobNumberField: React.FC<JobNumberFieldProps> = ({
  id,
  value,
  onChange,
  required = false,
  inline = false,
  disabled = false,
  showLabel = true,
}) => {
  // Common job numbers including TOIL
  const commonJobOptions = [
    { value: "", label: "Select job number..." },
    { value: TOIL_JOB_NUMBER, label: "TOIL (Use Time Off)" },
    { value: "GENERAL", label: "General" },
    { value: "ADMIN", label: "Admin" },
    { value: "MEETING", label: "Meeting" },
    { value: "TRAINING", label: "Training" }
  ];

  // Use Select component for common options
  const renderAsSelect = true; // Enable this feature permanently

  if (renderAsSelect) {
    return (
      <div className={inline ? "inline-block mr-4 mb-2" : "mb-4"}>
        {showLabel && <Label htmlFor={id} className="block mb-1">Job Number</Label>}
        <Select 
          value={value} 
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={id} className={`w-full ${required ? "border-amber-400" : ""}`}>
            <SelectValue placeholder="Select job number..." />
          </SelectTrigger>
          <SelectContent>
            {commonJobOptions.map(option => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className={option.value === TOIL_JOB_NUMBER ? "text-amber-600 font-medium" : ""}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Fallback to basic input field
  return (
    <EntryField
      id={id}
      name="Job Number"
      value={value}
      onChange={onChange}
      placeholder="Job No."
      required={required}
      inline={inline}
      disabled={disabled}
      showLabel={showLabel}
    />
  );
};

export default JobNumberField;
