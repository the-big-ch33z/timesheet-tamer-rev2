
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { approveToil, getPendingApprovalsForUser, rejectToil } from "@/services/toil/ApprovalService";
import { ToilProcessingRecord } from "@/types/monthEndToil";
import { canApproveToil, formatHours } from "./helpers/toilUtils";
import { format } from "date-fns";

const ToilApprovalQueue: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [pendingApprovals, setPendingApprovals] = useState<ToilProcessingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRecordId, setProcessingRecordId] = useState<string | null>(null);

  // Load pending approvals on mount
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const loadApprovals = () => {
      const approvals = getPendingApprovalsForUser(currentUser.id);
      setPendingApprovals(approvals);
      setLoading(false);
    };
    
    loadApprovals();
    
    // Listen for approval updates
    const handleApprovalUpdate = () => {
      loadApprovals();
    };
    
    window.addEventListener('toil-approval-updated', handleApprovalUpdate);
    
    return () => {
      window.removeEventListener('toil-approval-updated', handleApprovalUpdate);
    };
  }, [currentUser?.id]);

  // Handle approval
  const handleApprove = async (recordId: string) => {
    if (!currentUser?.id) return;
    
    try {
      setProcessingRecordId(recordId);
      
      const result = await approveToil(recordId, currentUser.id);
      
      if (result) {
        toast({
          title: "TOIL Approved",
          description: "The TOIL processing request has been approved.",
        });
        
        // Remove approved record from the list
        setPendingApprovals(prev => prev.filter(record => record.id !== recordId));
      } else {
        throw new Error("Failed to approve TOIL");
      }
    } catch (error) {
      console.error("Error approving TOIL:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve TOIL request.",
        variant: "destructive",
      });
    } finally {
      setProcessingRecordId(null);
    }
  };

  // Handle rejection
  const handleReject = async (recordId: string) => {
    if (!currentUser?.id) return;
    
    try {
      setProcessingRecordId(recordId);
      
      const result = await rejectToil(recordId, currentUser.id);
      
      if (result) {
        toast({
          title: "TOIL Rejected",
          description: "The TOIL processing request has been rejected.",
        });
        
        // Remove rejected record from the list
        setPendingApprovals(prev => prev.filter(record => record.id !== recordId));
      } else {
        throw new Error("Failed to reject TOIL");
      }
    } catch (error) {
      console.error("Error rejecting TOIL:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject TOIL request.",
        variant: "destructive",
      });
    } finally {
      setProcessingRecordId(null);
    }
  };

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "manager")) {
    return null; // Only show to admins and managers
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>TOIL Approval Queue</CardTitle>
        <CardDescription>
          Review and approve pending TOIL processing requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading approvals...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending TOIL approvals
          </div>
        ) : (
          <Table>
            <TableCaption>Pending TOIL Processing Requests</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Rollover</TableHead>
                <TableHead>Surplus</TableHead>
                <TableHead>Surplus Action</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.map((record) => {
                const isProcessing = processingRecordId === record.id;
                const canApprove = canApproveToil(record, currentUser.id);
                const monthDisplay = format(new Date(record.month + "-01"), "MMM yyyy");
                
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.userId}</TableCell>
                    <TableCell>{monthDisplay}</TableCell>
                    <TableCell>{formatHours(record.totalHours)}</TableCell>
                    <TableCell>{formatHours(record.rolloverHours)}</TableCell>
                    <TableCell>{formatHours(record.surplusHours)}</TableCell>
                    <TableCell>
                      {record.surplusAction ? (
                        record.surplusAction === "paid" ? "Pay Out" : "Bank as Leave"
                      ) : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(record.id)}
                          disabled={isProcessing || !canApprove}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(record.id)}
                          disabled={isProcessing || !canApprove}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ToilApprovalQueue;
