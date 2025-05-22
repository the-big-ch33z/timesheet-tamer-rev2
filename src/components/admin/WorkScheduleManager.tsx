
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const WorkScheduleManager: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Schedule Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Create and manage work schedules for your organization.
        </p>
      </CardContent>
    </Card>
  );
};

export default WorkScheduleManager;
