
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, WorkSchedule } from "@/types";
import MonthSummary from "./MonthSummary";
import TOILSummaryCard from "./detail/components/TOILSummaryCard";
import { useTOILSummary } from "@/hooks/timesheet/useTOILSummary";
import { format } from "date-fns";

interface MonthlyHoursProps {
  user: User;
  currentMonth: Date;
  workSchedule?: WorkSchedule;
}

const MonthlyHours: React.FC<MonthlyHoursProps> = ({
  user,
  currentMonth,
  workSchedule
}) => {
  // Get TOIL summary for the current month
  const { summary: toilSummary, isLoading: toilLoading } = useTOILSummary({
    userId: user.id,
    date: currentMonth
  });
  
  const monthName = format(currentMonth, 'MMMM yyyy');

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Month Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthSummary
            userId={user.id}
            date={currentMonth}
            workSchedule={workSchedule}
          />
        </CardContent>
      </Card>

      {/* Add TOIL Summary Card */}
      <div className="mt-4">
        <TOILSummaryCard
          summary={toilSummary}
          loading={toilLoading}
          monthName={monthName}
        />
      </div>
    </>
  );
};

export default MonthlyHours;
