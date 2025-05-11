
import React, { memo } from 'react';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import EntryFormsSection from '../components/EntryFormsSection';
import WorkHoursActions from '../components/WorkHoursActions';

interface TimeEntryFormManagerProps {
  formHandlers: UseTimeEntryFormReturn[];
  formVisibility: Record<string, boolean>;
  addEntryForm: () => void;
  removeEntryForm: (index: number) => void;
  handleSaveEntry: (index: number) => void;
  saveAllPendingChanges: () => boolean;
  interactive: boolean;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  onAddEntry?: () => void;
  getFormClass: (formId: string) => string;
}

const TimeEntryFormManager: React.FC<TimeEntryFormManagerProps> = ({
  formHandlers,
  formVisibility,
  addEntryForm,
  removeEntryForm,
  handleSaveEntry,
  interactive,
  onAddEntry,
  getFormClass
}) => {
  const hasVisibleForms = Object.values(formVisibility).some(Boolean);
  
  return (
    <div className="space-y-4">
      {interactive && (
        <div>
          <WorkHoursActions 
            onAddEntry={onAddEntry || addEntryForm}
          />
          
          {hasVisibleForms && (
            <EntryFormsSection 
              formVisibility={formVisibility}
              formHandlers={formHandlers}
              addEntryForm={addEntryForm} 
              removeEntryForm={removeEntryForm}
              handleSaveEntry={handleSaveEntry}
              interactive={interactive}
              getFormClass={getFormClass}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default memo(TimeEntryFormManager);
