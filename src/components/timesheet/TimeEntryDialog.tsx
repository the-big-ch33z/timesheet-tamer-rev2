
import React from "react";
import { TimeEntry } from "@/types";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import TimeEntryForm from "./entry-dialog/TimeEntryForm";

type TimeEntryDialogProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  selectedDate: Date;
  onCancel?: () => void;
};

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  onSave,
  selectedDate,
  onCancel,
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
    <div className="border p-4 rounded-lg bg-yellow-50 mb-4">
      <TimeEntryForm
        onSave={handleSave}
        onCancel={onCancel}
        selectedDate={selectedDate}
        visibleFields={visibleFields}
        inline={true}
      />
    </div>
  );
};

export default TimeEntryDialog;
