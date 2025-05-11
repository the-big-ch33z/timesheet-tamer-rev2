
import React, { useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TimeEntryFormState } from "@/hooks/timesheet/useTimeEntryForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const FIELD_TYPES = {
  HOURS: "hours",
  DESCRIPTION: "description",
  JOB_NUMBER: "jobNumber",
  REGO: "rego",
  TASK_NUMBER: "taskNumber"
};

interface EntryFormItemProps {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  onDelete: () => void;
  entryId: string;
  formId: string; // Add stable formId
  disabled?: boolean;
  scheduledHours?: number;
}

const renderFormField = (
  id: string,
  fieldName: string,
  label: string,
  value: string,
  onChange: (value: string) => void,
  disabled: boolean = false,
  error?: string,
  placeholder: string = "",
  inputExtraProps: Record<string, any> = {}
) => {
  // Create refs to track the actual input values
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || label}
        ref={inputRef}
        {...inputExtraProps}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
const EntryFormItem: React.FC<EntryFormItemProps> = React.memo(({
  formState,
  handleFieldChange,
  handleSave,
  onDelete,
  entryId,
  formId,
  disabled = false,
  scheduledHours = undefined
}) => {
  // Use refs to track if component is mounted
  const mountedRef = useRef(true);
  
  // Track if form is submitting
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Parse hours value directly from form state to avoid conversion issues
  const hourValue = parseFloat(formState.hours || "0");
  const scheduled = typeof scheduledHours === "number" && !isNaN(scheduledHours) ? scheduledHours : undefined;
  const overLimit = scheduled !== undefined && hourValue > scheduled;
  
  // Setup cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      console.debug(`[EntryFormItem] Unmounting form ${formId}`);
    };
  }, [formId]);

  // Create a safer field change handler with mounted check
  const handleFieldChangeCallback = useCallback((field: string, value: string) => {
    if (!mountedRef.current) {
      console.debug(`[EntryFormItem] Ignoring update to ${field} on unmounted component ${formId}`);
      return;
    }
    
    console.debug(`[EntryFormItem] Updating field ${field} to ${value} in form ${formId}`);
    handleFieldChange(field, value);
  }, [handleFieldChange, formId]);

  // Handle hours input with formatting
  const handleHoursInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    let numValue = parseFloat(newValue);
    
    if (!isNaN(numValue)) {
      numValue = Math.round(numValue * 4) / 4; // Round to nearest 0.25
      if (numValue < 0.25) numValue = 0.25;
      if (numValue > 24) numValue = 24;
      newValue = numValue.toString();
    }
    
    handleFieldChangeCallback(FIELD_TYPES.HOURS, newValue);
  }, [handleFieldChangeCallback]);

  // Safe save handler
  const onSaveCallback = useCallback(() => {
    if (disabled || overLimit) return;
    
    try {
      setIsSubmitting(true);
      handleSave();
    } finally {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current) {
            setIsSubmitting(false);
          }
        }, 300);
      }
    }
  }, [disabled, overLimit, handleSave]);

  // Safe delete handler
  const onDeleteCallback = useCallback(() => {
    if (disabled) return;
    onDelete();
  }, [disabled, onDelete]);

  // Warning message for hours
  const hoursWarnMsg = React.useMemo(() => {
    if (overLimit && !isNaN(hourValue))
      return `You entered more hours (${hourValue}) than are scheduled (${scheduled}). Please reduce.`;
    return null;
  }, [overLimit, hourValue, scheduled]);

  return (
    <div 
      className="bg-white rounded-md shadow p-4 border border-gray-200" 
      data-entry-id={entryId}
      data-form-id={formId}
      data-disabled={disabled ? 'true' : 'false'}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Job Number */}
          <div>
            <label htmlFor={`job-${formId}`} className="block text-sm font-medium mb-1">Job Number</label>
            <Input
              id={`job-${formId}`}
              value={formState.jobNumber || ""}
              onChange={(e) => handleFieldChangeCallback(FIELD_TYPES.JOB_NUMBER, e.target.value)}
              disabled={disabled}
              placeholder="Job Number"
              data-field-name="jobNumber"
            />
          </div>
          
          {/* Task Number */}
          <div>
            <label htmlFor={`task-${formId}`} className="block text-sm font-medium mb-1">Task Number</label>
            <Input
              id={`task-${formId}`}
              value={formState.taskNumber || ""}
              onChange={(e) => handleFieldChangeCallback(FIELD_TYPES.TASK_NUMBER, e.target.value)}
              disabled={disabled}
              placeholder="Task Number"
              data-field-name="taskNumber"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hours */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <label htmlFor={`hours-${formId}`} className="block text-sm font-medium mb-1">Hours</label>
                  <Input
                    id={`hours-${formId}`}
                    type="number"
                    value={formState.hours || ""}
                    onChange={handleHoursInput}
                    disabled={disabled}
                    placeholder="Hours"
                    className={
                      "peer " +
                      (overLimit
                        ? "border-red-500 !ring-red-400 focus:!ring-red-400 focus:border-red-500 bg-red-50"
                        : "")
                    }
                    step="0.25"
                    min="0.25"
                    max="24"
                    aria-invalid={overLimit}
                    aria-describedby={overLimit ? `hours-tooltip-${formId}` : undefined}
                    style={overLimit ? { boxShadow: "0 0 0 2px #f87171" } : undefined}
                    data-field-name="hours"
                  />
                  {overLimit && (
                    <div className="absolute top-full left-0 w-max text-xs text-red-600 mt-0.5 bg-white border border-red-200 rounded p-1 shadow-sm z-10">
                      {hoursWarnMsg}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" id={`hours-tooltip-${formId}`}>
                {overLimit && hoursWarnMsg}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Registration Number */}
          <div>
            <label htmlFor={`rego-${formId}`} className="block text-sm font-medium mb-1">Rego</label>
            <Input
              id={`rego-${formId}`}
              value={formState.rego || ""}
              onChange={(e) => handleFieldChangeCallback(FIELD_TYPES.REGO, e.target.value)}
              disabled={disabled}
              placeholder="Rego"
              data-field-name="rego"
            />
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor={`desc-${formId}`} className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            id={`desc-${formId}`}
            value={formState.description || ""}
            onChange={(e) => handleFieldChangeCallback(FIELD_TYPES.DESCRIPTION, e.target.value)}
            disabled={disabled}
            placeholder="Entry description"
            rows={2}
            data-field-name="description"
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-3">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDeleteCallback}
          className="text-red-500 hover:text-red-700"
          disabled={disabled || isSubmitting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        
        <Button 
          size="sm" 
          onClick={onSaveCallback}
          className={
            (!overLimit
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-300') +
            " text-white"
          }
          disabled={disabled || !formState.formEdited || isSubmitting || overLimit}
          data-testid={`save-button-${formId}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : formState.formEdited ? (
            <>
              <Clock className="h-4 w-4 mr-1" />
              Save Changes
            </>
          ) : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
});

EntryFormItem.displayName = 'EntryFormItem';

export default EntryFormItem;
