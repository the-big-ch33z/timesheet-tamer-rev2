
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamSearch } from "./TeamSearch";
import { TeamTable } from "./TeamTable";
import { CreateTeamDialog } from "./CreateTeamDialog";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";
import { Team } from "@/types";

const TeamManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const handleCreateTeam = () => {
    setIsCreateTeamOpen(true);
  };

  const handleAddMember = (team: Team) => {
    setSelectedTeam(team);
    setIsAddMemberOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
        <CardDescription>Create and manage teams within your organization</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <TeamSearch 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          onCreateTeam={handleCreateTeam}
        />
        
        <TeamTable 
          searchTerm={searchTerm} 
          onAddMember={handleAddMember} 
        />
      </CardContent>

      <CreateTeamDialog 
        open={isCreateTeamOpen} 
        onOpenChange={setIsCreateTeamOpen}
      />

      <AddTeamMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        team={selectedTeam}
      />
    </Card>
  );
};

export default TeamManagement;
