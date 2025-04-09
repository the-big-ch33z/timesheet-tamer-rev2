
import React from "react";
import { TimeEntry } from "@/types";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import TimeEntryForm from "./entry-dialog/TimeEntryForm";
import { format } from "date-fns";

type TimeEntryDialogProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onDelete?: (id?: string) => void;
  selectedDate: Date;
  onCancel?: () => void;
  entryId?: string;
  initialData?: Partial<TimeEntry>;
};

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  onSave,
  onDelete,
  selectedDate,
  onCancel,
  entryId,
  initialData,
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
    <div className="mb-2">
      <TimeEntryForm
        onSave={handleSave}
        onCancel={onCancel}
        onDelete={onDelete}
        selectedDate={selectedDate}
        visibleFields={visibleFields}
        inline={true}
        entryId={entryId}
        initialData={initialData}
      />
    </div>
  );
};

export default TimeEntryDialog;
