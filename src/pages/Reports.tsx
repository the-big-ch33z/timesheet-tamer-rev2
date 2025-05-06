
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Sample data for the weekly charts
const data = [
  { name: "Mon", hours: 6.5 },
  { name: "Tue", hours: 8 },
  { name: "Wed", hours: 7.5 },
  { name: "Thu", hours: 9 },
  { name: "Fri", hours: 5 },
  { name: "Sat", hours: 2 },
  { name: "Sun", hours: 0 },
];

// Chart configuration
const chartConfig = {
  hours: {
    label: "Hours",
    color: "#0ea5e9", // Using the brand blue color
  }
};

const Reports = () => {
  console.debug("[Reports] Rendering Reports page");

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Reports</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">This Week</CardTitle>
            <CardDescription>Total hours logged</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">38 hours</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">This Month</CardTitle>
            <CardDescription>Total hours logged</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156 hours</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Project</CardTitle>
            <CardDescription>Most hours spent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Website Redesign</div>
            <div className="text-sm text-muted-foreground">52 hours this month</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
          <CardDescription>Hours logged per day this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer config={chartConfig}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={ChartTooltipContent} />
                <Bar dataKey="hours" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Distribution</CardTitle>
          <CardDescription>Time spent on different projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Website Redesign</span>
                <span className="text-sm font-medium">52h</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Mobile App Development</span>
                <span className="text-sm font-medium">38h</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: '31%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Client Meetings</span>
                <span className="text-sm font-medium">24h</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: '19%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Documentation</span>
                <span className="text-sm font-medium">18h</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
