
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleBasedUI } from "@/components/common/RoleBasedUI";
import WorkScheduleSettings from "@/components/settings/WorkScheduleSettings";
import UserScheduleManagement from "@/components/settings/user-schedules/UserScheduleManagement";

const ScheduleSettings: React.FC = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Schedule Settings</h1>
      
      <Tabs defaultValue="work-schedules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="work-schedules">Work Schedules</TabsTrigger>
          <TabsTrigger value="user-assignments">User Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="work-schedules">
          <WorkScheduleSettings />
        </TabsContent>
        
        <TabsContent value="user-assignments">
          <RoleBasedUI allowedRoles={["admin", "manager"]}>
            <UserScheduleManagement />
          </RoleBasedUI>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleSettings;
