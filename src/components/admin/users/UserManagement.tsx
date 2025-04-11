
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserManagement } from "./hooks/useUserManagement";
import { UserSearch } from "./UserSearch";
import { EditUserForm } from "./EditUserForm";
import { AddUserDialog } from "./AddUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UserHeader } from "./UserHeader";
import { UserTabs } from "./UserTabs";
import OrganizationTree from "../OrganizationTree";

const UserManagement = () => {
  const {
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
  } = useUserManagement();

  return (
    <>
      <Card className="mb-6">
        <UserHeader 
          showOrgTree={showOrgTree}
          onToggleOrgTree={() => setShowOrgTree(!showOrgTree)}
        />
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <UserSearch 
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onAddUser={handleAddUser}
            />
          </div>
          
          <UserTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            activeUsers={filteredActiveUsers}
            archivedUsers={filteredArchivedUsers}
            onEditUser={handleEditUser}
            onArchiveUser={handleArchiveUser}
            onRestoreUser={handleRestoreUser}
            onDeleteUser={handleDeleteUserConfirm}
          />
        </CardContent>
      </Card>

      {/* Organization Tree Card (conditionally rendered) */}
      {showOrgTree && <OrganizationTree />}

      {/* Edit User Form */}
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
      <DeleteUserDialog
        isOpen={!!confirmDeleteUser}
        onOpenChange={(open) => !open && setConfirmDeleteUser(null)}
        onConfirmDelete={confirmAndDeleteUser}
      />
    </>
  );
};

export default UserManagement;
