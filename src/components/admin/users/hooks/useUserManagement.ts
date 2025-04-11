
import { useState } from "react";
import { User } from "@/types";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useToast } from "@/hooks/use-toast";
import { UserEditFormValues } from "../EditUserForm";

export const useUserManagement = () => {
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
  const { assignScheduleToUser, resetUserSchedule } = useWorkSchedule();

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
      console.log("Updating user with data:", data);
      
      // Update user's role
      await updateUserRole(selectedUser.id, data.role);
      
      // Handle work schedule assignment
      if (data.useDefaultSchedule) {
        console.log("Resetting user schedule to default");
        // Reset to default schedule
        await resetUserSchedule(selectedUser.id);
      } else if (data.scheduleId) {
        console.log(`Assigning schedule ${data.scheduleId} to user ${selectedUser.id}`);
        // Assign specific schedule
        await assignScheduleToUser(selectedUser.id, data.scheduleId);
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
      console.error("Error updating user:", error);
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

  return {
    searchTerm,
    activeTab,
    isEditUserOpen,
    isAddUserOpen,
    selectedUser,
    showOrgTree,
    confirmDeleteUser,
    filteredActiveUsers,
    filteredArchivedUsers,
    setActiveTab,
    setIsEditUserOpen,
    setIsAddUserOpen,
    setShowOrgTree,
    setConfirmDeleteUser,
    handleSearchChange,
    handleAddUser,
    handleEditUser,
    handleArchiveUser,
    handleRestoreUser,
    handleDeleteUserConfirm,
    confirmAndDeleteUser,
    onSubmitEditUser
  };
};
