
import React, { useState, useEffect } from "react";
import { TimeEntry } from "@/types";
import { useAuth } from "@/contexts/auth";
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
  userId,
  formKey,
}) => {
  const { getVisibleFields } = useTimesheetSettings();
  const visibleFields = getVisibleFields();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  // Always use provided userId, falling back to currentUser.id
  const effectiveUserId = userId || currentUser?.id;

  useEffect(() => {
    setFormSubmitted(false);
  }, [formKey]);

  const handleSave = (entry: Omit<TimeEntry, "id">) => {
    try {
      if (formSubmitted) return;
      
      // Always include userId in the entry
      const entryWithUserId = {
        ...entry,
        userId: entry.userId || effectiveUserId,
      };
      
      onSave(entryWithUserId);
      setFormSubmitted(true);
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    try {
      if (onDelete && entryId) {
        onDelete(entryId);
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
        onDelete={entryId ? handleDelete : undefined}
        selectedDate={selectedDate}
        visibleFields={visibleFields}
        inline={true}
        entryId={entryId}
        initialData={{ ...initialData, userId: initialData.userId || effectiveUserId }}
        formKey={formKey || `form-${Date.now()}`}
        disabled={formSubmitted}
        userId={effectiveUserId}
      />
    </div>
  );
};

export default TimeEntryDialog;
