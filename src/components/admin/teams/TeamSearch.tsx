
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface TeamSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCreateTeam: () => void;
}

export const TeamSearch: React.FC<TeamSearchProps> = ({
  searchTerm,
  onSearchChange,
  onCreateTeam
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Button onClick={onCreateTeam} className="flex items-center gap-2">
        <Plus className="h-4 w-4" /> Create Team
      </Button>
    </div>
  );
};
