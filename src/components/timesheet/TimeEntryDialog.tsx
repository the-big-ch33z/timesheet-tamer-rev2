import React, { useState, useEffect } from "react";
import { TimeEntry, WorkSchedule } from "@/types";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { useTimesheetSettings } from "@/contexts/TimesheetSettingsContext";
import TimeEntryForm from "./entry-dialog/TimeEntryForm";
import { useToast } from "@/hooks/use-toast";

type TimeEntryDialogProps = {
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onDelete?: (id?: string) => void;
  selectedDate: Date;
  onCancel?: () => void;
  entryId?: string;
  initialData?: Partial<TimeEntry>;
  workSchedule?: WorkSchedule;
  userId?: string;
  formKey?: string | number;
};

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  onSave,
  onDelete,
  selectedDate,
  onCancel,
  entryId,
  initialData = {},
  workSchedule,
  userId,
  formKey,
}) => {
  const { getVisibleFields } = useTimesheetSettings();
  const visibleFields = getVisibleFields();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    setFormSubmitted(false);
  }, [formKey]);

  const handleSave = (entry: Omit<TimeEntry, "id">) => {
    try {
      if (formSubmitted) return;
      
      const entryWithUserId = {
        ...entry,
        userId: userId || currentUser?.id,
      };
      
      onSave(entryWithUserId);
      setFormSubmitted(true);
      
      toast({
        title: "Entry saved",
        description: "Time entry has been saved successfully",
        variant: "default",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
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
        toast({
          title: "Entry deleted",
          description: "Time entry has been removed",
          variant: "default"
        });
      }
    } catch (error) {
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
        formKey={formKey || `form-${Date.now()}`}
        disabled={formSubmitted}
      />
    </div>
  );
};

export default TimeEntryDialog;
