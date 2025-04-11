
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface TimeWarningAlertProps {
  message: string | null;
}

const TimeWarningAlert: React.FC<TimeWarningAlertProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <Alert variant="default" className="mt-2 bg-amber-50 border-amber-200 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default TimeWarningAlert;
