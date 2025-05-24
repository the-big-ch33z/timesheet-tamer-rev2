
import React, { useState, useMemo } from "react";
import { Team, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { TeamHeader } from "./TeamHeader";
import TeamMembersTable from "./TeamMembersTable";
import { TeamPlaceholder } from "./TeamPlaceholder";
import { AddTeamMemberDialog } from "../AddTeamMemberDialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useTeamMemberMetrics } from "@/hooks/useTeamMemberMetrics";

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
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [includeManagerInTable, setIncludeManagerInTable] = useState<boolean>(false);
  
  // Create the display team members list that conditionally includes the manager
  const displayTeamMembers = useMemo(() => {
    if (includeManagerInTable && manager && selectedTeam) {
      // Include manager in the list if toggle is enabled and manager is not already in team members
      const isManagerAlreadyInTeam = teamMembers.some(member => member.id === manager.id);
      if (!isManagerAlreadyInTeam) {
        return [...teamMembers, manager];
      }
    }
    return teamMembers;
  }, [teamMembers, manager, includeManagerInTable, selectedTeam]);
  
  // Get metrics for the display team members (including manager if toggle is on)
  const { metrics } = useTeamMemberMetrics(displayTeamMembers, selectedMonth);
  
  // Get user by ID from display team members
  const getUserById = (userId: string) => {
    return displayTeamMembers.find(member => member.id === userId);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      {selectedTeam ? (
        <>
          <TeamHeader 
            teams={teams}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            teamMembersCount={teamMembers.length}
            onAddMemberClick={() => setIsAddMemberOpen(true)}
            onRefreshData={onRefreshData}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            includeManagerInTable={includeManagerInTable}
            setIncludeManagerInTable={setIncludeManagerInTable}
          />
          
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
          
          <TeamMembersTable 
            teamMembers={displayTeamMembers}
            onMemberSelect={onEditUser}
            setUserToArchive={setUserToArchive}
            setUserToRestore={setUserToRestore}
            metrics={metrics}
            showMetrics={true}
            selectedMonth={selectedMonth}
            selectedTeam={selectedTeam}
          />
        </>
      ) : (
        <TeamPlaceholder />
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
