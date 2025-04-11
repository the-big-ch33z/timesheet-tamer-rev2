
import { User, UserRole } from "@/types";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useTeamPermission } from "@/hooks/useTeamPermission";
import { UserEditFormValues } from "@/components/admin/users/EditUserForm";

export const useUserActions = (refreshTeamMembers: () => void) => {
  const { toast } = useToast();
  const { updateUserRole, updateUserMetrics, archiveUser, restoreUser } = useAuth();
  const { assignScheduleToUser } = useWorkSchedule();
  const { canManageUser } = useTeamPermission();
  
  // Handle editing a user
  const handleEditUser = (user: User) => {
    if (!canManageUser(user.id)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit this user.",
        variant: "destructive",
      });
      return null;
    }
    
    return user;
  };

  // Handle archiving a user
  const handleArchiveUser = async (userId: string) => {
    if (!canManageUser(userId)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to archive this user.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await archiveUser(userId);
      // Immediately refresh team members list after archiving
      refreshTeamMembers();
    } catch (error) {
      console.error("Error archiving user:", error);
    }
  };

  // Handle restoring a user
  const handleRestoreUser = async (userId: string) => {
    if (!canManageUser(userId)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to restore this user.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await restoreUser(userId);
      // Immediately refresh team members list after restoring
      refreshTeamMembers();
    } catch (error) {
      console.error("Error restoring user:", error);
    }
  };

  // Handle form submission for editing a user
  const handleSubmitEditUser = async (user: User, data: UserEditFormValues) => {
    try {
      // Update user's role
      await updateUserRole(user.id, data.role);
      
      // Handle work schedule assignment
      const scheduleId = data.useDefaultSchedule ? 'default' : data.scheduleId || 'default';
      
      // Assign schedule to user (this updates the workScheduleId in the user object)
      await assignScheduleToUser(user.id, scheduleId);
      
      // Update user metrics (FTE and fortnight hours)
      await updateUserMetrics(user.id, {
        fte: data.fte,
        fortnightHours: data.fortnightHours
      });
      
      toast({
        title: "User Updated",
        description: `${user.name}'s details have been updated.`,
      });
      
      // Refresh team members list after updating
      refreshTeamMembers();
      
      return true;
    } catch (error) {
      toast({
        title: "Error Updating User",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleEditUser,
    handleArchiveUser,
    handleRestoreUser,
    handleSubmitEditUser
  };
};
