import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ReportsData } from '@/hooks/reports/useReportsData';
interface WeeklySummaryChartProps {
  data: ReportsData;
}
export const WeeklySummaryChart: React.FC<WeeklySummaryChartProps> = ({
  data
}) => {
  const {
    weeklyChartData,
    isLoading
  } = data;
  const chartConfig = {
    hours: {
      label: "Hours",
      color: "#0ea5e9"
    }
  };
  if (isLoading) {
    return <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
          <CardDescription>Hours logged per day this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse">Loading chart...</div>
          </div>
        </CardContent>
      </Card>;
  }
  if (!weeklyChartData.length) {
    return <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
          <CardDescription>Hours logged per day this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-50 flex items-center justify-center text-muted-foreground">
            No data available for this week
          </div>
        </CardContent>
      </Card>;
  }

  // Get all unique project keys for colors
  const projectKeys = Array.from(new Set(weeklyChartData.flatMap(day => Object.keys(day).filter(key => key !== 'day'))));
  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'];
  return <Card className="mb-8">
      <CardHeader>
        <CardTitle>Weekly Summary</CardTitle>
        <CardDescription>Hours logged per day this week by project</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData}>
              <XAxis dataKey="day" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {projectKeys.map((project, index) => <Bar key={project} dataKey={project} fill={colors[index % colors.length]} stackId="hours" />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>;
};