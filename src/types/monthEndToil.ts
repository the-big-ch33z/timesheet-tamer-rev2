
import { TOILRecord } from "./toil";

export interface ToilProcessingRecord {
  id: string;
  userId: string;
  month: string; // Format: 'yyyy-MM'
  totalHours: number;
  rolloverHours: number;
  surplusHours: number;
  surplusAction?: "paid" | "banked";
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  approverId?: string;
  approvedAt?: string;
  originalRecords: string[]; // IDs of original TOIL records
}

export interface ToilThresholds {
  fullTime: number;
  partTime: number;
  casual: number;
}

export enum ToilProcessingStatus {
  NOT_READY = "not_ready",
  READY = "ready",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

export interface ToilMonthProcessingState {
  userId: string;
  month: string;
  status: ToilProcessingStatus;
  lastUpdated: string;
}

export interface ToilProcessingFormData {
  userId: string;
  month: string;
  totalHours: number;
  rolloverHours: number;
  surplusHours: number;
  surplusAction: "paid" | "banked";
}
