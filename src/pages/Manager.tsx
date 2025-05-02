
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import StatisticsCards from "@/components/manager/StatisticsCards";
import TabContent from "@/components/manager/TabContent";
import { EditUserForm } from "@/components/admin/users/EditUserForm";
import ManagerHeader from "@/components/manager/ManagerHeader";
import { useManagerState } from "@/components/manager/hooks/useManagerState";
import { useUserActions } from "@/components/manager/hooks/useUserActions";
import TeamOverview from "@/components/manager/team-overview";

const Manager = () => {
  const { users, teams, getUserById } = useAuth();
  
  // Custom hooks for state management and user actions
  const managerState = useManagerState();
  const userActions = useUserActions(managerState.refreshTeamMembers);
  
  const {
    selectedTab,
    setSelectedTab,
    selectedTeamId,
    setSelectedTeamId,
    teamMembers,
    isEditUserOpen,
    setIsEditUserOpen,
    selectedUser,
    setSelectedUser,
    filteredTeams
  } = managerState;
  
  // Get the selected team and manager
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
  
  // Event handlers for user actions
  const onEditUser = (user) => {
    const editableUser = userActions.handleEditUser(user);
    if (editableUser) {
      setSelectedUser(editableUser);
      setIsEditUserOpen(true);
    }
  };

  const onSubmitEditUser = async (data) => {
    if (!selectedUser) return;
    
    const success = await userActions.handleSubmitEditUser(selectedUser, data);
    if (success) {
      setIsEditUserOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <ManagerHeader
        activeEmployeesCount={activeEmployeesCount}
        teamsCount={teamsCount}
      />
      
      {/* Statistics Cards */}
      <StatisticsCards
        activeEmployeesCount={activeEmployeesCount}
        totalToilHours={totalToilHours}
        pendingApprovalsCount={pendingApprovalsCount}
        totalBankedLeave={totalBankedLeave}
        teamsCount={teamsCount}
      />
      
      {/* Tabs */}
      <Tabs defaultValue="team-overview" className="w-full" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="team-overview">Team Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="toil-approvals">TOIL Approval Report</TabsTrigger>
          <TabsTrigger value="dta-report">DTA Approval Report</TabsTrigger>
        </TabsList>

        <TabContent />

        {/* Use TabsContent for rendering specific content based on tab selection */}
        <TabsContent value="team-overview">
          <TeamOverview 
            teams={filteredTeams}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            selectedTeam={selectedTeam}
            manager={manager}
            teamMembers={teamMembers}
            onRefreshData={managerState.refreshTeamMembers}
            onEditUser={onEditUser}
            onArchiveUser={userActions.handleArchiveUser}
            onRestoreUser={userActions.handleRestoreUser}
          />
        </TabsContent>
      </Tabs>
      
      {/* Edit User Sheet */}
      <EditUserForm 
        isOpen={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        selectedUser={selectedUser}
        onSubmit={onSubmitEditUser}
      />
    </div>
  );
};

export default Manager;
