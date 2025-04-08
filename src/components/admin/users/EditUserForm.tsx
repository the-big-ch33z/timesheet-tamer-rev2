
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserRole, User, WeekDay, WorkSchedule } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Default work schedule
const defaultWorkSchedule: WorkSchedule = {
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
};

// Form schema for editing a user
const userEditSchema = z.object({
  role: z.enum(["admin", "manager", "team-member"] as const),
  teamIds: z.array(z.string()).optional(),
  useDefaultSchedule: z.boolean().default(true),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

interface EditUserFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  onSubmit: (data: UserEditFormValues & { workSchedule?: WorkSchedule }) => Promise<void>;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit
}) => {
  const weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const [activeTab, setActiveTab] = useState<string>("role");
  const [userWorkSchedule, setUserWorkSchedule] = useState<WorkSchedule>({
    ...defaultWorkSchedule,
    id: `schedule-${Date.now()}`,
    isDefault: false,
  });
  
  // Setup form for editing a user
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      role: selectedUser?.role || "team-member",
      teamIds: selectedUser?.teamIds || [],
      useDefaultSchedule: selectedUser?.useDefaultSchedule !== false,
    },
  });

  // Update form when selected user changes
  React.useEffect(() => {
    if (selectedUser) {
      form.setValue("role", selectedUser.role);
      form.setValue("teamIds", selectedUser.teamIds || []);
      form.setValue("useDefaultSchedule", selectedUser.useDefaultSchedule !== false);
      
      // In a real app, you would fetch the user's work schedule if they have one
      // For now, we'll just use the default
      setUserWorkSchedule({
        ...defaultWorkSchedule,
        id: selectedUser.workScheduleId || `schedule-${Date.now()}`,
        isDefault: false,
      });
    }
  }, [selectedUser, form]);

  const handleSubmit = async (values: UserEditFormValues) => {
    // If not using default schedule, include the custom one
    if (!values.useDefaultSchedule) {
      await onSubmit({ ...values, workSchedule: userWorkSchedule });
    } else {
      await onSubmit(values);
    }
  };

  const updateWorkDay = (day: WeekDay, isWorkDay: boolean) => {
    setUserWorkSchedule(prev => ({
      ...prev,
      workDays: {
        ...prev.workDays,
        [day]: isWorkDay ? { startTime: '09:00', endTime: '17:00' } : null
      }
    }));
  };

  const updateWorkHours = (day: WeekDay, field: 'startTime' | 'endTime', value: string) => {
    setUserWorkSchedule(prev => ({
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
    setUserWorkSchedule(prev => {
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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>
            {selectedUser ? `Update details for ${selectedUser.name}` : "Update user details"}
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="role" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="role">Role & Teams</TabsTrigger>
            <TabsTrigger value="schedule">Work Schedule</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <TabsContent value="role" className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="team-member">Team Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Teams selection would go here in a more complex implementation */}
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab("schedule")}
                  >
                    Next: Work Schedule
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-6">
                <FormField
                  control={form.control}
                  name="useDefaultSchedule"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use Default Schedule</FormLabel>
                        <FormDescription>
                          Use the organization's default work schedule
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {!form.watch("useDefaultSchedule") && (
                  <div className="space-y-6 pt-2">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Schedule Name</Label>
                        <Input
                          value={userWorkSchedule.name}
                          onChange={(e) => setUserWorkSchedule({...userWorkSchedule, name: e.target.value})}
                          placeholder="Custom Schedule"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Working Days & Hours</h3>
                      <div className="space-y-4">
                        {weekDays.map((day) => (
                          <div key={day} className="flex flex-wrap items-center gap-4">
                            <div className="w-28 capitalize">{day}</div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={userWorkSchedule.workDays[day] !== null}
                                onCheckedChange={(checked) => updateWorkDay(day, checked)}
                              />
                              <span className="text-sm text-gray-500">
                                {userWorkSchedule.workDays[day] ? 'Working Day' : 'Day Off'}
                              </span>
                            </div>

                            {userWorkSchedule.workDays[day] && (
                              <>
                                <div className="flex items-center gap-2 ml-4">
                                  <Label htmlFor={`start-${day}`} className="w-20 text-sm">Start Time</Label>
                                  <Input
                                    id={`start-${day}`}
                                    type="time"
                                    value={userWorkSchedule.workDays[day]?.startTime}
                                    onChange={(e) => updateWorkHours(day, 'startTime', e.target.value)}
                                    className="w-24"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`end-${day}`} className="w-20 text-sm">End Time</Label>
                                  <Input
                                    id={`end-${day}`}
                                    type="time"
                                    value={userWorkSchedule.workDays[day]?.endTime}
                                    onChange={(e) => updateWorkHours(day, 'endTime', e.target.value)}
                                    className="w-24"
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  <Label htmlFor={`rdo-${day}`} className="text-sm">RDO</Label>
                                  <Switch
                                    id={`rdo-${day}`}
                                    checked={userWorkSchedule.rdoDays.includes(day)}
                                    onCheckedChange={() => toggleRdoDay(day)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <SheetFooter className="pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("role")}
                  >
                    Back
                  </Button>
                  <Button type="submit">Update User</Button>
                </SheetFooter>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

function FormDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  const { className, ...rest } = props;
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...rest} />
  );
}
