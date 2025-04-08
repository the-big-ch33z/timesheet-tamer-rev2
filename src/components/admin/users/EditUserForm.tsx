
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserRole, User } from "@/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useWorkSchedule } from "@/contexts/WorkScheduleContext";
import { Input } from "@/components/ui/input";

// Form schema for editing a user
const userEditSchema = z.object({
  role: z.enum(["admin", "manager", "team-member"] as const),
  teamIds: z.array(z.string()).optional(),
  useDefaultSchedule: z.boolean().default(true),
  scheduleId: z.string().optional(),
  fte: z.string().transform((val) => {
    const parsed = parseFloat(val);
    return !isNaN(parsed) ? parsed : 1.0;
  }),
  fortnightHours: z.string().transform((val) => {
    const parsed = parseFloat(val);
    return !isNaN(parsed) ? parsed : 76;
  }),
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
      fte: selectedUser?.fte !== undefined ? String(selectedUser.fte) : "1.0",
      fortnightHours: selectedUser?.fortnightHours !== undefined ? String(selectedUser.fortnightHours) : "76",
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
      form.setValue("fte", selectedUser.fte !== undefined ? String(selectedUser.fte) : "1.0");
      form.setValue("fortnightHours", selectedUser.fortnightHours !== undefined ? String(selectedUser.fortnightHours) : "76");
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
      
      // Submit the form values - Zod will transform the string values to numbers
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Role & Teams</h3>
              
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
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Schedule</h3>
              
              <FormField
                control={form.control}
                name="useDefaultSchedule"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Use Default Schedule</Label>
                      <p className="text-sm text-muted-foreground">
                        Use the organization's default work schedule
                      </p>
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
                <div className="space-y-4">
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
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Settings</h3>
              
              <FormField
                control={form.control}
                name="fte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FTE (Full-Time Equivalent)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="1" 
                        placeholder="1.0" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Work fraction (1.0 = full-time, 0.5 = half-time)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fortnightHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Fortnight Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        placeholder="76" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <SheetFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
