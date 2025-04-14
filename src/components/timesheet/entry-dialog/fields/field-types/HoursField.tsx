
import React, { useEffect } from "react";
import EntryField from "../EntryField";

interface HoursFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  inline?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}

const HoursField: React.FC<HoursFieldProps> = ({
  id,
  value,
  onChange,
  required = false,
  inline = false,
  disabled = false,
  showLabel = true,
  className = "",
}) => {
  // Add specific logging for HoursField
  console.debug(`[HoursField] Rendering hours field (id: ${id}):`, {
    value,
    disabled,
    required
  });
  
  // Track value changes
  useEffect(() => {
    console.debug(`[HoursField] Hours value updated:`, value);
  }, [value]);
  
  // Enhanced onChange handler with validation
  const handleChange = (newValue: string) => {
    console.debug(`[HoursField] Hours changing to: '${newValue}'`);
    
    // Basic validation for hours
    const numValue = parseFloat(newValue);
    if (newValue && !isNaN(numValue)) {
      if (numValue < 0) {
        console.warn(`[HoursField] Invalid negative hours value: ${numValue}`);
      } else if (numValue > 24) {
        console.warn(`[HoursField] Hours value exceeds maximum (24): ${numValue}`);
      }
    }
    
    onChange(newValue);
  };

  return (
    <EntryField
      id={id}
      name="Hours"
      value={value}
      onChange={handleChange}
      placeholder="Hrs"
      required={required}
      inline={inline}
      type="number"
      disabled={disabled}
      min="0.25"
      max="24"
      step="0.25"
      showLabel={showLabel}
      className={inline ? `w-24 ${className}` : className}
    />
  );
};

export default HoursField;
