
import { useAuth } from "@/contexts/auth";
import { useUserFilter } from "./useUserFilter";
import { useUserActions } from "./useUserActions";
import { useDialogStates } from "./useDialogStates";
import { useEditUserSubmission } from "./useEditUserSubmission";
import { useScheduleConsistency } from "./useScheduleConsistency";
import { UserEditFormValues } from "./useEditUserForm";
import { useEffect } from "react";

export const useUserManagement = () => {
  // Access authentication context for users
  const { users } = useAuth();

  // Import smaller hooks
  const { 
    searchTerm, 
    activeTab, 
    setActiveTab, 
    handleSearchChange, 
    filteredActiveUsers, 
    filteredArchivedUsers 
  } = useUserFilter(users);

  const { 
    isEditUserOpen, 
    isAddUserOpen, 
    showOrgTree, 
    setIsEditUserOpen, 
    setIsAddUserOpen, 
    setShowOrgTree, 
    handleAddUser 
  } = useDialogStates();

  const { 
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
  } = useUserActions(setIsEditUserOpen); // Pass setIsEditUserOpen here

  // Handle successful user edit
  const handleEditSuccess = () => {
    setForceRefresh(prev => prev + 1);
    setIsEditUserOpen(false);
    setSelectedUser(null);
  };

  // User edit submission handler
  const { onSubmitEditUser } = useEditUserSubmission(selectedUser, handleEditSuccess);

  // Schedule consistency check
  useScheduleConsistency();

  // Force re-fetch data when needed
  useEffect(() => {
    // This effect will run whenever forceRefresh changes
    // It's empty because we just need to trigger a re-render
  }, [forceRefresh]);

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
