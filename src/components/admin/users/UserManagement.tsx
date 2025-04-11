
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, UserRole } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { UserSearch } from "./UserSearch";
import { UserTable } from "./UserTable";
import { EditUserForm, UserEditFormValues } from "./EditUserForm";
import { AddUserDialog } from "./AddUserDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import OrganizationTree from "../OrganizationTree";
import { Archive } from "lucide-react";

const UserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showOrgTree, setShowOrgTree] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  // Access authentication and work schedule contexts
  const { users, updateUserRole, archiveUser, restoreUser, permanentDeleteUser, updateUserMetrics } = useAuth();
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
  
  // Handle archive user button click
  const handleArchiveUser = async (userId: string) => {
    try {
      await archiveUser(userId);
    } catch (error) {
      console.error("Error archiving user:", error);
    }
  };

  // Handle restore user button click
  const handleRestoreUser = async (userId: string) => {
    try {
      await restoreUser(userId);
    } catch (error) {
      console.error("Error restoring user:", error);
    }
  };
  
  // Handle delete user button click - opens confirmation dialog
  const handleDeleteUserConfirm = (userId: string) => {
    setConfirmDeleteUser(userId);
  };
  
  // Handle actual deletion after confirmation
  const confirmAndDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    
    try {
      await permanentDeleteUser(confirmDeleteUser);
      setConfirmDeleteUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Handle edit user submission
  const onSubmitEditUser = async (data: UserEditFormValues) => {
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
      
      // Update user metrics (FTE and fortnight hours)
      await updateUserMetrics(selectedUser.id, {
        fte: data.fte,
        fortnightHours: data.fortnightHours
      });
      
      toast({
        title: "User Updated",
        description: `${selectedUser.name}'s details have been updated.`,
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

  // Filter users based on search term and active/archived status
  const filteredActiveUsers = users.filter(user => 
    (user.status !== 'archived') &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredArchivedUsers = users.filter(user => 
    user.status === 'archived' &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <div className="flex justify-between items-center">
            <UserSearch 
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onAddUser={handleAddUser}
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Active Users</TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-1">
                <Archive className="h-4 w-4" /> Archived Users
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <UserTable 
                filteredUsers={filteredActiveUsers}
                showArchived={false}
                onEditUser={handleEditUser}
                onArchiveUser={handleArchiveUser}
                onRestoreUser={handleRestoreUser}
                onDeleteUser={handleDeleteUserConfirm}
              />
            </TabsContent>
            
            <TabsContent value="archived" className="mt-4">
              <UserTable 
                filteredUsers={filteredArchivedUsers}
                showArchived={true}
                onEditUser={handleEditUser}
                onArchiveUser={handleArchiveUser}
                onRestoreUser={handleRestoreUser}
                onDeleteUser={handleDeleteUserConfirm}
              />
            </TabsContent>
          </Tabs>
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
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!confirmDeleteUser} onOpenChange={(open) => !open && setConfirmDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagement;
