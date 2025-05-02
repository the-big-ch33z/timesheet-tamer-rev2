
import { ToilProcessingRecord } from "@/types/monthEndToil";
import { fetchToilProcessingRecords } from "./ToilProcessingService";
import { v4 as uuidv4 } from "uuid";
import { timeEventsService } from "@/utils/time/events/timeEventsService";

// Storage key
const TOIL_PROCESSING_RECORDS_KEY = "toil_processing_records";

// Get pending approvals for TOIL processing
export const getPendingApprovals = (): ToilProcessingRecord[] => {
  const records = fetchToilProcessingRecords();
  return records.filter(record => record.status === "pending");
};

// Get pending approvals for a specific approver (excluding self-approvals)
export const getPendingApprovalsForUser = (approverId: string): ToilProcessingRecord[] => {
  const records = getPendingApprovals();
  return records.filter(record => record.userId !== approverId); // Prevent self-approval
};

// Approve a TOIL processing request
export const approveToil = (recordId: string, approverId: string): ToilProcessingRecord | null => {
  try {
    const records = fetchToilProcessingRecords();
    const recordIndex = records.findIndex(record => record.id === recordId);
    
    if (recordIndex === -1) return null;
    
    // Check if user is trying to approve their own record
    if (records[recordIndex].userId === approverId) {
      throw new Error("Cannot approve your own TOIL processing request");
    }
    
    // Update record with approval
    records[recordIndex] = {
      ...records[recordIndex],
      status: "approved",
      approverId,
      approvedAt: new Date().toISOString()
    };
    
    // Save records
    localStorage.setItem(TOIL_PROCESSING_RECORDS_KEY, JSON.stringify(records));
    
    // Dispatch event for UI update
    timeEventsService.publish('toil-approval-updated', records[recordIndex]);
    
    return records[recordIndex];
  } catch (error) {
    console.error("Error approving TOIL:", error);
    return null;
  }
};

// Reject a TOIL processing request
export const rejectToil = (recordId: string, approverId: string): ToilProcessingRecord | null => {
  try {
    const records = fetchToilProcessingRecords();
    const recordIndex = records.findIndex(record => record.id === recordId);
    
    if (recordIndex === -1) return null;
    
    // Check if user is trying to reject their own record
    if (records[recordIndex].userId === approverId) {
      throw new Error("Cannot reject your own TOIL processing request");
    }
    
    // Update record with rejection
    records[recordIndex] = {
      ...records[recordIndex],
      status: "rejected",
      approverId,
      approvedAt: new Date().toISOString()
    };
    
    // Save records
    localStorage.setItem(TOIL_PROCESSING_RECORDS_KEY, JSON.stringify(records));
    
    // Dispatch event for UI update
    timeEventsService.publish('toil-approval-updated', records[recordIndex]);
    
    return records[recordIndex];
  } catch (error) {
    console.error("Error rejecting TOIL:", error);
    return null;
  }
};

// Get all processed records (approved or rejected)
export const getProcessedRecords = (): ToilProcessingRecord[] => {
  const records = fetchToilProcessingRecords();
  return records.filter(record => record.status === "approved" || record.status === "rejected");
};
