
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportsData } from '@/hooks/reports/useReportsData';

interface ProjectDistributionChartProps {
  data: ReportsData;
}

export const ProjectDistributionChart: React.FC<ProjectDistributionChartProps> = ({ data }) => {
  const { projectDistributionData, isLoading } = data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Distribution</CardTitle>
          <CardDescription>Time spent on different projects this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-4 bg-muted animate-pulse rounded w-16" />
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="bg-muted-foreground h-full rounded-full animate-pulse" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projectDistributionData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Distribution</CardTitle>
          <CardDescription>Time spent on different projects this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No project data available for this month
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Distribution</CardTitle>
        <CardDescription>Time spent on different projects this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectDistributionData.map((project, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{project.name}</span>
                <span className="text-sm font-medium">{project.hours.toFixed(1)}h</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="bg-brand-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${project.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
