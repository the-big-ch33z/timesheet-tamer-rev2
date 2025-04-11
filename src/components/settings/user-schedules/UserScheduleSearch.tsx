
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserScheduleSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const UserScheduleSearch: React.FC<UserScheduleSearchProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search users by name or email..."
        className="pl-9"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};
