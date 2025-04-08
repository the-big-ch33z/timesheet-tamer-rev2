import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  ChevronDown,
  Clock,
  Edit,
  FileText,
  Filter,
  RefreshCw,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";
import TeamsList from "@/components/manager/TeamsList";
import { useAuth } from "@/contexts/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Team } from "@/types";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeType: string;
  status: "active" | "on-leave" | "inactive";
  requiredHours: number;
  actualHours: number;
  toilBalance: number;
  toilRollover: number;
  paidHours: number;
  bankedLeave: number;
};

const Manager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("team-overview");
  const { users, teams, getUserById, getUsersByTeam, currentUser } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
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
      const members = getUsersByTeam(selectedTeamId);
      setTeamMembers(members);
    } else {
      setTeamMembers([]);
    }
  }, [selectedTeamId, getUsersByTeam]);
  
  const selectedTeam = selectedTeamId 
    ? filteredTeams.find(team => team.id === selectedTeamId) 
    : null;
  
  const manager = selectedTeam 
    ? getUserById(selectedTeam.managerId) 
    : null;
  
  // Calculate stats
  const activeEmployeesCount = users.filter(m => m.status === "active").length;
  const totalToilHours = 0; // Mock data - would come from a real API
  const pendingApprovalsCount = 0; // Mock data - would come from a real API
  const totalBankedLeave = 0; // Mock data - would come from a real API
  const teamsCount = teams.length;

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Employee Manager</h1>
        <p className="text-muted-foreground">Manage your team members and view their statistics.</p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Employees</p>
                <h2 className="text-3xl font-bold">{activeEmployeesCount}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-full">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total TOIL Hours</p>
                <h2 className="text-3xl font-bold">{totalToilHours.toFixed(1)}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <h2 className="text-3xl font-bold">{pendingApprovalsCount}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Banked Leave</p>
                <h2 className="text-3xl font-bold">{totalBankedLeave.toFixed(1)}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teams</p>
                <h2 className="text-3xl font-bold">{teamsCount}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="team-overview" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="team-overview">Team Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="toil-report">TOIL Approval Report</TabsTrigger>
          <TabsTrigger value="dta-report">DTA Approval Report</TabsTrigger>
        </TabsList>

        <TabsContent value="team-overview">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">Team Overview</h2>
                {filteredTeams.length > 0 && (
                  <Select value={selectedTeamId || ""} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTeams.map((team) => (
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
                
                <Button size="sm" className="gap-1" onClick={() => console.log("Refresh data")}>
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
        </TabsContent>
        
        <TabsContent value="teams">
          <TeamsList />
        </TabsContent>
        
        <TabsContent value="toil-report">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">TOIL Approval Report</h2>
            <p className="text-muted-foreground">
              This section would display Time Off In Lieu (TOIL) approvals and reports.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="dta-report">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-2xl font-bold mb-6">DTA Approval Report</h2>
            <p className="text-muted-foreground">
              This section would display DTA approvals and reports.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manager;
