
import React from 'react';
import { TimeEntry } from '@/types';
import EntryField from '../../entry-dialog/fields/EntryField';

interface EntryFormStepProps {
  values: Partial<TimeEntry>;
  onFieldChange: (field: string, value: string | number) => void;
}

const EntryFormStep: React.FC<EntryFormStepProps> = ({
  values,
  onFieldChange
}) => {
  // Handle changes for each field
  const handleHoursChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onFieldChange('hours', numValue);
  };
  
  // Helper to ensure string values
  const ensureString = (value: any): string => {
    return value !== undefined && value !== null ? String(value) : '';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <EntryField
            id="hours"
            name="Hours"
            value={values.hours?.toString() || ''}
            onChange={handleHoursChange}
            placeholder="Enter hours"
            type="number"
            min="0"
            step="0.1"
            required={true}
            showLabel={true}
          />
        </div>
        
        <div>
          <EntryField
            id="jobNumber"
            name="Job Number"
            value={ensureString(values.jobNumber)}
            onChange={(value) => onFieldChange('jobNumber', value)}
            placeholder="Enter job number"
            showLabel={true}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <EntryField
            id="rego"
            name="Rego"
            value={ensureString(values.rego)}
            onChange={(value) => onFieldChange('rego', value)}
            placeholder="Enter rego"
            showLabel={true}
          />
        </div>
        
        <div>
          <EntryField
            id="taskNumber"
            name="Task Number"
            value={ensureString(values.taskNumber)}
            onChange={(value) => onFieldChange('taskNumber', value)}
            placeholder="Enter task number"
            showLabel={true}
          />
        </div>
      </div>
      
      <div>
        <EntryField
          id="description"
          name="Description"
          value={ensureString(values.description)}
          onChange={(value) => onFieldChange('description', value)}
          placeholder="Enter description"
          type="textarea"
          showLabel={true}
        />
      </div>
    </div>
  );
};

export default EntryFormStep;
