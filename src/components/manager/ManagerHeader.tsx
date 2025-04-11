
import React from "react";

interface ManagerHeaderProps {
  activeEmployeesCount: number;
  teamsCount: number;
}

const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  activeEmployeesCount,
  teamsCount
}) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Employee Manager</h1>
      <p className="text-muted-foreground">
        Manage your team members and view their statistics. 
        Currently managing {activeEmployeesCount} active employees across {teamsCount} teams.
      </p>
    </div>
  );
};

export default ManagerHeader;
