
import React from "react";
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
import { Calendar, Edit, Filter, RefreshCw, Trash, UserPlus, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Team, User } from "@/types";

interface TeamOverviewProps {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string) => void;
  selectedTeam: Team | null;
  manager: User | null;
  teamMembers: User[];
  onRefreshData: () => void;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  selectedTeam,
  manager,
  teamMembers,
  onRefreshData,
}) => {
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
            <Button variant="default" size="sm" className="gap-1">
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
                  <TableHead>Required Hours</TableHead>
                  <TableHead>Actual Hours</TableHead>
                  <TableHead>TOIL Balance</TableHead>
                  <TableHead>TOIL Rollover</TableHead>
                  <TableHead>Paid Hrs</TableHead>
                  <TableHead>Banked Leave</TableHead>
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
                          <div className="text-xs text-muted-foreground">{member.employeeType || 'Full Time'}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {member.status || 'Active'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>{member.requiredHours || 0} hrs</TableCell>
                      <TableCell>{(member.actualHours || 0).toFixed(1)}</TableCell>
                      <TableCell>{(member.toilBalance || 0).toFixed(1)}</TableCell>
                      <TableCell>{(member.toilRollover || 0).toFixed(1)}</TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>{member.bankedLeave || 0}</TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-500">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
};

export default TeamOverview;
