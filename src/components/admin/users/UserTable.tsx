
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Archive, ArchiveRestore } from "lucide-react";
import { User, UserRole } from "@/types";
import { useAuth } from "@/contexts/auth";

interface UserTableProps {
  filteredUsers: User[];
  showArchived: boolean;
  onEditUser: (user: User) => void;
  onArchiveUser: (userId: string) => void;
  onRestoreUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ 
  filteredUsers, 
  showArchived,
  onEditUser, 
  onArchiveUser,
  onRestoreUser,
  onDeleteUser 
}) => {
  const { getTeamById, teamMemberships } = useAuth();

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "team-member":
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'archived') {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Archived</Badge>;
    }
    return null;
  };

  const getUserTeams = (userId: string) => {
    const { teams } = useAuth();
    const userTeamIds = teamMemberships
      .filter(membership => membership.userId === userId)
      .map(membership => membership.teamId);
      
    return teams.filter(team => userTeamIds.includes(team.id) || team.managerId === userId);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Teams</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map(user => {
          const userTeams = getUserTeams(user.id);
          
          return (
            <TableRow key={user.id} className={user.status === 'archived' ? 'bg-muted/30' : ''}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {user.name}
                  {getStatusBadge(user.status || 'active')}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role.replace("-", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                {userTeams.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {userTeams.map(team => (
                      <Badge key={team.id} variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.name}
                        {team.managerId === user.id && " (Manager)"}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm italic">No teams</span>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {!showArchived ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => onEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onArchiveUser(user.id)} className="text-amber-500 hover:text-amber-700">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => onRestoreUser(user.id)} className="text-green-500 hover:text-green-700">
                      <ArchiveRestore className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          );
        })}
        {filteredUsers.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              {showArchived ? "No archived users found." : "No users found."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
