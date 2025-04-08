
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Users, UserPlus, User as UserIcon } from "lucide-react";
import { RoleBadge } from "@/components/common/RoleBasedUI";
import { Team } from "@/types";

interface TeamTableProps {
  searchTerm: string;
  onAddMember: (team: Team) => void;
}

export const TeamTable: React.FC<TeamTableProps> = ({ searchTerm, onAddMember }) => {
  const { teams, users, getUsersByTeam } = useAuth();

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team Name</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Members</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredTeams.map(team => {
          // Get the manager for this team
          const manager = users.find(user => user.id === team.managerId);
          // Get team members
          const members = getUsersByTeam(team.id);
          
          return (
            <TableRow key={team.id}>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell>
                {manager ? (
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    {manager.name}
                    <RoleBadge role={manager.role} />
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">No manager assigned</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {members.length} members
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAddMember(team)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {filteredTeams.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
              No teams found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
