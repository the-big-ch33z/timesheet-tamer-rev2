
import { useState } from "react";

export const useDialogStates = () => {
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [showOrgTree, setShowOrgTree] = useState(false);

  // Handle add user button click
  const handleAddUser = () => {
    setIsAddUserOpen(true);
  };

  return {
    isEditUserOpen,
    isAddUserOpen,
    showOrgTree,
    setIsEditUserOpen,
    setIsAddUserOpen,
    setShowOrgTree,
    handleAddUser
  };
};
