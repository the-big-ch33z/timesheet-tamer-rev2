
import React, { useState, useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { 
  calculateHoursFromTimes, 
  calculateHoursVariance,
  isUndertime 
} from "../utils/timeCalculations";
import { getFortnightWeek, getWeekDay } from "../utils/scheduleUtils";
import WorkHoursDisplay from "./components/WorkHoursDisplay";
import WorkHoursAlerts from "./components/WorkHoursAlerts";
import EntryFormsList from "./components/EntryFormsList";
import WorkHoursHeader from "./components/WorkHoursHeader";
import EntryList from "./components/EntryList";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import { useTimeEntryForm } from "@/hooks/timesheet/useTimeEntryForm";

interface WorkHoursSectionProps {
  entries: TimeEntry[];
  date: Date;
  workSchedule?: WorkSchedule;
  interactive?: boolean;
  onCreateEntry?: (startTime: string, endTime: string, hours: number) => void;
}

const WorkHoursSection: React.FC<WorkHoursSectionProps> = ({ 
  entries, 
  date, 
  workSchedule,
  interactive = false,
  onCreateEntry
}) => {
  // State for times
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [calculatedHours, setCalculatedHours] = useState(8.0);
  const [showEntryForms, setShowEntryForms] = useState<boolean[]>([]);
  
  // Create form handlers for ALL possible entry forms upfront
  // This is important to avoid conditional hook creation
  const formHandlers = Array(10).fill(null).map((_, i) => useTimeEntryForm({
    selectedDate: date,
    onSave: (entry) => {
      if (onCreateEntry) {
        onCreateEntry(startTime, endTime, calculatedHours);
        removeEntryForm(i);
      }
    },
    autoSave: false
  }));
  
  // Get visible fields from timesheet settings
  const { getVisibleFields } = useTimesheetSettings();
  const visibleFields = getVisibleFields();
  
  // Calculate total hours from entries
  const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  
  // Initialize times from entries or schedule
  useEffect(() => {
    let initialStartTime = "09:00";
    let initialEndTime = "17:00";
    
    // If we have entries, use the first entry's times
    if (entries.length > 0) {
      initialStartTime = entries[0].startTime || initialStartTime;
      initialEndTime = entries[0].endTime || initialEndTime;
    } 
    // Otherwise, try to get times from workSchedule if available
    else if (workSchedule) {
      const weekDay = getWeekDay(date);
      const weekNum = getFortnightWeek(date);
      
      const scheduleDay = workSchedule.weeks[weekNum][weekDay];
      
      if (scheduleDay) {
        initialStartTime = scheduleDay.startTime || initialStartTime;
        initialEndTime = scheduleDay.endTime || initialEndTime;
      }
    }
    
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
    
    // Calculate hours from times
    const hours = calculateHoursFromTimes(initialStartTime, initialEndTime);
    setCalculatedHours(hours);
  }, [entries, date, workSchedule]);
  
  // Recalculate hours when times change
  useEffect(() => {
    const hours = calculateHoursFromTimes(startTime, endTime);
    setCalculatedHours(hours);
  }, [startTime, endTime]);
  
  // Calculate variance from expected hours
  const hoursVariance = calculateHoursVariance(totalHours, calculatedHours);
  const hasEntries = entries.length > 0;
  
  // Handle time input changes
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartTime(value);
    } else {
      setEndTime(value);
    }
  };
  
  // Add a new entry form
  const addEntryForm = () => {
    // Limit to maximum of 10 forms
    if (showEntryForms.length < 10) {
      setShowEntryForms(prev => [...prev, true]);
    }
  };
  
  // Remove an entry form at specific index
  const removeEntryForm = (index: number) => {
    setShowEntryForms(prev => prev.filter((_, i) => i !== index));
  };
  
  // Force re-render when entries change
  useEffect(() => {
    console.log("Entries updated in WorkHoursSection:", entries.length);
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
        showEntryForms={showEntryForms}
      />
      
      {/* Entry List with Delete functionality */}
      {hasEntries && <EntryList entries={entries} key={`entries-list-${entries.length}-${Date.now()}`} />}
      
      {/* Entry Forms Section */}
      {interactive && (
        <EntryFormsList 
          showEntryForms={showEntryForms}
          formHandlers={formHandlers}
          addEntryForm={addEntryForm}
          removeEntryForm={removeEntryForm}
        />
      )}
    </div>
  );
};

export default WorkHoursSection;
