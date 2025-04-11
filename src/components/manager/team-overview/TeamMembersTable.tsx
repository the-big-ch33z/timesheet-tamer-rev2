
import React from "react";
import { useTeamPermission } from "@/hooks/useTeamPermission";
import { User } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, ArchiveRestore, Calendar, Edit } from "lucide-react";
import { Link } from "react-router-dom";

interface TeamMembersTableProps {
  teamMembers: User[];
  onEditUser?: (user: User) => void;
  setUserToArchive: (userId: string) => void;
  setUserToRestore: (userId: string) => void;
}

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  teamMembers,
  onEditUser,
  setUserToArchive,
  setUserToRestore
}) => {
  const { canManageUser } = useTeamPermission();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div>{member.role}</div>
                    <div className="text-xs text-muted-foreground">Team Member</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" 
                    className={member.status === 'archived' 
                      ? "bg-amber-100 text-amber-800"
                      : "bg-green-100 text-green-800"
                    }>
                    {member.status === 'archived' ? 'Archived' : (member.status || 'Active')}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex gap-2">
                    {/* View Timesheet Button */}
                    <Link to={`/timesheet/${member.id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                        title="View Timesheet"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </Link>
                  
                    {member.status !== 'archived' ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => onEditUser && onEditUser(member)}
                          disabled={!canManageUser(member.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-amber-500 hover:text-amber-700"
                          onClick={() => setUserToArchive(member.id)}
                          disabled={!canManageUser(member.id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-green-500 hover:text-green-700"
                        onClick={() => setUserToRestore(member.id)}
                        disabled={!canManageUser(member.id)}
                      >
                        <ArchiveRestore className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No team members found in this team.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
