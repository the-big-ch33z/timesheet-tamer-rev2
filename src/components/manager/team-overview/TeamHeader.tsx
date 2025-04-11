
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Filter, RefreshCw, UserPlus } from "lucide-react";
import { Team } from "@/types";

interface TeamHeaderProps {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string) => void;
  teamMembersCount: number;
  onAddMemberClick: () => void;
  onRefreshData: () => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  teamMembersCount,
  onAddMemberClick,
  onRefreshData
}) => {
  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefreshData) {
      onRefreshData();
    }
  };

  return (
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
        {teamMembersCount > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            {teamMembersCount} members
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
        
        <Button size="sm" className="gap-1" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
        
        <Button 
          variant="default" 
          size="sm" 
          className="gap-1"
          onClick={onAddMemberClick}
        >
          <UserPlus className="h-4 w-4" />
          Add Team Member
        </Button>
      </div>
    </div>
  );
};
