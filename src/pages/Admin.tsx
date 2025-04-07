
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const Admin = () => {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Admin Panel</h1>
      
      <Alert className="mb-6 border-brand-600/50 bg-brand-50">
        <ShieldAlert className="h-5 w-5 text-brand-600" />
        <AlertTitle>Admin access only</AlertTitle>
        <AlertDescription>
          This section contains administrative controls for the TimeFlow application. 
          Full implementation is coming in a future update.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create, edit, and delete user accounts. Configure role-based access control
              for all users in the system.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Division Management</CardTitle>
            <CardDescription>
              Configure organizational divisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create and manage divisions and departments. Assign managers and team members
              to appropriate divisions.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
            <CardDescription>
              Manage projects and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create, edit and archive projects. Configure project settings and manage
              team assignments.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure global application settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Adjust system-wide settings including security policies, default values,
              and integration configurations.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Review system activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              View detailed logs of all system activities, including user actions,
              authentication events, and system changes.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Backup and restore system data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configure automated backups, perform manual backups, and restore data
              from previous backups if needed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
