
import React from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserHeaderProps {
  showOrgTree: boolean;
  onToggleOrgTree: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ 
  showOrgTree, 
  onToggleOrgTree 
}) => {
  return (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <div>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts and permissions</CardDescription>
      </div>
      <Button 
        variant="outline" 
        onClick={onToggleOrgTree}
      >
        {showOrgTree ? "Hide Organization Tree" : "Show Organization Tree"}
      </Button>
    </CardHeader>
  );
};
