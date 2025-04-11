
import React from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import TimeEntryForm from "./entry-dialog/TimeEntryForm";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useWorkSchedule } from "@/contexts/work-schedule";

type TimeEntryDialogProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onDelete?: (id?: string) => void;
  selectedDate: Date;
  onCancel?: () => void;
  entryId?: string;
  initialData?: Partial<TimeEntry>;
  workSchedule?: WorkSchedule;
};

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  onSave,
  onDelete,
  selectedDate,
  onCancel,
  entryId,
  initialData,
  workSchedule,
}) => {
  const { getVisibleFields } = useTimesheetSettings();
  const visibleFields = getVisibleFields();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleSave = (entry: Omit<TimeEntry, "id">) => {
    try {
      // Add user ID to the entry
      onSave({
        ...entry,
        userId: currentUser?.id,
      });
      
      // Show success notification
      toast({
        title: "Entry saved",
        description: "Time entry has been saved successfully",
        variant: "default",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      // Show error notification
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (id?: string) => {
    try {
      if (onDelete && id) {
        onDelete(id);
        // Show success notification
        toast({
          title: "Entry deleted",
          description: "Time entry has been removed",
          variant: "default"
        });
      }
    } catch (error) {
      // Show error notification
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mb-2">
      <TimeEntryForm
        onSave={handleSave}
        onCancel={onCancel}
        onDelete={handleDelete}
        selectedDate={selectedDate}
        visibleFields={visibleFields}
        inline={true}
        entryId={entryId}
        initialData={initialData}
        workSchedule={workSchedule}
      />
    </div>
  );
};

export default TimeEntryDialog;
