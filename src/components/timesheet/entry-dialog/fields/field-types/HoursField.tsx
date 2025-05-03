
import React, { useEffect, useState } from "react";
import EntryField from "../EntryField";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('HoursField');

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
  // Internal state to track the field during editing
  const [internalValue, setInternalValue] = useState<string>(value);
  
  // Update internal state when props change
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  
  // Add specific logging for HoursField
  logger.debug(`[HoursField] Rendering hours field (id: ${id}):`, {
    value,
    internalValue,
    disabled,
    required
  });

  // Track value changes
  useEffect(() => {
    logger.debug(`[HoursField] Hours prop value updated:`, value);
  }, [value]);

  // Enhanced onChange handler with validation
  const handleChange = (newValue: string) => {
    logger.debug(`[HoursField] Hours changing to: '${newValue}'`);
    
    // First update the internal value for immediate feedback
    setInternalValue(newValue);
    
    // Allow empty field during editing
    if (!newValue) {
      onChange('');
      return;
    }
    
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) {
      logger.debug(`[HoursField] Ignoring invalid numeric input: ${newValue}`);
      return; // Don't update parent with invalid value
    }
    
    // Only perform validation and rounding when we have a valid number
    if (!isNaN(numValue)) {
      // Snap to nearest 0.25
      const snappedNumValue = snapToQuarter(numValue);
      
      // Warn if not a multiple of 0.25, but snap anyway
      if (numValue !== snappedNumValue) {
        logger.debug(`[HoursField] Entered hours (${numValue}) is not a 0.25 increment. Rounding to ${snappedNumValue}.`);
      }
      
      // Validate min/max
      if (numValue < 0.25) {
        logger.debug(`[HoursField] Value less than minimum: ${numValue}, setting to 0.25`);
        onChange("0.25");
      } else if (numValue > 24) {
        logger.debug(`[HoursField] Value exceeds maximum: ${numValue}, setting to 24`);
        onChange("24");
      } else {
        // Use the snapped value
        onChange(snappedNumValue.toString());
      }
    }
  };
  
  // Handle blur event for final validation
  const handleBlur = () => {
    const numValue = parseFloat(internalValue);
    
    // If empty or invalid, use minimum value
    if (!internalValue || isNaN(numValue)) {
      if (required) {
        logger.debug(`[HoursField] Empty field on blur. Setting to minimum 0.25.`);
        setInternalValue("0.25");
        onChange("0.25");
      } else {
        // Allow empty if not required
        logger.debug(`[HoursField] Empty field on blur. Not required, keeping empty.`);
        setInternalValue("");
        onChange("");
      }
      return;
    }
    
    // Apply min/max constraints on blur
    if (numValue < 0.25) {
      logger.debug(`[HoursField] Value below minimum on blur: ${numValue}. Setting to 0.25.`);
      setInternalValue("0.25");
      onChange("0.25");
    } else if (numValue > 24) {
      logger.debug(`[HoursField] Value above maximum on blur: ${numValue}. Setting to 24.`);
      setInternalValue("24");
      onChange("24");
    } else {
      // Ensure value is snapped to quarter hour
      const snappedValue = snapToQuarter(numValue);
      const snappedStr = snappedValue.toString();
      
      if (snappedValue !== numValue) {
        logger.debug(`[HoursField] Snapping on blur: ${numValue} -> ${snappedValue}`);
        setInternalValue(snappedStr);
        onChange(snappedStr);
      }
    }
  };

  return (
    <EntryField
      id={id}
      name="Hours"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
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
