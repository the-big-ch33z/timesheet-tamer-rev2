
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TimeEntry } from "@/types";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import TimeEntryForm from "./entry-dialog/TimeEntryForm";

type TimeEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  selectedDate: Date;
};

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  selectedDate,
}) => {
  const { getVisibleFields } = useTimesheetSettings();
  const visibleFields = getVisibleFields();
  const { currentUser } = useAuth();

  const handleSave = (entry: Omit<TimeEntry, "id">) => {
    // Add user ID to the entry
    onSave({
      ...entry,
      userId: currentUser?.id, // Associate entry with current user
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
          <DialogDescription>
            Enter your time entry details for {selectedDate.toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        
        <TimeEntryForm
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
          selectedDate={selectedDate}
          visibleFields={visibleFields}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;
