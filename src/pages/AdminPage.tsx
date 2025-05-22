
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from '@/components/layouts/AdminLayout';
import TeamManagement from '@/components/admin/teams/TeamManagement'; // Updated import path
import UserManagement from '@/components/admin/users/UserManagement'; // Updated import path
import RolesAndPermissions from '@/components/admin/RolesAndPermissions';
import WorkScheduleManager from '@/components/admin/WorkScheduleManager';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth'; // Updated import path

const AdminPage: React.FC = () => {
  const { currentUser } = useAuth();

  // Fix the isAdmin property check
  if (!currentUser || !currentUser.role || currentUser.role !== 'admin') {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="text-center">
            You do not have permission to view this page.
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Permissions</TabsTrigger>
          <TabsTrigger value="work-schedules">Work Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        <TabsContent value="teams" className="mt-6">
          <TeamManagement />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <RolesAndPermissions />
        </TabsContent>
        <TabsContent value="work-schedules" className="mt-6">
          <WorkScheduleManager />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminPage;
