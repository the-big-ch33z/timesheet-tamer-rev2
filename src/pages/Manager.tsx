
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import StatisticsCards from "@/components/manager/StatisticsCards";
import TabContent from "@/components/manager/TabContent";
import { EditUserForm, UserEditFormValues } from "@/components/admin/users/EditUserForm";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useTeamPermission } from "@/hooks/useTeamPermission";

const Manager = () => {
  const [selectedTab, setSelectedTab] = useState("team-overview");
  const { users, teams, getUserById, getUsersByTeam, currentUser, updateUserRole, updateUserMetrics, archiveUser, restoreUser } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { assignScheduleToUser } = useWorkSchedule();
  const { canManageUser } = useTeamPermission();
  
  // Filter teams by organization or by manager (if current user is a manager)
  const filteredTeams = teams.filter(team => {
    if (currentUser?.role === 'admin') {
      return currentUser.organizationId === team.organizationId;
    }
    // If manager, only show their teams
    return team.managerId === currentUser?.id;
  });
  
  // Set initial selected team when component mounts or when filtered teams change
  useEffect(() => {
    if (filteredTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(filteredTeams[0].id);
    }
  }, [filteredTeams, selectedTeamId]);
  
  // Update team members when selected team changes
  useEffect(() => {
    if (selectedTeamId) {
      refreshTeamMembers();
    } else {
      setTeamMembers([]);
    }
  }, [selectedTeamId, getUsersByTeam]);

  // Function to refresh team members
  const refreshTeamMembers = () => {
    if (selectedTeamId) {
      const members = getUsersByTeam(selectedTeamId);
      setTeamMembers(members);
    }
  };
  
  const selectedTeam = selectedTeamId 
    ? filteredTeams.find(team => team.id === selectedTeamId) 
    : null;
  
  const manager = selectedTeam 
    ? getUserById(selectedTeam.managerId) 
    : null;
  
  // Calculate stats
  const activeEmployeesCount = users.filter(m => m.status === "active").length;
  const totalToilHours = 0; // Mock data - would come from a real API
  const pendingApprovalsCount = 0; // Mock data - would come from a real API
  const totalBankedLeave = 0; // Mock data - would come from a real API
  const teamsCount = teams.length;
  
  // Handle refresh data
  const handleRefreshData = () => {
    console.log("Refreshing data");
    refreshTeamMembers();
  };

  // Handle editing a user
  const handleEditUser = (user: User) => {
    if (!canManageUser(user.id)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit this user.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUser(user);
    setIsEditUserOpen(true);
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
  const handleSubmitEditUser = async (data: UserEditFormValues) => {
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
      
      // Refresh team members list after updating
      if (selectedTeamId) {
        const members = getUsersByTeam(selectedTeamId);
        setTeamMembers(members);
      }
    } catch (error) {
      toast({
        title: "Error Updating User",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Employee Manager</h1>
        <p className="text-muted-foreground">Manage your team members and view their statistics.</p>
      </div>
      
      {/* Statistics Cards */}
      <StatisticsCards
        activeEmployeesCount={activeEmployeesCount}
        totalToilHours={totalToilHours}
        pendingApprovalsCount={pendingApprovalsCount}
        totalBankedLeave={totalBankedLeave}
        teamsCount={teamsCount}
      />
      
      {/* Tabs */}
      <Tabs defaultValue="team-overview" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="team-overview">Team Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="toil-report">TOIL Approval Report</TabsTrigger>
          <TabsTrigger value="dta-report">DTA Approval Report</TabsTrigger>
        </TabsList>

        <TabContent
          activeTab={selectedTab}
          filteredTeams={filteredTeams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          selectedTeam={selectedTeam}
          manager={manager}
          teamMembers={teamMembers}
          onRefreshData={handleRefreshData}
          onEditUser={handleEditUser}
          onArchiveUser={handleArchiveUser}
          onRestoreUser={handleRestoreUser}
        />
      </Tabs>
      
      {/* Edit User Sheet */}
      <EditUserForm 
        isOpen={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        selectedUser={selectedUser}
        onSubmit={handleSubmitEditUser}
      />
    </div>
  );
};

export default Manager;
