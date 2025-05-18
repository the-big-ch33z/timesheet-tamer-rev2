
import { useState } from "react";
import { User } from "@/types";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";

export const useUserActions = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Access authentication context
  const { archiveUser, restoreUser, permanentDeleteUser } = useAuth();

  // Handle edit user button click
  const handleEditUser = (user: User) => {
    console.log("Editing user with current data:", user);
    setSelectedUser(user);
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

  return {
    selectedUser,
    confirmDeleteUser,
    forceRefresh,
    setSelectedUser,
    setConfirmDeleteUser,
    setForceRefresh,
    handleEditUser,
    handleArchiveUser,
    handleRestoreUser,
    handleDeleteUserConfirm,
    confirmAndDeleteUser
  };
};
