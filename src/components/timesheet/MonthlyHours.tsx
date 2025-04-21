
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
    <div className="flex flex-col gap-8 w-full">
      {/* 1. Monthly Summary card comes FIRST */}
      <div className="w-full max-w-full">
        <Card className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl hover:shadow-xl transition-shadow group">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-blue-700 mb-2">
              {/* Monthly Summary title handled inside MonthSummary */}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthSummary
              userId={user.id}
              date={currentMonth}
              workSchedule={workSchedule}
            />
          </CardContent>
        </Card>
      </div>
      {/* 2. TOIL Summary card below */}
      <div className="w-full max-w-full">
        <TOILSummaryCard
          summary={toilSummary}
          loading={toilLoading}
          monthName={monthName}
        />
      </div>
    </div>
  );
};

export default MonthlyHours;
