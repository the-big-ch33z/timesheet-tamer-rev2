import React from "react";
import { AlertTriangle, Calendar, CheckCircle, Info } from "lucide-react";
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
  return <>
      {hasEntries && isComplete && <Alert className="mt-3 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Your hours are complete for this day
          </AlertDescription>
        </Alert>}
    
      {hasEntries && isUndertime && !isComplete && <Alert variant="destructive" className="mt-3 bg-red-50 border-red-200 text-red-800 px-[26px] my-0 mx-0">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Hours don't match daily entries (under by {Math.abs(hoursVariance).toFixed(1)} hrs)
          </AlertDescription>
        </Alert>}
      
      {!hasEntries && interactive && <Alert className="mt-3 bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 mr-2" />
          <AlertDescription>
            No time entries for this day. Add an entry to record your hours.
          </AlertDescription>
        </Alert>}
    </>;
};
export default WorkHoursAlerts;