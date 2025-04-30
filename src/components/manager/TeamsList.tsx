
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Settings, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { AddTeamMemberDialog } from "@/components/admin/teams/AddTeamMemberDialog";
import { EditTeamDialog } from "@/components/admin/teams/EditTeamDialog";
import { Team } from "@/types";

const TeamsList = () => {
  const { teams, getUserById, users, currentUser } = useAuth();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Filter teams by organization or by manager (if current user is a manager)
  const filteredTeams = teams.filter(team => {
    if (currentUser?.role === 'admin') {
      return currentUser.organizationId === team.organizationId;
    }
    // If manager, only show their teams
    return team.managerId === currentUser?.id;
  });

  const getManagerName = (managerId: string) => {
    const manager = getUserById(managerId);
    return manager ? manager.name : "Unassigned";
  };

  const getTeamMemberCount = (teamId: string) => {
    return users.filter(user => user.teamIds?.includes(teamId)).length;
  };

  const handleAddMember = (team: Team) => {
    setSelectedTeam(team);
    setIsAddMemberOpen(true);
  };

  const handleManageTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditTeamOpen(true);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Teams</h2>
        
        <div className="flex gap-2">
          {currentUser?.role === 'admin' && (
            <Link to="/admin">
              <Button variant="default" size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Create Team
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {filteredTeams.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-lg font-medium">No teams found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentUser?.role === 'admin' ? 'Create a team to get started.' : 'You are not managing any teams.'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Team Members</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(team.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getManagerName(team.managerId)}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800">
                      {getTeamMemberCount(team.id)} members
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => handleAddMember(team)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Member
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => handleManageTeam(team)}
                      >
                        <Settings className="h-4 w-4" />
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Team Member Dialog */}
      <AddTeamMemberDialog 
        open={isAddMemberOpen} 
        onOpenChange={setIsAddMemberOpen} 
        team={selectedTeam} 
      />

      {/* Edit Team Dialog */}
      <EditTeamDialog
        open={isEditTeamOpen}
        onOpenChange={setIsEditTeamOpen}
        team={selectedTeam}
      />
    </div>
  );
};

export default TeamsList;
