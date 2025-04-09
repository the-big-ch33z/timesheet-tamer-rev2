
import React, { useState } from "react";
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
import { Archive, ArchiveRestore, Calendar, Edit, Filter, RefreshCw, Trash, UserPlus, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Team, User } from "@/types";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";
import { useTeamPermission } from "@/hooks/useTeamPermission";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TeamOverviewProps {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string) => void;
  selectedTeam: Team | null;
  manager: User | null;
  teamMembers: User[];
  onRefreshData: () => void;
  onEditUser?: (user: User) => void;
  onArchiveUser?: (userId: string) => void;
  onRestoreUser?: (userId: string) => void;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  selectedTeam,
  manager,
  teamMembers,
  onRefreshData,
  onEditUser,
  onArchiveUser,
  onRestoreUser,
}) => {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [userToArchive, setUserToArchive] = useState<string | null>(null);
  const [userToRestore, setUserToRestore] = useState<string | null>(null);
  const { canManageUser } = useTeamPermission();
  
  // Get user by ID from team members
  const getUserById = (userId: string) => {
    return teamMembers.find(member => member.id === userId);
  };
  
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Team Overview</h2>
          {teams.length > 0 && (
            <Select value={selectedTeamId || ""} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedTeam && (
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              {teamMembers.length} members
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>2025-04</span>
            </Button>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
          </div>
          
          <Button size="sm" className="gap-1" onClick={onRefreshData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          {selectedTeam && (
            <Button 
              variant="default" 
              size="sm" 
              className="gap-1"
              onClick={() => setIsAddMemberOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Team Member
            </Button>
          )}
        </div>
      </div>
      
      {selectedTeam ? (
        <>
          <div className="mb-6 p-4 border rounded-lg bg-slate-50">
            <h3 className="text-lg font-medium mb-2">Team: {selectedTeam.name}</h3>
            {manager && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Manager:</span>
                <span className="font-medium">{manager.name}</span>
                <Badge variant="outline" className="bg-green-50 text-green-800">
                  Manager
                </Badge>
              </div>
            )}
          </div>
          
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
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-lg font-medium">No team selected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a team to view its members.
          </p>
        </div>
      )}
      
      {/* Add Team Member Dialog */}
      <AddTeamMemberDialog 
        open={isAddMemberOpen} 
        onOpenChange={setIsAddMemberOpen} 
        team={selectedTeam} 
      />

      {/* Archive User Dialog */}
      <AlertDialog open={!!userToArchive} onOpenChange={(open) => !open && setUserToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {getUserById(userToArchive || '')?.name}? 
              They will no longer be able to access the system, but their data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (userToArchive && onArchiveUser) {
                  onArchiveUser(userToArchive);
                }
                setUserToArchive(null);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Archive User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore User Dialog */}
      <AlertDialog open={!!userToRestore} onOpenChange={(open) => !open && setUserToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {getUserById(userToRestore || '')?.name}? 
              They will regain access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (userToRestore && onRestoreUser) {
                  onRestoreUser(userToRestore);
                }
                setUserToRestore(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Restore User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamOverview;
