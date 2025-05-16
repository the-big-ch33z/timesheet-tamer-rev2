
import { useState, useEffect } from "react";
import { User } from "@/types";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useToast } from "@/hooks/use-toast";
import { UserEditFormValues } from "../hooks/useEditUserForm";
import { calculateFortnightHoursFromSchedule } from "@/components/timesheet/utils/scheduleUtils";
import { createTimeLogger } from "@/utils/time/errors";
import { eventBus } from '@/utils/events/EventBus';
import { SCHEDULE_EVENTS } from '@/utils/events/eventTypes';

// Create a logger for this component
const logger = createTimeLogger('useUserManagement');

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
  const { users, updateUserRole, archiveUser, restoreUser, permanentDeleteUser, updateUserWorkScheduleId } = useAuth();
  const { assignScheduleToUser, resetUserSchedule, defaultSchedule, getScheduleById } = useWorkSchedule();
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
    logger.debug("Editing user with current data:", user);
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
      logger.debug("Updating user with data:", data);
      
      // Calculate the actual fortnight hours based on FTE and schedule
      let baseHours = 0;
      let scheduleToUse = defaultSchedule.id; // Default to the default schedule ID
      
      if (data.useDefaultSchedule) {
        baseHours = calculateFortnightHoursFromSchedule(defaultSchedule);
      } else if (data.scheduleId) {
        scheduleToUse = data.scheduleId;
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
        logger.debug(`Final fortnight hours calculation: base=${baseHours}, FTE=${data.fte}, adjusted=${actualFortnightHours}`);
      }
      
      // First update user metrics (FTE and fortnight hours)
      await updateUserMetrics(selectedUser.id, {
        fte: data.fte,
        fortnightHours: actualFortnightHours
      });
      
      // Update user's role
      await updateUserRole(selectedUser.id, data.role);
      
      // Update the user's workScheduleId property directly
      await updateUserWorkScheduleId(selectedUser.id, data.useDefaultSchedule ? 'default' : data.scheduleId);
      
      // Handle work schedule assignment - either reset to default or assign specific
      if (data.useDefaultSchedule) {
        logger.debug("Resetting user schedule to default");
        await resetUserSchedule(selectedUser.id);
      } else if (data.scheduleId) {
        logger.debug(`Assigning schedule ${data.scheduleId} to user ${selectedUser.id}`);
        await assignScheduleToUser(selectedUser.id, data.scheduleId);
      }
      
      // Notify that a schedule has been updated
      eventBus.publish(SCHEDULE_EVENTS.USER_SCHEDULE_UPDATED, {
        userId: selectedUser.id,
        scheduleId: scheduleToUse,
        timestamp: Date.now()
      });
      
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
