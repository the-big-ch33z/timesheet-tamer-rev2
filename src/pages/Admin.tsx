
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from "@/components/admin/UserManagement";
import TeamManagement from "@/components/admin/TeamManagement";
import ProjectManagement from "@/components/admin/ProjectManagement";
import HolidayManagement from "@/components/admin/HolidayManagement";
import SystemSettings from "@/components/admin/SystemSettings";
import AccountSettings from "@/components/admin/AccountSettings";

const Admin = () => {
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
      </Tabs>
    </div>
  );
};

export default Admin;
