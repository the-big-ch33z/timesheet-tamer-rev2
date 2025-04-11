
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { User } from "@/types";

export const useManagerState = () => {
  const [selectedTab, setSelectedTab] = useState("team-overview");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { teams, getUsersByTeam, currentUser } = useAuth();
  
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

  return {
    selectedTab,
    setSelectedTab,
    selectedTeamId,
    setSelectedTeamId,
    teamMembers,
    setTeamMembers,
    isEditUserOpen,
    setIsEditUserOpen,
    selectedUser,
    setSelectedUser,
    filteredTeams,
    refreshTeamMembers
  };
};
