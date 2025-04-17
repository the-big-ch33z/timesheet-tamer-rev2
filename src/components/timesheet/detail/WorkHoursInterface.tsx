
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TimeInputField from './components/TimeInputField';
import { useTimesheetWorkHours } from '@/hooks/timesheet/useTimesheetWorkHours';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createTimeLogger } from '@/utils/time/errors';
import { calculateHoursFromTimes } from '@/utils/time/calculations';
import { TimeEntry } from '@/types';
import { timeEventsService } from '@/utils/time/events/timeEventsService';

const logger = createTimeLogger('WorkHoursInterface');

interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  interactive?: boolean;
  onHoursChange?: (hours: number) => void;
  entries?: TimeEntry[];
  workSchedule?: any;
}

const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  interactive = true,
  onHoursChange,
  entries = []
}) => {
  const { 
    getWorkHoursForDate, 
    saveWorkHoursForDate, 
    resetWorkHours, 
    hasCustomHours,
    refreshWorkHours
  } = useTimesheetWorkHours(userId);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const { toast } = useToast();
  
  // Load initial hours
  useEffect(() => {
    if (!date || !userId) return;
    
    logger.debug(`Loading work hours for date: ${date.toDateString()}, userId: ${userId}`);
    const { startTime: loadedStart, endTime: loadedEnd, isCustom: loadedIsCustom, calculatedHours } = 
      getWorkHoursForDate(date, userId);
    
    setStartTime(loadedStart);
    setEndTime(loadedEnd);
    setIsCustom(loadedIsCustom);
    setCalculatedHours(calculatedHours);
    
    if (calculatedHours > 0) {
      onHoursChange?.(calculatedHours);
    }
    
  }, [date, userId, getWorkHoursForDate, onHoursChange]);

  // Subscribe to time entry events to detect changes
  useEffect(() => {
    const handleEntryEvent = () => {
      logger.debug('Time entry event detected, refreshing work hours');
      refreshWorkHours();
      
      // Re-fetch hours data after refresh
      const { startTime: updatedStart, endTime: updatedEnd, calculatedHours } = 
        getWorkHoursForDate(date, userId);
      
      setStartTime(updatedStart);
      setEndTime(updatedEnd);
      setCalculatedHours(calculatedHours);
      onHoursChange?.(calculatedHours);
    };
    
    // Subscribe to relevant events
    const unsubCreate = timeEventsService.subscribe('entry-created', handleEntryEvent);
    const unsubUpdate = timeEventsService.subscribe('entry-updated', handleEntryEvent);
    const unsubDelete = timeEventsService.subscribe('entry-deleted', handleEntryEvent);
    
    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
    };
  }, [date, userId, getWorkHoursForDate, onHoursChange, refreshWorkHours]);

  // Handle time change with smart change detection
  const handleTimeChange = useCallback((type: 'start' | 'end', value: string) => {
    if (!interactive || !date || !userId) return;
    
    const newStartTime = type === 'start' ? value : startTime;
    const newEndTime = type === 'end' ? value : endTime;
    
    // Only update if values actually changed
    if (type === 'start' && newStartTime === startTime) return;
    if (type === 'end' && newEndTime === endTime) return;
    
    logger.debug(`Time change: ${type} = ${value}`);
    
    // Update state
    if (type === 'start') setStartTime(value);
    else setEndTime(value);
    
    // Save to context
    const success = saveWorkHoursForDate(date, newStartTime, newEndTime, userId);
    
    if (!success) {
      toast({
        title: "Error saving time",
        description: "Could not save the work hours",
        variant: "destructive"
      });
      return;
    }
    
    // Recalculate hours if both times are present
    if (newStartTime && newEndTime) {
      try {
        const hours = calculateHoursFromTimes(newStartTime, newEndTime);
        setCalculatedHours(hours);
        onHoursChange?.(hours);
      } catch (error) {
        logger.error("Failed to calculate hours:", error);
      }
    } else {
      setCalculatedHours(0);
      onHoursChange?.(0);
    }
    
    // Update the custom flag
    setIsCustom(true);
  }, [startTime, endTime, interactive, date, userId, saveWorkHoursForDate, toast, onHoursChange]);

  // Reset to default hours
  const handleReset = () => {
    if (!interactive || !date || !userId) return;
    
    resetWorkHours(date, userId);
    refreshWorkHours();
    
    // Re-fetch hours data after reset
    const { startTime: updatedStart, endTime: updatedEnd, calculatedHours } = 
      getWorkHoursForDate(date, userId);
    
    setStartTime(updatedStart);
    setEndTime(updatedEnd);
    setCalculatedHours(calculatedHours);
    setIsCustom(false);
    onHoursChange?.(calculatedHours);
    
    toast({
      title: "Hours reset",
      description: "Work hours have been reset to default schedule"
    });
  };

  // Check for custom hours changes
  useEffect(() => {
    if (date && userId) {
      const isCustomHours = hasCustomHours(date, userId);
      setIsCustom(isCustomHours);
    }
  }, [date, userId, hasCustomHours]);

  return (
    <Card className={isCustom ? "border-blue-300" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center justify-between">
          <span>Work Hours {isCustom && "(Custom)"}</span>
          {isCustom && interactive && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="h-8 px-2"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <TimeInputField
              label="Start Time"
              value={startTime}
              onChange={(value) => handleTimeChange('start', value)}
              interactive={interactive}
            />
          </div>
          <div>
            <TimeInputField
              label="End Time"
              value={endTime}
              onChange={(value) => handleTimeChange('end', value)}
              interactive={interactive}
            />
          </div>
        </div>
        {(startTime && endTime) && (
          <div className="mt-3 text-sm font-medium text-right">
            Hours: {calculatedHours.toFixed(1)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkHoursInterface;
