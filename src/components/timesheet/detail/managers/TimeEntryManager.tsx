
import React, { useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { format } from "date-fns";
import { useWorkHours } from "../hooks/useWorkHours";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";
import { calculateHoursVariance, isUndertime } from "../utils/timeCalculations";
import WorkHoursHeader from "../components/WorkHoursHeader";
import TimeEntryDisplay from "../components/TimeEntryDisplay";
import WorkHoursAlerts from "../components/WorkHoursAlerts";
import EntryList from "../components/EntryList";
import { useEntryForms } from "../hooks/useEntryForms";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EntryFormsList from "../components/EntryFormsList";

interface TimeEntryManagerProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const TimeEntryManager: React.FC<TimeEntryManagerProps> = ({
  entries,
  date,
  workSchedule,
  interactive = true,
  onCreateEntry
}) => {
  // Initialize form handlers for entry forms
  const formHandlers = Array(10).fill(null).map((_, i) => useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => {
      if (onCreateEntry) {
        // Pass the data to the parent handler
        console.log("Saving entry with data from form handler:", entry);
        onCreateEntry(
          entry.startTime || startTime,
          entry.endTime || endTime,
          parseFloat(entry.hours.toString()) || calculatedHours
        );
      }
    },
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  }));
  
  // Determine initial time values
  let initialStartTime = "09:00";
  let initialEndTime = "17:00";
  
  if (entries.length > 0) {
    initialStartTime = entries[0].startTime || initialStartTime;
    initialEndTime = entries[0].endTime || initialEndTime;
  } else if (workSchedule) {
    const { getWeekDay, getFortnightWeek } = require("../../utils/scheduleUtils");
    
    const weekDay = getWeekDay(date);
    const weekNum = getFortnightWeek(date);
    
    const scheduleDay = workSchedule.weeks[weekNum][weekDay];
    
    if (scheduleDay) {
      initialStartTime = scheduleDay.startTime || initialStartTime;
      initialEndTime = scheduleDay.endTime || initialEndTime;
    }
  }
  
  // Handle time calculations
  const {
    startTime,
    endTime,
    calculatedHours,
    handleTimeChange
  } = useWorkHours({
    initialStartTime,
    initialEndTime,
    formHandlers,
    interactive
  });
  
  // Setup entry forms management
  const {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    refreshForms,
    key
  } = useEntryForms({ 
    formHandlers 
  });
  
  // Calculate totals
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const hoursVariance = calculateHoursVariance(totalHours, calculatedHours);
  const hasEntries = entries.length > 0;
  
  // Handle saving an entry form
  const handleSaveEntry = (index: number) => {
    if (!interactive || !formHandlers[index]) return;

    const formHandler = formHandlers[index];
    const formData = formHandler.getFormData();
    
    console.log("Saving entry with data:", formData);
    
    onCreateEntry?.(
      formData.startTime || startTime,
      formData.endTime || endTime,
      parseFloat(formData.hours.toString()) || calculatedHours
    );
    
    // Reset the form
    formHandler.resetFormEdited();
    formHandler.resetForm();
    
    // Force a re-render after the entry is added
    setTimeout(() => {
      console.log("Refreshing forms after save");
      refreshForms();
    }, 100);
  };
  
  // Log when entries update
  useEffect(() => {
    console.log("Entries updated in TimeEntryManager:", entries.length);
    if (entries.length > 0) {
      entries.forEach(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        console.log("Entry date:", format(entryDate, "yyyy-MM-dd"), "Entry id:", entry.id);
      });
    }
  }, [entries]);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <WorkHoursHeader hasEntries={hasEntries} />
      
      {/* Time Display Component */}
      <TimeEntryDisplay
        startTime={startTime}
        endTime={endTime}
        calculatedHours={calculatedHours}
        totalHours={totalHours}
        hasEntries={hasEntries}
        interactive={interactive}
        onTimeChange={handleTimeChange}
      />
      
      <div className="flex justify-end">
        <div className="text-right">
          <div className="text-sm text-amber-700">Daily Target:</div>
          <div className="text-xl font-semibold text-amber-900">{calculatedHours.toFixed(1)}</div>
        </div>
      </div>
      
      {/* Alerts for work hours */}
      <WorkHoursAlerts
        hasEntries={hasEntries}
        isUndertime={isUndertime(hoursVariance)}
        hoursVariance={hoursVariance}
        interactive={interactive}
        showEntryForms={showEntryForms.length > 0}
      />
      
      {/* Entry List with Delete functionality */}
      {hasEntries && (
        <EntryList 
          entries={entries}
          key={`entries-list-${entries.length}-${key}`}
        />
      )}
      
      {/* Entry Forms List */}
      {interactive && showEntryForms.length > 0 && (
        <EntryFormsList
          showEntryForms={showEntryForms}
          formHandlers={formHandlers}
          handleSaveEntry={handleSaveEntry}
          removeEntryForm={removeEntryForm}
        />
      )}
      
      {/* Add Entry Button */}
      {interactive && (
        <Button 
          onClick={addEntryForm}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Entry
        </Button>
      )}
    </div>
  );
};

export default TimeEntryManager;
