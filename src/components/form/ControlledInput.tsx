
import React, { useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ControlledInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const ControlledInput = React.memo(({
  id,
  label,
  value,
  onChange,
  onBlur,
  required = false,
  type = "text",
  placeholder = "",
  error,
  disabled = false,
  className = ""
}: ControlledInputProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${className} ${error ? 'border-red-500' : ''}`}
        aria-invalid={!!error}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

ControlledInput.displayName = 'ControlledInput';

export default ControlledInput;
