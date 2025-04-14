
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TimeInputField from './components/TimeInputField';
import { useWorkHours } from '@/hooks/timesheet/useWorkHours';
import { calculateHoursFromTimes } from '@/utils/time/calculations';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkHoursInterfaceProps {
  date: Date;
  userId: string;
  interactive?: boolean;
  onHoursChange?: (hours: number) => void;
}

const WorkHoursInterface: React.FC<WorkHoursInterfaceProps> = ({
  date,
  userId,
  interactive = true,
  onHoursChange
}) => {
  const { getWorkHoursForDate, saveWorkHoursForDate, resetWorkHours, hasCustomHours } = useWorkHours();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const { toast } = useToast();
  
  // Load initial hours
  useEffect(() => {
    const { startTime: loadedStart, endTime: loadedEnd, isCustom: loadedIsCustom } = 
      getWorkHoursForDate(date, userId);
    
    setStartTime(loadedStart);
    setEndTime(loadedEnd);
    setIsCustom(loadedIsCustom);
    
    // Calculate hours if both times are present
    if (loadedStart && loadedEnd) {
      const hours = calculateHoursFromTimes(loadedStart, loadedEnd);
      setCalculatedHours(hours);
      onHoursChange?.(hours);
    } else {
      setCalculatedHours(0);
      onHoursChange?.(0);
    }
  }, [date, userId, getWorkHoursForDate, onHoursChange]);

  // Handle time change
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (!interactive) return;
    
    const newStartTime = type === 'start' ? value : startTime;
    const newEndTime = type === 'end' ? value : endTime;
    
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
        console.error("Error calculating hours:", error);
      }
    } else {
      setCalculatedHours(0);
      onHoursChange?.(0);
    }
    
    // Update the custom flag
    setIsCustom(true);
  };

  // Reset to default hours
  const handleReset = () => {
    if (!interactive) return;
    
    resetWorkHours(date, userId);
    
    // Reset state
    setStartTime('');
    setEndTime('');
    setCalculatedHours(0);
    setIsCustom(false);
    onHoursChange?.(0);
    
    toast({
      title: "Hours reset",
      description: "Work hours have been reset to default schedule"
    });
  };

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
