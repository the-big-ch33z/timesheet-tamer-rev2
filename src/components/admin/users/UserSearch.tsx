
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddUser: () => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  searchTerm,
  onSearchChange,
  onAddUser
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Button onClick={onAddUser} className="flex items-center gap-2">
        <Plus className="h-4 w-4" /> Add User
      </Button>
    </div>
  );
};
