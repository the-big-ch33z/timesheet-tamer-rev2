
import React, { useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useFormState } from "@/hooks/form/useFormState";
import { useFormSubmission } from "@/hooks/form/useFormSubmission";
import { TimeEntryFormState } from "@/hooks/timesheet/useTimeEntryForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { createTimeLogger } from "@/utils/time/errors";

const logger = createTimeLogger('EntryFormItem');

const FIELD_TYPES = {
  HOURS: "hours",
  DESCRIPTION: "description",
  JOB_NUMBER: "jobNumber",
  REGO: "rego",
  TASK_NUMBER: "taskNumber"
};

const VALIDATION_RULES = {
  hours: {
    required: true,
    rules: [
      {
        validate: (value: string) => {
          const parsedValue = parseFloat(value);
          return !isNaN(parsedValue) && parsedValue > 0;
        },
        message: "Hours must be greater than 0"
      }
    ]
  }
};

interface EntryFormItemProps {
  formState: TimeEntryFormState;
  handleFieldChange: (field: string, value: string) => void;
  handleSave: () => void;
  onDelete: () => void;
  entryId: string;
  disabled?: boolean;
  scheduledHours?: number; // The cap for entered hours
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
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || label}
        {...inputExtraProps}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const EntryFormItem: React.FC<EntryFormItemProps> = React.memo(({
  formState: initialFormState,
  handleFieldChange: parentHandleFieldChange,
  handleSave,
  onDelete,
  entryId,
  disabled = false,
  scheduledHours = undefined
}) => {
  const { formState, setFieldValue, validateForm } = useFormState(`entry-${entryId}`, {
    hours: initialFormState.hours || '',
    description: initialFormState.description || '',
    jobNumber: initialFormState.jobNumber || '',
    rego: initialFormState.rego || '',
    taskNumber: initialFormState.taskNumber || ''
  }, VALIDATION_RULES);

  const { isSubmitting, handleSubmit } = useFormSubmission({
    onSubmit: async () => {
      if (validateForm() && !overLimit) {
        logger.debug(`[EntryFormItem] Submitting form with hours: ${formState.fields.hours.value}`);
        handleSave();
      } else {
        logger.debug(`[EntryFormItem] Form validation failed or over limit. Valid: ${formState.isValid}, overLimit: ${overLimit}`);
      }
    }
  });

  const handleFieldChangeCallback = useCallback((field: string, value: string) => {
    logger.debug(`[EntryFormItem] Field changed: ${field}, value: ${value}`);
    setFieldValue(field, value);
    parentHandleFieldChange(field, value);
  }, [setFieldValue, parentHandleFieldChange]);

  useEffect(() => {
    if (formState.formEdited) {
      Object.entries(formState.fields).forEach(([field, { value }]) => {
        parentHandleFieldChange(field, value);
      });
    }

    return () => {
      console.debug(`[EntryFormItem] Cleaning up form state for entry ${entryId}`);
    };
  }, [formState.fields, parentHandleFieldChange, entryId, formState.formEdited]);

  // FIX: Improved hours input handler with better validation and logging
  const handleHoursInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // First log what we received
    logger.debug(`[EntryFormItem] Raw hours input: '${newValue}'`);
    
    // Handle empty input
    if (!newValue) {
      logger.debug(`[EntryFormItem] Empty hours input, setting to empty string`);
      handleFieldChangeCallback(FIELD_TYPES.HOURS, '');
      return;
    }
    
    // Parse the numeric value
    let numValue = parseFloat(newValue);
    
    if (isNaN(numValue)) {
      logger.debug(`[EntryFormItem] Invalid numeric input: ${newValue}`);
      return; // Don't update with invalid input
    }
    
    // Apply validations
    if (numValue < 0.25) {
      logger.debug(`[EntryFormItem] Hours too small (${numValue}), setting to 0.25`);
      numValue = 0.25;
    } else if (numValue > 24) {
      logger.debug(`[EntryFormItem] Hours too large (${numValue}), setting to 24`);
      numValue = 24;
    } else {
      // Snap to quarter hour
      const snapped = Math.round(numValue * 4) / 4;
      if (snapped !== numValue) {
        logger.debug(`[EntryFormItem] Snapping hours from ${numValue} to ${snapped}`);
        numValue = snapped;
      }
    }
    
    // Convert back to string and update
    newValue = numValue.toString();
    logger.debug(`[EntryFormItem] Final hours value: ${newValue}`);
    handleFieldChangeCallback(FIELD_TYPES.HOURS, newValue);
  };

  // Parse the hour value for validation - with improved error handling
  const hourValue = useMemo(() => {
    const rawValue = formState.fields.hours.value;
    
    if (!rawValue) {
      return 0;
    }
    
    const parsedValue = parseFloat(rawValue);
    if (isNaN(parsedValue)) {
      logger.warn(`[EntryFormItem] Invalid hours value: ${rawValue}`);
      return 0;
    }
    
    return parsedValue;
  }, [formState.fields.hours.value]);
  
  // Debug logging for hours value
  useEffect(() => {
    logger.debug(`[EntryFormItem] Current hours value: ${hourValue}`);
  }, [hourValue]);
  
  const scheduled = typeof scheduledHours === "number" && !isNaN(scheduledHours) ? scheduledHours : undefined;
  const overLimit = scheduled !== undefined && hourValue > scheduled;

  const onSaveCallback = useCallback(() => {
    if (!disabled && validateForm() && !overLimit) {
      logger.debug(`[EntryFormItem] Save button clicked, current hours: ${hourValue}`);
      handleSubmit(formState);
    } else {
      logger.debug(`[EntryFormItem] Save prevented - disabled: ${disabled}, valid: ${formState.isValid}, overLimit: ${overLimit}`);
    }
  }, [disabled, validateForm, handleSubmit, formState, overLimit, hourValue]);

  const hoursWarnMsg = useMemo(() => {
    if (overLimit && !isNaN(hourValue))
      return `You entered more hours (${hourValue}) than are scheduled (${scheduled}). Please reduce.`;
    return null;
  }, [overLimit, hourValue, scheduled]);
  
  // Additional debugging for form validation state
  useEffect(() => {
    logger.debug(`[EntryFormItem] Form validation state: valid=${formState.isValid}, edited=${formState.formEdited}`);
    
    if (formState.fields.hours.error) {
      logger.debug(`[EntryFormItem] Hours field error: ${formState.fields.hours.error}`);
    }
  }, [formState.isValid, formState.formEdited, formState.fields.hours.error]);

  return (
    <div 
      className="bg-white rounded-md shadow p-4 border border-gray-200" 
      data-entry-id={entryId}
      data-disabled={disabled ? 'true' : 'false'}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFormField(
            `job-${entryId}`, 
            FIELD_TYPES.JOB_NUMBER,
            "Job Number", 
            formState.fields.jobNumber.value,
            (value) => handleFieldChangeCallback(FIELD_TYPES.JOB_NUMBER, value),
            disabled,
            formState.fields.jobNumber.error
          )}
          
          {renderFormField(
            `task-${entryId}`, 
            FIELD_TYPES.TASK_NUMBER,
            "Task Number", 
            formState.fields.taskNumber.value,
            (value) => handleFieldChangeCallback(FIELD_TYPES.TASK_NUMBER, value),
            disabled,
            formState.fields.taskNumber.error
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(() => {
            const warning = overLimit;
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <label htmlFor={`hours-${entryId}`} className="block text-sm font-medium mb-1">
                        Hours <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id={`hours-${entryId}`}
                        type="number"
                        value={formState.fields.hours.value}
                        onChange={handleHoursInput}
                        disabled={disabled}
                        placeholder="Hours"
                        className={
                          "peer " +
                          (warning
                            ? "border-red-500 !ring-red-400 focus:!ring-red-400 focus:border-red-500 bg-red-50"
                            : "")
                        }
                        step="0.25"
                        min="0.25"
                        max="24"
                        aria-invalid={warning}
                        aria-describedby={warning ? `hours-tooltip-${entryId}` : undefined}
                        style={warning ? { boxShadow: "0 0 0 2px #f87171" } : undefined}
                        onBlur={() => {
                          // Ensure we have at least 0.25 on blur if the field has content
                          if (formState.fields.hours.value && parseFloat(formState.fields.hours.value) < 0.25) {
                            handleFieldChangeCallback(FIELD_TYPES.HOURS, "0.25");
                          }
                        }}
                      />
                      {formState.fields.hours.error && (
                        <p className="text-red-500 text-xs mt-1">{formState.fields.hours.error}</p>
                      )}
                      {warning && (
                        <div className="absolute top-full left-0 w-max text-xs text-red-600 mt-0.5 bg-white border border-red-200 rounded p-1 shadow-sm z-10">
                          {hoursWarnMsg}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" id={`hours-tooltip-${entryId}`}>
                    {overLimit && hoursWarnMsg}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })()}

          {renderFormField(
            `rego-${entryId}`, 
            FIELD_TYPES.REGO,
            "Rego", 
            formState.fields.rego.value,
            (value) => handleFieldChangeCallback(FIELD_TYPES.REGO, value),
            disabled,
            formState.fields.rego.error
          )}
        </div>
        
        <div>
          <label htmlFor={`desc-${entryId}`} className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            id={`desc-${entryId}`}
            value={formState.fields.description.value}
            onChange={(e) => handleFieldChangeCallback(FIELD_TYPES.DESCRIPTION, e.target.value)}
            disabled={disabled}
            placeholder="Entry description"
            rows={2}
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-3">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDelete}
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
            (formState.isValid && !overLimit
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-300') +
            " text-white"
          }
          disabled={disabled || !formState.formEdited || !formState.isValid || isSubmitting || overLimit}
          data-testid={`save-button-${entryId}`}
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
