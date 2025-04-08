
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole, User, Team } from "@/types";
import { ChevronRight, Users, User as UserIcon, Shield } from "lucide-react";
import { RoleBadge } from "@/components/common/RoleBasedUI";

const OrganizationTree = () => {
  const { users, teams, getUsersByTeam, getTeamsByManager, getUsersByRole } = useAuth();
  
  // Get admin users
  const admins = getUsersByRole("admin");
  
  // Helper function to render a user node
  const renderUserNode = (user: User, level: number = 0) => {
    const isAdmin = user.role === "admin";
    const isManager = user.role === "manager";
    
    return (
      <div key={user.id} style={{ marginLeft: `${level * 24}px` }} className="my-2">
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <UserIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium flex items-center gap-2">
              {user.name}
              <RoleBadge role={user.role} />
            </div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
        
        {/* If user is a manager, render their teams and members */}
        {isManager && renderManagerTeams(user)}
      </div>
    );
  };
  
  // Render teams managed by a manager
  const renderManagerTeams = (manager: User) => {
    const managerTeams = getTeamsByManager(manager.id);
    
    if (managerTeams.length === 0) return null;
    
    return (
      <div className="ml-8 border-l-2 border-dashed border-muted-foreground/20 pl-4 my-2">
        {managerTeams.map(team => renderTeam(team))}
      </div>
    );
  };
  
  // Render a team and its members
  const renderTeam = (team: Team) => {
    const teamMembers = getUsersByTeam(team.id).filter(user => user.id !== team.managerId);
    
    if (teamMembers.length === 0) {
      return (
        <div key={team.id} className="my-2">
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
              <Users className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <div className="font-medium">{team.name}</div>
              <div className="text-xs text-muted-foreground">No team members</div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div key={team.id} className="my-2">
        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
            <Users className="h-4 w-4 text-secondary" />
          </div>
          <div>
            <div className="font-medium">{team.name}</div>
            <div className="text-xs text-muted-foreground">{teamMembers.length} team members</div>
          </div>
        </div>
        
        <div className="ml-8 border-l-2 border-dotted border-muted-foreground/10 pl-4">
          {teamMembers.map(member => (
            <div key={member.id} className="my-2">
              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="font-medium">{member.name}</div>
                <RoleBadge role={member.role} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Structure</CardTitle>
        <CardDescription>Hierarchical view of your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Organization Tree */}
        <div className="border rounded-md p-4 space-y-2">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
            <Shield className="h-5 w-5 text-primary" />
            <div className="font-semibold">Organization Hierarchy</div>
          </div>
          
          {/* Render Admins at the top */}
          <div className="mt-4">
            {admins.map(admin => renderUserNode(admin))}
          </div>
          
          {/* Render Managers who are not already shown under admins */}
          <div className="mt-4">
            {getUsersByRole("manager")
              .filter(manager => !getTeamsByManager(manager.id).some(team => 
                admins.some(admin => getTeamsByManager(admin.id).includes(team))
              ))
              .map(manager => renderUserNode(manager, 0))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationTree;
