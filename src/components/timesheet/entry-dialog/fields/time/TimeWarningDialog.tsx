
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimeWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warningMessage: string | null;
  onOverride: () => void;
  onCancel: () => void;
}

const TimeWarningDialog: React.FC<TimeWarningDialogProps> = ({
  open,
  onOpenChange,
  warningMessage,
  onOverride,
  onCancel
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Time Outside Working Hours</AlertDialogTitle>
          <AlertDialogDescription>
            {warningMessage}
            <p className="mt-2">Do you want to override this warning and continue?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onOverride}>Yes, Override</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TimeWarningDialog;
