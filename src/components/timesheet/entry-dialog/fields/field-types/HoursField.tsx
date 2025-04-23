
import React, { useEffect } from "react";
import EntryField from "../EntryField";

// Utility to round to nearest 0.25
const snapToQuarter = (num: number) => Math.round(num * 4) / 4;

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
    const numValue = parseFloat(newValue);
    if (newValue && !isNaN(numValue)) {
      // Snap to nearest 0.25
      const snappedNumValue = snapToQuarter(numValue);
      // Warn if not a multiple of 0.25, but snap anyway
      if (numValue !== snappedNumValue) {
        console.warn(`[HoursField] Entered hours (${numValue}) is not a 0.25 increment. Rounding to ${snappedNumValue}.`);
        onChange(snappedNumValue.toString());
        return;
      }
      if (numValue < 0.25) {
        console.warn(`[HoursField] Invalid value: must be >= 0.25`);
        onChange("0.25");
        return;
      }
      if (numValue > 24) {
        console.warn(`[HoursField] Value exceeds 24. Setting to 24.`);
        onChange("24");
        return;
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

