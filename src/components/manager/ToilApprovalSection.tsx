
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ToilApprovalQueue from "../toil/ToilApprovalQueue";
import { useAuth } from "@/contexts/auth";

const ToilApprovalSection: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Only show to admins and managers
  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "manager")) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TOIL Approval Requests</CardTitle>
          <CardDescription>
            Review and manage month-end TOIL processing requests from your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToilApprovalQueue />
        </CardContent>
      </Card>
    </div>
  );
};

export default ToilApprovalSection;
