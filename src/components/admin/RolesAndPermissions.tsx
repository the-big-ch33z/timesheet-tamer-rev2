
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RolesAndPermissions: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Manage roles and permissions for users in your organization.
        </p>
      </CardContent>
    </Card>
  );
};

export default RolesAndPermissions;
