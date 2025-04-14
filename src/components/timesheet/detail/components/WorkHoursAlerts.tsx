
import React from "react";
import { AlertTriangle, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WorkHoursAlertsProps {
  hasEntries: boolean;
  isUndertime: boolean;
  hoursVariance: number;
  interactive: boolean;
  showEntryForms?: boolean;
  date?: Date; // Make date optional
}

const WorkHoursAlerts: React.FC<WorkHoursAlertsProps> = ({
  hasEntries,
  isUndertime,
  hoursVariance,
  interactive,
  showEntryForms = false,
  date // Accept date prop
}) => {
  return (
    <>
      {hasEntries && isUndertime && (
        <Alert variant="destructive" className="mt-3 bg-red-50 border-red-200 text-red-800">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Hours don't match daily entries (under by {Math.abs(hoursVariance).toFixed(1)} hrs)
          </AlertDescription>
        </Alert>
      )}
      
      {!hasEntries && !showEntryForms && (
        <Alert className="mt-3 bg-blue-50 border-blue-200 text-blue-800">
          <Calendar className="h-4 w-4 mr-2" />
          <AlertDescription>
            {interactive ? "Set your work hours above to track your time." : "No time entries recorded yet. Add an entry to track your hours."}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default WorkHoursAlerts;
