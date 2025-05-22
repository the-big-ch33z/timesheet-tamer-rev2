
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/users/UserManagement"; // Updated import path
import TeamManagement from "@/components/admin/teams/TeamManagement"; // Updated import path
import ProjectManagement from "@/components/admin/ProjectManagement";
import HolidayManagement from "@/components/admin/HolidayManagement";
import SystemSettings from "@/components/admin/SystemSettings";
import AccountSettings from "@/components/admin/AccountSettings";
import AuditLogs from "@/components/admin/AuditLogs";
import DataSync from "@/components/admin/DataSync";
import { useRolePermission } from "@/hooks/useRolePermission";
import { Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Admin = () => {
  // Use our role permission hook to check if user is admin
  const { isAdmin } = useRolePermission();
  
  // If not admin, show access denied
  if (!isAdmin()) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the admin dashboard
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="holidays">Public Holidays</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="teams">
          <TeamManagement />
        </TabsContent>
        
        <TabsContent value="projects">
          <ProjectManagement />
        </TabsContent>
        
        <TabsContent value="holidays">
          <HolidayManagement />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
        
        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>
        
        <TabsContent value="sync">
          <DataSync />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
