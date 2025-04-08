
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntryFieldConfig, WeekDay, WorkHours, WorkSchedule } from "@/types";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const SystemSettings = () => {
  const { toast } = useToast();
  
  const [entryFields, setEntryFields] = useState<EntryFieldConfig[]>([
    { id: '1', name: 'Project', type: 'select', required: true, options: ['Website Redesign', 'Mobile App', 'Client Meeting'], visible: true },
    { id: '2', name: 'Description', type: 'text', required: true, visible: true },
    { id: '3', name: 'Hours', type: 'number', required: true, visible: true },
    { id: '4', name: 'Start Time', type: 'time', required: false, visible: true },
    { id: '5', name: 'End Time', type: 'time', required: false, visible: true },
  ]);

  // Work Schedule State
  const [defaultWorkSchedule, setDefaultWorkSchedule] = useState<WorkSchedule>({
    id: 'default',
    name: 'Default Schedule',
    workDays: {
      monday: { startTime: '09:00', endTime: '17:00' },
      tuesday: { startTime: '09:00', endTime: '17:00' },
      wednesday: { startTime: '09:00', endTime: '17:00' },
      thursday: { startTime: '09:00', endTime: '17:00' },
      friday: { startTime: '09:00', endTime: '17:00' },
      saturday: null,
      sunday: null
    },
    rdoDays: [],
    isDefault: true
  });

  const weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your system settings have been updated",
    });
  };

  const addField = () => {
    const newField: EntryFieldConfig = {
      id: Date.now().toString(),
      name: `Field ${entryFields.length + 1}`,
      type: 'text',
      required: false,
      visible: true,
    };
    
    setEntryFields([...entryFields, newField]);
  };

  const removeField = (id: string) => {
    setEntryFields(entryFields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<EntryFieldConfig>) => {
    setEntryFields(entryFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const updateWorkDay = (day: WeekDay, isWorkDay: boolean) => {
    setDefaultWorkSchedule(prev => ({
      ...prev,
      workDays: {
        ...prev.workDays,
        [day]: isWorkDay ? { startTime: '09:00', endTime: '17:00' } : null
      }
    }));
  };

  const updateWorkHours = (day: WeekDay, field: 'startTime' | 'endTime', value: string) => {
    setDefaultWorkSchedule(prev => ({
      ...prev,
      workDays: {
        ...prev.workDays,
        [day]: {
          ...prev.workDays[day]!,
          [field]: value
        }
      }
    }));
  };

  const toggleRdoDay = (day: WeekDay) => {
    setDefaultWorkSchedule(prev => {
      const isRdo = prev.rdoDays.includes(day);
      return {
        ...prev,
        rdoDays: isRdo
          ? prev.rdoDays.filter(d => d !== day)
          : [...prev.rdoDays, day]
      };
    });
  };

  return (
    <Tabs defaultValue="fields">
      <TabsList className="mb-4">
        <TabsTrigger value="fields">Entry Fields</TabsTrigger>
        <TabsTrigger value="schedule">Work Schedule</TabsTrigger>
      </TabsList>

      <TabsContent value="fields">
        <Card>
          <CardHeader>
            <CardTitle>Timesheet Entry Fields</CardTitle>
            <CardDescription>
              Configure the fields shown in timesheet entry forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entryFields.map((field) => (
                <div key={field.id} className="flex items-center gap-4 pb-4 border-b">
                  <div className="cursor-move text-gray-400">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                    <div>
                      <Label htmlFor={`field-name-${field.id}`} className="mb-1 block">Field Name</Label>
                      <Input
                        id={`field-name-${field.id}`}
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`field-type-${field.id}`} className="mb-1 block">Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value as any })}
                      >
                        <SelectTrigger id={`field-type-${field.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`field-required-${field.id}`}>Required</Label>
                      <Switch
                        id={`field-required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`field-visible-${field.id}`}>Visible</Label>
                      <Switch
                        id={`field-visible-${field.id}`}
                        checked={field.visible}
                        onCheckedChange={(checked) => updateField(field.id, { visible: checked })}
                      />
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(field.id)}
                    disabled={['Project', 'Hours', 'Description'].includes(field.name)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex justify-between">
                <Button
                  onClick={addField}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Field
                </Button>
                
                <Button onClick={saveSettings}>Save Settings</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="schedule">
        <Card>
          <CardHeader>
            <CardTitle>Default Work Schedule</CardTitle>
            <CardDescription>
              Configure the default work schedule for all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input
                    value={defaultWorkSchedule.name}
                    onChange={(e) => setDefaultWorkSchedule({...defaultWorkSchedule, name: e.target.value})}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Working Days & Hours</h3>
                <div className="space-y-4">
                  {weekDays.map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-28 capitalize">{day}</div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={defaultWorkSchedule.workDays[day] !== null}
                          onCheckedChange={(checked) => updateWorkDay(day, checked)}
                        />
                        <span className="text-sm text-gray-500">
                          {defaultWorkSchedule.workDays[day] ? 'Working Day' : 'Day Off'}
                        </span>
                      </div>

                      {defaultWorkSchedule.workDays[day] && (
                        <>
                          <div className="flex items-center gap-2 ml-4">
                            <Label htmlFor={`start-${day}`} className="w-20 text-sm">Start Time</Label>
                            <Input
                              id={`start-${day}`}
                              type="time"
                              value={defaultWorkSchedule.workDays[day]?.startTime}
                              onChange={(e) => updateWorkHours(day, 'startTime', e.target.value)}
                              className="w-24"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Label htmlFor={`end-${day}`} className="w-20 text-sm">End Time</Label>
                            <Input
                              id={`end-${day}`}
                              type="time"
                              value={defaultWorkSchedule.workDays[day]?.endTime}
                              onChange={(e) => updateWorkHours(day, 'endTime', e.target.value)}
                              className="w-24"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Label htmlFor={`rdo-${day}`} className="text-sm">RDO</Label>
                            <Switch
                              id={`rdo-${day}`}
                              checked={defaultWorkSchedule.rdoDays.includes(day)}
                              onCheckedChange={() => toggleRdoDay(day)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Schedule</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SystemSettings;
