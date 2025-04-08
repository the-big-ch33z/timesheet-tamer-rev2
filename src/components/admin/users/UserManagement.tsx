
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, UserRole } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/WorkScheduleContext";
import { UserSearch } from "./UserSearch";
import { UserTable } from "./UserTable";
import { EditUserForm } from "./EditUserForm";
import { AddUserDialog } from "./AddUserDialog";
import OrganizationTree from "../OrganizationTree";

const UserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showOrgTree, setShowOrgTree] = useState(false);

  // Access authentication and work schedule contexts
  const { users, updateUserRole } = useAuth();
  const { assignScheduleToUser } = useWorkSchedule();

  // Handle search term changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // Handle add user button click
  const handleAddUser = () => {
    setIsAddUserOpen(true);
  };
  
  // Handle edit user button click
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };
  
  // Handle delete user button click
  const handleDeleteUser = (userId: string) => {
    toast({
      title: "Delete User",
      description: `Deleting user with ID: ${userId}`
    });
  };

  // Handle edit user submission
  const onSubmitEditUser = async (data: { 
    role: UserRole;
    teamIds?: string[];
    useDefaultSchedule?: boolean;
    scheduleId?: string;
    fte?: number;
    fortnightHours?: number;
  }) => {
    if (!selectedUser) return;
    
    try {
      // Update user's role
      await updateUserRole(selectedUser.id, data.role);
      
      // Handle work schedule assignment
      if (data.useDefaultSchedule) {
        // Reset to default schedule
        assignScheduleToUser(selectedUser.id, 'default');
      } else if (data.scheduleId) {
        // Assign to custom schedule
        assignScheduleToUser(selectedUser.id, data.scheduleId);
      }
      
      // In a real app, we would update the user's FTE and fortnight hours here
      // This would be handled by a backend API call
      console.log("Updating user with FTE:", data.fte, "and fortnight hours:", data.fortnightHours);
      
      toast({
        title: "User Updated",
        description: `${selectedUser.name}'s settings have been updated.`,
      });
      
      setIsEditUserOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Error Updating User",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowOrgTree(!showOrgTree)}
          >
            {showOrgTree ? "Hide Organization Tree" : "Show Organization Tree"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <UserSearch 
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onAddUser={handleAddUser}
          />
          
          <UserTable 
            filteredUsers={filteredUsers}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </CardContent>
      </Card>

      {/* Organization Tree Card (conditionally rendered) */}
      {showOrgTree && <OrganizationTree />}

      {/* Edit User Sheet */}
      <EditUserForm 
        isOpen={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        selectedUser={selectedUser}
        onSubmit={onSubmitEditUser}
      />

      {/* Add User Dialog */}
      <AddUserDialog 
        isOpen={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
      />
    </>
  );
};

export default UserManagement;

