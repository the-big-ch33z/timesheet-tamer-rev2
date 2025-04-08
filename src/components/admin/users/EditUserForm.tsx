
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserRole, User } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useWorkSchedule } from "@/contexts/WorkScheduleContext";

// Form schema for editing a user
const userEditSchema = z.object({
  role: z.enum(["admin", "manager", "team-member"] as const),
  teamIds: z.array(z.string()).optional(),
  useDefaultSchedule: z.boolean().default(true),
  scheduleId: z.string().optional(),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

interface EditUserFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  onSubmit: (data: UserEditFormValues) => Promise<void>;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit
}) => {
  const [activeTab, setActiveTab] = useState<string>("role");
  
  // Access work schedule context
  const { 
    getAllSchedules, 
    getUserSchedule, 
    assignScheduleToUser 
  } = useWorkSchedule();
  
  // Get all available schedules
  const schedules = getAllSchedules();
  
  // Setup form for editing a user
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      role: selectedUser?.role || "team-member",
      teamIds: selectedUser?.teamIds || [],
      useDefaultSchedule: selectedUser?.workScheduleId ? false : true,
      scheduleId: selectedUser?.workScheduleId || 'default',
    },
  });

  // Update form when selected user changes
  useEffect(() => {
    if (selectedUser) {
      form.setValue("role", selectedUser.role);
      form.setValue("teamIds", selectedUser.teamIds || []);
      
      const hasCustomSchedule = selectedUser.workScheduleId && selectedUser.workScheduleId !== 'default';
      form.setValue("useDefaultSchedule", !hasCustomSchedule);
      form.setValue("scheduleId", selectedUser.workScheduleId || 'default');
    }
  }, [selectedUser, form]);

  const handleSubmit = async (values: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      // If not using default schedule, ensure we have a schedule ID
      if (!values.useDefaultSchedule && values.scheduleId) {
        assignScheduleToUser(selectedUser.id, values.scheduleId);
      } else if (values.useDefaultSchedule) {
        // Reset to default
        assignScheduleToUser(selectedUser.id, 'default');
      }
      
      // Submit the rest of the form values
      await onSubmit(values);
    } catch (error) {
      console.error("Error updating user:", error);
    }
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
                    <FormField
                      control={form.control}
                      name="scheduleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Schedule</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select schedule" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {schedules.filter(s => !s.isDefault).map((schedule) => (
                                <SelectItem key={schedule.id} value={schedule.id}>
                                  {schedule.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">Schedule Preview</h3>
                      <div className="bg-gray-50 p-4 rounded border text-sm">
                        {form.watch("scheduleId") && schedules.find(s => s.id === form.watch("scheduleId")) ? (
                          <div>
                            <p className="font-medium">{schedules.find(s => s.id === form.watch("scheduleId"))?.name}</p>
                            <p className="text-muted-foreground mt-1">
                              This schedule has specific hours defined for each day across a two-week rotation.
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Select a schedule to see details</p>
                        )}
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
