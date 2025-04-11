
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSchedule: (name: string) => void;
}

export const CreateScheduleDialog: React.FC<CreateScheduleDialogProps> = ({
  open,
  onOpenChange,
  onCreateSchedule,
}) => {
  const [newScheduleName, setNewScheduleName] = useState('');

  const handleCreate = () => {
    if (newScheduleName.trim()) {
      onCreateSchedule(newScheduleName);
      setNewScheduleName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
