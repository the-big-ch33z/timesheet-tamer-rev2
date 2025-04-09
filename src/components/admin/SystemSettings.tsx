import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  EntryFieldConfig, 
  WeekDay, 
  WorkSchedule 
} from "@/types";
import { GripVertical, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useWorkSchedule } from "@/contexts/WorkScheduleContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EntryFieldsSettings from "@/components/settings/EntryFieldsSettings";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";

const SystemSettings = () => {
  const { toast } = useToast();
  const { 
    defaultSchedule, 
    updateDefaultSchedule, 
    createSchedule, 
    updateSchedule,
    deleteSchedule,
    getAllSchedules
  } = useWorkSchedule();
  
  const { entryFields, updateEntryFields } = useTimesheetSettings();

  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);
  const [showCreateScheduleDialog, setShowCreateScheduleDialog] = useState(false);
  const [schedules, setSchedules] = useState(() => getAllSchedules());
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(defaultSchedule.id);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule>({...defaultSchedule});
  const [newScheduleName, setNewScheduleName] = useState('');

  const weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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

  const handleCreateSchedule = () => {
    if (!newScheduleName.trim()) {
      toast({
        title: "Schedule name required",
        description: "Please enter a name for the new schedule",
        variant: "destructive",
      });
      return;
    }
    
    const newSchedule: WorkSchedule = {
      id: `schedule-${Date.now()}`,
      name: newScheduleName,
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
    setNewScheduleName('');
    setShowCreateScheduleDialog(false);
  };

  const handleScheduleChange = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setSelectedScheduleId(scheduleId);
      setEditingSchedule({...schedule});
    }
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

  const handleSaveEntryFields = (fields: EntryFieldConfig[]) => {
    updateEntryFields(fields);
    toast({
      title: "Entry fields saved",
      description: "Your entry field settings have been updated",
    });
  };

  return (
    <Tabs defaultValue="fields">
      <TabsList className="mb-4">
        <TabsTrigger value="fields">Entry Fields</TabsTrigger>
        <TabsTrigger value="schedule">Work Schedules</TabsTrigger>
      </TabsList>

      <TabsContent value="fields">
        <EntryFieldsSettings 
          initialFields={entryFields}
          onSave={handleSaveEntryFields}
        />
      </TabsContent>

      <TabsContent value="schedule">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Work Schedules</CardTitle>
              <CardDescription>
                Configure work schedules for your organization
              </CardDescription>
            </div>
            <Dialog open={showCreateScheduleDialog} onOpenChange={setShowCreateScheduleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Schedule</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new work schedule
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="schedule-name">Schedule Name</Label>
                  <Input
                    id="schedule-name"
                    value={newScheduleName}
                    onChange={(e) => setNewScheduleName(e.target.value)}
                    placeholder="e.g., Night Shift, Rotating Shift"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateScheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSchedule}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Select Schedule</Label>
                  <Select
                    value={selectedScheduleId}
                    onValueChange={handleScheduleChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {schedules.map(schedule => (
                        <SelectItem key={schedule.id} value={schedule.id}>
                          {schedule.name}{schedule.isDefault ? " (Default)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input
                    value={editingSchedule.name}
                    onChange={(e) => setEditingSchedule({...editingSchedule, name: e.target.value})}
                    disabled={editingSchedule.isDefault}
                  />
                  {editingSchedule.isDefault && (
                    <p className="text-xs text-muted-foreground mt-1">
                      The default schedule name cannot be changed.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Working Days & Hours</h3>
                
                <div className="flex justify-between items-center mb-4">
                  <Tabs 
                    value={String(activeWeek)}
                    onValueChange={(value) => setActiveWeek(Number(value) as 1 | 2)}
                    className="w-[200px]"
                  >
                    <TabsList>
                      <TabsTrigger value="1">Week 1</TabsTrigger>
                      <TabsTrigger value="2">Week 2</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="space-y-4">
                  {weekDays.map((day) => (
                    <div key={`${activeWeek}-${day}`} className="flex items-center flex-wrap gap-4">
                      <div className="w-28 capitalize">{day}</div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={editingSchedule.weeks[activeWeek][day] !== null}
                          onCheckedChange={(checked) => updateWorkDay(day, checked)}
                        />
                        <span className="text-sm text-gray-500">
                          {editingSchedule.weeks[activeWeek][day] ? 'Working Day' : 'Day Off'}
                        </span>
                      </div>

                      {editingSchedule.weeks[activeWeek][day] && (
                        <>
                          <div className="flex items-center gap-2 ml-4">
                            <Label htmlFor={`start-${activeWeek}-${day}`} className="w-20 text-sm">Start Time</Label>
                            <Input
                              id={`start-${activeWeek}-${day}`}
                              type="time"
                              value={editingSchedule.weeks[activeWeek][day]?.startTime}
                              onChange={(e) => updateWorkHours(day, 'startTime', e.target.value)}
                              className="w-24"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Label htmlFor={`end-${activeWeek}-${day}`} className="w-20 text-sm">End Time</Label>
                            <Input
                              id={`end-${activeWeek}-${day}`}
                              type="time"
                              value={editingSchedule.weeks[activeWeek][day]?.endTime}
                              onChange={(e) => updateWorkHours(day, 'endTime', e.target.value)}
                              className="w-24"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Label htmlFor={`rdo-${activeWeek}-${day}`} className="text-sm">RDO</Label>
                            <Switch
                              id={`rdo-${activeWeek}-${day}`}
                              checked={editingSchedule.rdoDays[activeWeek].includes(day)}
                              onCheckedChange={() => toggleRdoDay(day)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                {!editingSchedule.isDefault && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteSchedule}
                    disabled={editingSchedule.isDefault}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Schedule
                  </Button>
                )}
                <Button onClick={saveSchedule}>
                  <Save className="h-4 w-4 mr-1" /> Save Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SystemSettings;
