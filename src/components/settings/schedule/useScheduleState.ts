import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { WeekDay, WorkSchedule } from "@/types";
import { useWorkSchedule } from "@/contexts/work-schedule";

export const useScheduleState = () => {
  const { toast } = useToast();
  const { 
    defaultSchedule, 
    updateDefaultSchedule, 
    createSchedule, 
    updateSchedule,
    deleteSchedule,
    getAllSchedules
  } = useWorkSchedule();
  
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);
  const [showCreateScheduleDialog, setShowCreateScheduleDialog] = useState(false);
  const [schedules, setSchedules] = useState(() => getAllSchedules());
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(defaultSchedule.id);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule>({...defaultSchedule});
  
  const weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const handleScheduleChange = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setSelectedScheduleId(scheduleId);
      setEditingSchedule({...schedule});
    }
  };
  
  const handleNameChange = (name: string) => {
    setEditingSchedule({...editingSchedule, name});
  };
  
  const handleCreateSchedule = (name: string) => {
    if (!name.trim()) {
      toast({
        title: "Schedule name required",
        description: "Please enter a name for the new schedule",
        variant: "destructive",
      });
      return;
    }
    
    const newSchedule: WorkSchedule = {
      id: `schedule-${Date.now()}`,
      name,
      userId: 'default-user',
      weeks: {
        1: {
          monday: { startTime: '09:00', endTime: '17:00' },
          tuesday: { startTime: '09:00', endTime: '17:00' },
          wednesday: { startTime: '09:00', endTime: '17:00' },
          thursday: { startTime: '09:00', endTime: '17:00' },
          friday: { startTime: '09:00', endTime: '17:00' },
          saturday: null,
          sunday: null
        },
        2: {
          monday: { startTime: '09:00', endTime: '17:00' },
          tuesday: { startTime: '09:00', endTime: '17:00' },
          wednesday: { startTime: '09:00', endTime: '17:00' },
          thursday: { startTime: '09:00', endTime: '17:00' },
          friday: { startTime: '09:00', endTime: '17:00' },
          saturday: null,
          sunday: null
        }
      },
      rdoDays: {
        1: [],
        2: []
      }
    };
    
    createSchedule(newSchedule);
    setSchedules(getAllSchedules());
    setSelectedScheduleId(newSchedule.id);
    setEditingSchedule(newSchedule);
    setShowCreateScheduleDialog(false);
  };
  
  const saveSchedule = () => {
    if (editingSchedule.id === 'default') {
      updateDefaultSchedule(editingSchedule);
    } else {
      updateSchedule(editingSchedule.id, editingSchedule);
    }
    
    setSchedules(getAllSchedules());
    
    toast({
      title: "Schedule saved",
      description: `"${editingSchedule.name}" schedule has been saved successfully`,
    });
  };
  
  const handleDeleteSchedule = () => {
    if (selectedScheduleId === 'default') {
      toast({
        title: "Cannot delete default schedule",
        description: "The default schedule cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    
    deleteSchedule(selectedScheduleId);
    setSchedules(getAllSchedules());
    setSelectedScheduleId('default');
    setEditingSchedule({...defaultSchedule});
  };
  
  const updateWorkDay = (day: WeekDay, isWorkDay: boolean) => {
    const updatedSchedule = {...editingSchedule};
    updatedSchedule.weeks[activeWeek][day] = isWorkDay 
      ? { startTime: '09:00', endTime: '17:00' } 
      : null;
    setEditingSchedule(updatedSchedule);
  };

  const updateWorkHours = (day: WeekDay, field: 'startTime' | 'endTime', value: string) => {
    const updatedSchedule = {...editingSchedule};
    if (updatedSchedule.weeks[activeWeek][day]) {
      updatedSchedule.weeks[activeWeek][day] = {
        ...updatedSchedule.weeks[activeWeek][day]!,
        [field]: value
      };
      setEditingSchedule(updatedSchedule);
    }
  };

  const toggleRdoDay = (day: WeekDay) => {
    const updatedSchedule = {...editingSchedule};
    const isRdo = updatedSchedule.rdoDays[activeWeek].includes(day);
    
    updatedSchedule.rdoDays[activeWeek] = isRdo
      ? updatedSchedule.rdoDays[activeWeek].filter(d => d !== day)
      : [...updatedSchedule.rdoDays[activeWeek], day];
    
    setEditingSchedule(updatedSchedule);
  };

  return {
    activeWeek,
    setActiveWeek,
    showCreateScheduleDialog,
    setShowCreateScheduleDialog,
    schedules,
    selectedScheduleId,
    editingSchedule,
    weekDays,
    handleScheduleChange,
    handleNameChange,
    handleCreateSchedule,
    saveSchedule,
    handleDeleteSchedule,
    updateWorkDay,
    updateWorkHours,
    toggleRdoDay
  };
};
