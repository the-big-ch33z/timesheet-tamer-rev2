
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntryFieldConfig } from "@/types";
import { GripVertical, Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Holiday, initializeHolidays, saveHolidays } from "@/lib/holidays";
import { format, parse } from "date-fns";

const Admin = () => {
  const { toast } = useToast();
  
  const [entryFields, setEntryFields] = useState<EntryFieldConfig[]>([
    { id: '1', name: 'Project', type: 'select', required: true, options: ['Website Redesign', 'Mobile App', 'Client Meeting'], visible: true },
    { id: '2', name: 'Description', type: 'text', required: true, visible: true },
    { id: '3', name: 'Hours', type: 'number', required: true, visible: true },
    { id: '4', name: 'Start Time', type: 'time', required: false, visible: true },
    { id: '5', name: 'End Time', type: 'time', required: false, visible: true },
  ]);
  
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayRegion, setNewHolidayRegion] = useState("Queensland");

  useEffect(() => {
    // Initialize holidays from localStorage or defaults
    const initialHolidays = initializeHolidays();
    setHolidays(initialHolidays);
  }, []);

  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your timesheet field settings have been updated",
    });
  };

  const saveHolidaySettings = () => {
    saveHolidays(holidays);
    toast({
      title: "Holidays saved",
      description: "Your holiday settings have been updated",
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

  const addHoliday = () => {
    if (!newHolidayName || !newHolidayDate) {
      toast({
        title: "Error",
        description: "Please provide both name and date for the holiday",
        variant: "destructive",
      });
      return;
    }

    // Validate date format
    try {
      // Try to parse the date to ensure it's valid
      const parsedDate = parse(newHolidayDate, "yyyy-MM-dd", new Date());
      
      const newHoliday: Holiday = {
        id: Date.now().toString(),
        name: newHolidayName,
        date: newHolidayDate,
        region: newHolidayRegion,
      };
      
      setHolidays([...holidays, newHoliday]);
      setNewHolidayName("");
      setNewHolidayDate("");
    } catch (error) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid date in YYYY-MM-DD format",
        variant: "destructive",
      });
    }
  };

  const removeHoliday = (id: string) => {
    setHolidays(holidays.filter(holiday => holiday.id !== id));
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="holidays">Public Holidays</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p>User management content will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Manage company projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Project management content will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <CardTitle>Public Holidays</CardTitle>
              <CardDescription>
                Manage public holidays that will be displayed in the calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add new holiday form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                  <div>
                    <Label htmlFor="holiday-name">Holiday Name</Label>
                    <Input 
                      id="holiday-name" 
                      value={newHolidayName} 
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      placeholder="e.g. Christmas Day"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="holiday-date">Date (YYYY-MM-DD)</Label>
                    <Input 
                      id="holiday-date" 
                      value={newHolidayDate} 
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      placeholder="2025-12-25"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="holiday-region">Region</Label>
                    <Select value={newHolidayRegion} onValueChange={setNewHolidayRegion}>
                      <SelectTrigger id="holiday-region">
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Queensland">Queensland</SelectItem>
                        <SelectItem value="New South Wales">New South Wales</SelectItem>
                        <SelectItem value="Victoria">Victoria</SelectItem>
                        <SelectItem value="National">National (All Australia)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-3">
                    <Button onClick={addHoliday} className="w-full md:w-auto">
                      <Plus className="h-4 w-4 mr-2" /> Add Holiday
                    </Button>
                  </div>
                </div>
                
                {/* Holiday list */}
                <div className="border rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-100 font-medium">
                    <div>Name</div>
                    <div>Date</div>
                    <div>Region</div>
                    <div>Actions</div>
                  </div>
                  
                  {holidays.map((holiday) => (
                    <div key={holiday.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-t">
                      <div>{holiday.name}</div>
                      <div>{holiday.date}</div>
                      <div>{holiday.region}</div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHoliday(holiday.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {holidays.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No holidays added yet. Add some above.
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveHolidaySettings}>Save Holiday Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <div className="grid gap-6">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
