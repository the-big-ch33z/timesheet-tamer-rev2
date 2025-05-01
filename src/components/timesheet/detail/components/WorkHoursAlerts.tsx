
import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WorkHoursAlertsProps {
  hasEntries: boolean;
  isUndertime: boolean;
  hoursVariance: number;
  interactive: boolean;
  showEntryForms?: boolean;
  date?: Date;
  isComplete?: boolean;
}

const WorkHoursAlerts: React.FC<WorkHoursAlertsProps> = ({
  hasEntries,
  isUndertime,
  hoursVariance,
  interactive,
  showEntryForms = false,
  date,
  isComplete = false
}) => {
  // Round variance to nearest quarter hour for display
  const roundedVariance = Math.round(Math.abs(hoursVariance) * 4) / 4;
  
  // Don't show warning when the hours are very close (within 0.01)
  const shouldShowUndertime = isUndertime && Math.abs(hoursVariance) > 0.01 && !isComplete;
  const shouldShowOvertime = !isUndertime && !isComplete && Math.abs(hoursVariance) > 0.01;

  return <>
      {hasEntries && isComplete && <Alert className="mt-2 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Your hours are complete for this day
          </AlertDescription>
        </Alert>}

      {hasEntries && shouldShowUndertime && <Alert variant="destructive" className="mt-2 border-red-200 text-red-800 px-[26px] my-0 mx-0 bg-orange-100">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Hours don't match daily entries (under by {roundedVariance.toFixed(2)} hrs)
          </AlertDescription>
        </Alert>}

      {hasEntries && shouldShowOvertime && <Alert variant="destructive" className="mt-2 bg-red-50 border-red-200 text-red-800 px-[26px] my-0 mx-0">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Hours exceed daily entries (over by {roundedVariance.toFixed(2)} hrs)
          </AlertDescription>
        </Alert>}
      
      {!hasEntries && interactive && <Alert className="mt-2 bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 mr-2" />
          <AlertDescription>
            No time entries for this day. Add an entry to record your hours.
          </AlertDescription>
        </Alert>}
    </>;
};

export default WorkHoursAlerts;
