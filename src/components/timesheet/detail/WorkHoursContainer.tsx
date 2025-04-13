
import React, { useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";
import { useWorkHours } from "./hooks/useWorkHours";
import { useEntryForms } from "./hooks/useEntryForms";
import { calculateHoursVariance, isUndertime } from "./utils/timeCalculations";
import WorkHoursHeader from "./components/WorkHoursHeader";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import EntryList from "./components/EntryList";
import EntryFormsList from "./components/EntryFormsList";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const WorkHoursContainer: React.FC<WorkHoursSectionProps> = ({ 
  entries, 
  date, 
  workSchedule,
  interactive = true, 
  onCreateEntry
}) => {
  // Debug entries being passed in
  useEffect(() => {
    console.log("WorkHoursContainer received date:", format(date, "yyyy-MM-dd"));
    console.log("WorkHoursContainer received entries:", entries);
    console.log("WorkHoursContainer interactive mode:", interactive);
    if (entries.length > 0) {
      entries.forEach(entry => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
        console.log("Entry date:", format(entryDate, "yyyy-MM-dd"), "Entry id:", entry.id);
      });
    }
  }, [entries, date, interactive]);

  // Create form handlers for ALL possible entry forms upfront
  const formHandlers = Array(10).fill(null).map((_, i) => useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => {
      if (onCreateEntry) {
        // Pass the data to the parent handler
        console.log("Saving entry with data:", entry);
        onCreateEntry(
          entry.startTime || startTime, 
          entry.endTime || endTime, 
          parseFloat(entry.hours.toString()) || calculatedHours
        );
        
        // Reset the form instead of removing it
        formHandlers[i].resetFormEdited();
        
        // Clear form fields
        formHandlers[i].resetForm();
        
        // Force a re-render after the entry is added
        setTimeout(() => {
          console.log("Forcing re-render after save");
          refreshForms();
        }, 100);
      }
    },
    autoSave: false,
    autoCalculateHours: true,
    disabled: !interactive
  }));

  // Initialize start and end times
  let initialStartTime = "09:00";
  let initialEndTime = "17:00";
  
  // If we have entries, use the first entry's times
  if (entries.length > 0) {
    initialStartTime = entries[0].startTime || initialStartTime;
    initialEndTime = entries[0].endTime || initialEndTime;
  } 
  // Otherwise, try to get times from workSchedule if available
  else if (workSchedule) {
    const { getWeekDay, getFortnightWeek } = require("../utils/scheduleUtils");
    
    const weekDay = getWeekDay(date);
    const weekNum = getFortnightWeek(date);
    
    const scheduleDay = workSchedule.weeks[weekNum][weekDay];
    
    if (scheduleDay) {
      initialStartTime = scheduleDay.startTime || initialStartTime;
      initialEndTime = scheduleDay.endTime || initialEndTime;
    }
  }
  
  // Use our custom hooks
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
  
  const {
    showEntryForms,
    addEntryForm,
    removeEntryForm,
    key,
    refreshForms
  } = useEntryForms({ formHandlers });
  
  // Calculate total hours from entries
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Calculate variance from expected hours
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
    console.log("Entries updated in WorkHoursContainer:", entries.length);
  }, [entries]);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <WorkHoursHeader hasEntries={hasEntries} />
      
      {/* Work Hours Display */}
      <WorkHoursDisplay 
        startTime={startTime}
        endTime={endTime}
        totalHours={totalHours}
        calculatedHours={calculatedHours}
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
      
      {/* Warnings and Info Alerts */}
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
      
      {/* Entry Forms Section */}
      {interactive && showEntryForms.length > 0 && (
        <EntryFormsList 
          showEntryForms={showEntryForms}
          formHandlers={formHandlers}
          handleSaveEntry={handleSaveEntry}
          removeEntryForm={removeEntryForm}
          key={`entry-forms-${showEntryForms.length}-${key}`}
        />
      )}
      
      {/* Add Entry Button - moved outside of EntryFormsList for consistency */}
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

export default WorkHoursContainer;
