
import React from "react";
import { useTeamPermission } from "@/hooks/useTeamPermission";
import { User } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, ArchiveRestore, Calendar, Edit, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkSchedule } from "@/contexts/work-schedule";

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
  const { getScheduleById, defaultSchedule } = useWorkSchedule();

  const getScheduleName = (workScheduleId?: string) => {
    if (!workScheduleId || workScheduleId === 'default') {
      return defaultSchedule.name + " (Default)";
    }
    
    const schedule = getScheduleById(workScheduleId);
    return schedule ? schedule.name : "Unknown Schedule";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => {
              // Pre-compute permission once per member
              const hasManagePermission = canManageUser(member.id);
              
              return (
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
                    <Badge variant="outline" className="flex items-center gap-1 bg-slate-50">
                      <Clock className="h-3 w-3" />
                      {getScheduleName(member.workScheduleId)}
                    </Badge>
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
                            disabled={!hasManagePermission}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-amber-500 hover:text-amber-700"
                            onClick={() => setUserToArchive(member.id)}
                            disabled={!hasManagePermission}
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
                          disabled={!hasManagePermission}
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No team members found in this team.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
