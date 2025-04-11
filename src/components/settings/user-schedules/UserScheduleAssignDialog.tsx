
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@/types";
import { useWorkSchedule } from "@/contexts/work-schedule";

interface UserScheduleAssignDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
}

export const UserScheduleAssignDialog: React.FC<UserScheduleAssignDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
}) => {
  const { getAllSchedules, assignScheduleToUser, resetUserSchedule, userSchedules } = useWorkSchedule();
  const [assignmentType, setAssignmentType] = useState<"default" | "custom">("default");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  
  // Get all custom schedules (excluding default)
  const customSchedules = getAllSchedules().filter(schedule => !schedule.isDefault);
  
  // Reset component state when dialog opens
  useEffect(() => {
    if (isOpen && selectedUser) {
      const hasCustomSchedule = !!userSchedules[selectedUser.id];
      setAssignmentType(hasCustomSchedule ? "custom" : "default");
      
      if (hasCustomSchedule) {
        setSelectedScheduleId(userSchedules[selectedUser.id]);
      } else if (customSchedules.length > 0) {
        setSelectedScheduleId(customSchedules[0].id);
      }
    }
  }, [isOpen, selectedUser, userSchedules, customSchedules]);
  
  const handleSave = async () => {
    if (!selectedUser) return;
    
    try {
      if (assignmentType === "default") {
        // Reset user to default schedule
        await resetUserSchedule(selectedUser.id);
      } else if (assignmentType === "custom" && selectedScheduleId) {
        // Assign custom schedule
        await assignScheduleToUser(selectedUser.id, selectedScheduleId);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving schedule assignment:", error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Work Schedule</DialogTitle>
          <DialogDescription>
            {selectedUser ? `Assign a work schedule for ${selectedUser.name}` : "Assign a work schedule"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <RadioGroup 
            value={assignmentType} 
            onValueChange={(value) => setAssignmentType(value as "default" | "custom")}
            className="space-y-4"
          >
            <div className="flex items-start space-x-2 rounded-md border p-3">
              <RadioGroupItem value="default" id="default" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="default" className="font-medium">Use Default Schedule</Label>
                <p className="text-sm text-muted-foreground">
                  The user will follow the organization's default work schedule
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 rounded-md border p-3">
              <RadioGroupItem value="custom" id="custom" className="mt-1" />
              <div className="w-full space-y-3">
                <Label htmlFor="custom" className="font-medium">Assign Custom Schedule</Label>
                <p className="text-sm text-muted-foreground">
                  The user will follow a specific custom schedule
                </p>
                
                {assignmentType === "custom" && (
                  <div className="pt-2">
                    <Label htmlFor="schedule-select">Select Schedule</Label>
                    <Select
                      value={selectedScheduleId}
                      onValueChange={setSelectedScheduleId}
                      disabled={customSchedules.length === 0}
                    >
                      <SelectTrigger id="schedule-select" className="mt-1">
                        <SelectValue placeholder="Select a schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {customSchedules.map((schedule) => (
                          <SelectItem key={schedule.id} value={schedule.id}>
                            {schedule.name}
                          </SelectItem>
                        ))}
                        {customSchedules.length === 0 && (
                          <SelectItem value="none" disabled>
                            No custom schedules available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    {customSchedules.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        No custom schedules available. Create one in Work Schedule Settings.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={assignmentType === "custom" && (!selectedScheduleId || customSchedules.length === 0)}
          >
            Save Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
