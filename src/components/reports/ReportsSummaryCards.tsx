
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportsData } from '@/hooks/reports/useReportsData';

interface ReportsSummaryCardsProps {
  data: ReportsData;
}

export const ReportsSummaryCards: React.FC<ReportsSummaryCardsProps> = ({ data }) => {
  const { thisWeekHours, thisMonthHours, topJobNumber, isLoading } = data;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">This Week</CardTitle>
          <CardDescription>Total hours logged</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{thisWeekHours.toFixed(1)} hours</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">This Month</CardTitle>
          <CardDescription>Total hours logged</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{thisMonthHours.toFixed(1)} hours</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Top Job Number</CardTitle>
          <CardDescription>Most hours spent this month</CardDescription>
        </CardHeader>
        <CardContent>
          {topJobNumber ? (
            <>
              <div className="text-3xl font-bold">{topJobNumber.jobNumber}</div>
              <div className="text-sm text-muted-foreground">{topJobNumber.hours.toFixed(1)} hours this month</div>
            </>
          ) : (
            <div className="text-lg text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
