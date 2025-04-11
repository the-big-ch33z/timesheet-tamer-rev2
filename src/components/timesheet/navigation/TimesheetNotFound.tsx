
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimesheetNotFoundProps {
  userExists: boolean;
  canViewTimesheet: boolean;
}

const TimesheetNotFound: React.FC<TimesheetNotFoundProps> = ({
  userExists,
  canViewTimesheet
}) => {
  const { toast } = useToast();

  // Handle access denied
  if (!canViewTimesheet) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to view this timesheet",
      variant: "destructive",
    });
    return <Navigate to="/timesheet" replace />;
  }

  // Handle user not found
  if (!userExists) {
    return (
      <div className="container py-6">
        <Alert variant="destructive" className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            User not found. The requested timesheet doesn't exist.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/timesheet" className="mt-4 flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to your timesheet
          </Link>
        </Button>
      </div>
    );
  }

  // Return null if everything is ok
  return null;
};

export default TimesheetNotFound;
