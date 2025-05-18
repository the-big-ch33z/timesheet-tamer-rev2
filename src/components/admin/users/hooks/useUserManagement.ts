
import { useState, useEffect } from "react";
import { User } from "@/types";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useToast } from "@/hooks/use-toast";
import { UserEditFormValues } from "../hooks/useEditUserForm";
import { calculateFortnightHoursFromSchedule } from "@/components/timesheet/utils/scheduleUtils";

export const useUserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showOrgTree, setShowOrgTree] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0); // Add a state to force re-renders

  // Access authentication, work schedule, and metrics contexts
  const { users, updateUserRole, archiveUser, restoreUser, permanentDeleteUser } = useAuth();
  const { assignScheduleToUser, getScheduleById, defaultSchedule, verifyUserScheduleConsistency } = useWorkSchedule();
  const { updateUserMetrics } = useUserMetrics();

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
    console.log("Editing user with current data:", user);
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

  // Check for data consistency on component mount
  useEffect(() => {
    const result = verifyUserScheduleConsistency();
    if (!result.consistent) {
      console.warn("User schedule inconsistencies detected:", result.issues);
      
      if (process.env.NODE_ENV === 'development') {
        // Only show this in development
        toast({
          title: "Schedule inconsistencies detected",
          description: `${result.issues.length} issues found. See console for details.`,
          variant: "destructive"
        });
      }
    }
  }, []);

  // Handle edit user submission
  const onSubmitEditUser = async (data: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      console.log("Updating user with data:", data);
      
      // Calculate the actual fortnight hours based on FTE and schedule
      let baseHours = 0;
      let scheduleId = data.scheduleId || 'default';
      
      if (data.useDefaultSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
        scheduleId = 'default'; // Ensure we use default ID
      } else if (data.scheduleId) {
        const selectedSchedule = getScheduleById(data.scheduleId);
        if (selectedSchedule) {
          baseHours = calculateFortnightHoursFromSchedule(selectedSchedule);
        }
      }
      
      // Apply FTE to calculate the proportional hours
      let actualFortnightHours = data.fortnightHours; // Default to the form value
      
      if (baseHours > 0) {
        const adjustedHours = baseHours * data.fte;
        // Round to nearest 0.5
        actualFortnightHours = Math.round(adjustedHours * 2) / 2;
        console.log(`Final fortnight hours calculation: base=${baseHours}, FTE=${data.fte}, adjusted=${actualFortnightHours}`);
      }
      
      // First update user role
      await updateUserRole(selectedUser.id, data.role);
      
      // Then update user metrics WITHOUT the workScheduleId
      await updateUserMetrics(selectedUser.id, {
        fte: data.fte,
        fortnightHours: actualFortnightHours
        // Removed workScheduleId from here
      });
      
      // Finally, use assignScheduleToUser to properly set the schedule
      // This ensures all the proper events are triggered and localStorage is updated
      await assignScheduleToUser(selectedUser.id, scheduleId);
      
      // Force refresh to update UI
      setForceRefresh(prev => prev + 1);
      
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
