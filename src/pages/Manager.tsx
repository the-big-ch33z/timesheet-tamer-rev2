
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth";
import StatisticsCards from "@/components/manager/StatisticsCards";
import TabContent from "@/components/manager/TabContent";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType: string;
  status: "active" | "on-leave" | "inactive";
  requiredHours: number;
  actualHours: number;
  toilBalance: number;
  toilRollover: number;
  paidHours: number;
  bankedLeave: number;
};

const Manager = () => {
  const [selectedTab, setSelectedTab] = useState("team-overview");
  const { users, teams, getUserById, getUsersByTeam, currentUser } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
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
      const members = getUsersByTeam(selectedTeamId);
      setTeamMembers(members);
    } else {
      setTeamMembers([]);
    }
  }, [selectedTeamId, getUsersByTeam]);
  
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
    // Implement actual refresh logic here
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
        />
      </Tabs>
    </div>
  );
};

export default Manager;
