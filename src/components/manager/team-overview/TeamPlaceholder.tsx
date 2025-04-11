
import React from "react";
import { Users } from "lucide-react";

export const TeamPlaceholder: React.FC = () => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-2 text-lg font-medium">No team selected</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Please select a team to view its members.
      </p>
    </div>
  );
};
