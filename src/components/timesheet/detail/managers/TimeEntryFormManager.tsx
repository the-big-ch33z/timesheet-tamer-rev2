
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
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const TimeEntryFormManager: React.FC<TimeEntryFormManagerProps> = ({
  formHandlers,
  showEntryForms,
  addEntryForm,
  removeEntryForm,
  handleSaveEntry,
  saveAllPendingChanges,
  interactive,
  startTime,
  endTime,
  calculatedHours,
  onCreateEntry
}) => {
  // Create handler for quick add entry
  const handleAddTime = () => {
    if (!interactive || !onCreateEntry) return;
    onCreateEntry(startTime, endTime, calculatedHours);
  };

  return (
    <div className="space-y-4">
      {interactive && (
        <div>
          <WorkHoursActions 
            onAddTime={handleAddTime}
            onSaveAll={saveAllPendingChanges}
            hasQuickAdd={!!onCreateEntry}
          />
          
          <EntryFormsSection 
            showEntryForms={showEntryForms}
            formHandlers={formHandlers}
            addEntryForm={addEntryForm} 
            removeEntryForm={removeEntryForm}
            handleSaveEntry={handleSaveEntry}
            interactive={interactive}
          />
        </div>
      )}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(TimeEntryFormManager);
