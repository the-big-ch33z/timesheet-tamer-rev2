
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Export the type so it can be imported in other files
export type EntryFieldType = "text" | "number" | "email" | "password" | "date" | "time" | "textarea";

interface EntryFieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  inline?: boolean;
  type?: EntryFieldType;
  className?: string;
  min?: string;
  max?: string;
  step?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

const EntryField: React.FC<EntryFieldProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  required = false,
  inline = false,
  type = "text",
  className = "",
  min,
  max,
  step,
  disabled = false,
  showLabel = true,
}) => {
  // Add console log to track disabled state
  console.debug(`[EntryField] Rendering field '${name}' (id: ${id}) with disabled=${disabled}, value='${value}'`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    console.debug(`[EntryField] '${name}' value changed to: '${e.target.value}'`);
    onChange(e.target.value);
  };

  return (
    <div className={inline ? "flex items-center gap-2" : "space-y-2"}>
      {showLabel && (
        <Label
          htmlFor={id}
          className={`text-sm font-medium ${
            inline ? "mb-0 min-w-24" : "mb-1 block"
          }`}
        >
          {name}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {type === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          required={required}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={className}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
        />
      )}
    </div>
  );
};

export default EntryField;
