
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type EntryFieldType = 'text' | 'number' | 'textarea';

interface EntryFieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  inline?: boolean;
  type?: EntryFieldType;
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: string;
  showLabel?: boolean;
  className?: string;
}

const EntryField: React.FC<EntryFieldProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  inline = false,
  type = 'text',
  disabled = false,
  min,
  max,
  step,
  showLabel = true,
  className = ""
}) => {
  const fieldId = `field-${id}`;
  
  return (
    <div className={`${inline ? "flex-1 min-w-20" : "space-y-2"} ${className}`}>
      {showLabel && !inline && <Label htmlFor={fieldId}>{name}</Label>}
      
      {(type === 'textarea' && !inline) ? (
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={3}
        />
      ) : (
        <Input
          id={fieldId}
          type={type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inline ? "h-9" : ""}
          min={min}
          max={max}
          step={step}
        />
      )}
    </div>
  );
};

export default EntryField;
