
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUserTimesheetContext } from "@/contexts/timesheet";
import { format } from "date-fns";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";

const TOILManagement: React.FC = () => {
  const { viewedUser, canViewTimesheet } = useUserTimesheetContext();
  const currentDate = new Date();
  
  const { summary, isLoading } = useTOILSummary({
    userId: viewedUser?.id || '',
    date: currentDate
  });

  if (!viewedUser || !canViewTimesheet) {
    return <div>User not available or you don't have permission to view TOIL info.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">TOIL Management</h2>
      <p className="text-gray-600 mb-6">
        Manage Time Off In Lieu (TOIL) for the current month and process end-of-month adjustments.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Month TOIL</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Month</div>
                  <div>{format(currentDate, 'MMMM yyyy')}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500">Total TOIL Accrued</div>
                  <div className="text-lg font-semibold">{summary?.accrued.toFixed(1) || 0} hours</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500">TOIL Used</div>
                  <div className="text-lg font-semibold">{summary?.used.toFixed(1) || 0} hours</div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-sm font-medium text-gray-500">TOIL Remaining</div>
                  <div className="text-lg font-semibold text-amber-600">
                    {summary?.remaining.toFixed(1) || 0} hours
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Month-End TOIL Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              At the end of each month, TOIL balance is reset. Remaining TOIL hours can be:
            </p>
            
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Carried over to the next month (with manager approval)</li>
              <li>Converted to leave</li>
              <li>Paid out at standard rates</li>
              <li>Expired (if not used by month end)</li>
            </ul>
            
            <div className="mt-6 text-center text-amber-600">
              Month-end processing will be available in the next update
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TOILManagement;
