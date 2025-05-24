
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Team } from "@/types";
import { CalendarIcon, RefreshCcw, UserPlus } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface TeamHeaderProps {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string) => void;
  teamMembersCount: number;
  onAddMemberClick: () => void;
  onRefreshData: () => void;
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  includeManagerInTable: boolean;
  setIncludeManagerInTable: (value: boolean) => void;
}

export const TeamHeader: React.FC<TeamHeaderProps> = ({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  teamMembersCount,
  onAddMemberClick,
  onRefreshData,
  selectedMonth,
  setSelectedMonth,
  includeManagerInTable,
  setIncludeManagerInTable
}) => {
  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6 pb-4 border-b">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Team Overview</h2>
        <p className="text-muted-foreground">
          Select a team to view its members ({teamMembersCount} {teamMembersCount === 1 ? 'member' : 'members'})
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <div className="flex gap-2 items-center">
          <Select
            value={selectedTeamId || ""}
            onValueChange={setSelectedTeamId}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
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
          
          <Button
            size="icon"
            variant="outline"
            onClick={onRefreshData}
            title="Refresh data"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              ←
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-1 min-w-[140px] justify-between">
                  {format(selectedMonth, "MMMM yyyy")}
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              →
            </Button>
          </div>
          
          <Button 
            onClick={onAddMemberClick} 
            size="sm"
            disabled={!selectedTeamId}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        </div>
      </div>
      
      {/* Toggle for showing manager in table */}
      {selectedTeamId && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Switch 
            id="show-manager"
            checked={includeManagerInTable}
            onCheckedChange={setIncludeManagerInTable}
          />
          <Label htmlFor="show-manager" className="cursor-pointer text-sm">
            Show manager in table
          </Label>
        </div>
      )}
    </div>
  );
};
