
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "./UserTable";
import { User } from "@/types";
import { Archive } from "lucide-react";

interface UserTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  activeUsers: User[];
  archivedUsers: User[];
  onEditUser: (user: User) => void;
  onArchiveUser: (userId: string) => void;
  onRestoreUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserTabs: React.FC<UserTabsProps> = ({
  activeTab,
  onTabChange,
  activeUsers,
  archivedUsers,
  onEditUser,
  onArchiveUser,
  onRestoreUser,
  onDeleteUser
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="active">Active Users</TabsTrigger>
        <TabsTrigger value="archived" className="flex items-center gap-1">
          <Archive className="h-4 w-4" /> Archived Users
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="active" className="mt-4">
        <UserTable 
          filteredUsers={activeUsers}
          showArchived={false}
          onEditUser={onEditUser}
          onArchiveUser={onArchiveUser}
          onRestoreUser={onRestoreUser}
          onDeleteUser={onDeleteUser}
        />
      </TabsContent>
      
      <TabsContent value="archived" className="mt-4">
        <UserTable 
          filteredUsers={archivedUsers}
          showArchived={true}
          onEditUser={onEditUser}
          onArchiveUser={onArchiveUser}
          onRestoreUser={onRestoreUser}
          onDeleteUser={onDeleteUser}
        />
      </TabsContent>
    </Tabs>
  );
};
