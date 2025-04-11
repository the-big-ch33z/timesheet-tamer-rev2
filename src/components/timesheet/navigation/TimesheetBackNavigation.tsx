
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { User } from "@/types";
import { useRolePermission } from "@/hooks/useRolePermission";

interface TimesheetBackNavigationProps {
  user?: User | null;
  isViewingOtherUser: boolean;
}

const TimesheetBackNavigation: React.FC<TimesheetBackNavigationProps> = ({ 
  user, 
  isViewingOtherUser 
}) => {
  const { isAdmin } = useRolePermission();
  
  if (!isViewingOtherUser) return null;
  
  return (
    <div className="flex items-center justify-between mb-4">
      <Button 
        asChild 
        variant="outline"
        className="mb-4"
      >
        <Link to={isAdmin() ? "/admin" : "/manager"} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to {isAdmin() ? "Admin" : "Manager"} Dashboard
        </Link>
      </Button>
      <h2 className="text-lg font-medium">
        Viewing {user?.name}'s Timesheet
      </h2>
    </div>
  );
};

export default TimesheetBackNavigation;
