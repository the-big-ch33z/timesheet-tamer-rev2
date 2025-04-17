
import React, { memo } from 'react';
import { UseTimeEntryFormReturn } from '@/hooks/timesheet/types/timeEntryTypes';
import EntryFormsSection from '../components/EntryFormsSection';
import WorkHoursActions from '../components/WorkHoursActions';

interface TimeEntryFormManagerProps {
  formHandlers: UseTimeEntryFormReturn[];
  showEntryForms: boolean[];
  addEntryForm: () => void;
  removeEntryForm: (index: number) => void;
  handleSaveEntry: (index: number) => void;
  saveAllPendingChanges: () => boolean;
  interactive: boolean;
  startTime: string;
  endTime: string;
  calculatedHours: number;
  onAddEntry?: () => void;
}

const TimeEntryFormManager: React.FC<TimeEntryFormManagerProps> = ({
  formHandlers,
  showEntryForms,
  addEntryForm,
  removeEntryForm,
  handleSaveEntry,
  interactive,
  onAddEntry
}) => {
  return (
    <div className="space-y-4">
      {interactive && (
        <div>
          <WorkHoursActions 
            onAddEntry={onAddEntry || addEntryForm}
          />
          
          {showEntryForms.some(Boolean) && (
            <EntryFormsSection 
              showEntryForms={showEntryForms}
              formHandlers={formHandlers}
              addEntryForm={addEntryForm} 
              removeEntryForm={removeEntryForm}
              handleSaveEntry={handleSaveEntry}
              interactive={interactive}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default memo(TimeEntryFormManager);
