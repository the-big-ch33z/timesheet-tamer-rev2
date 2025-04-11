
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useRolePermission } from "@/hooks/useRolePermission";
import { User } from "@/types";
import { useLogger } from "../useLogger";

export const useTimesheetContext = () => {
  const [activeTab, setActiveTab] = useState<string>("timesheet");
  
  const { userId } = useParams<{ userId?: string }>();
  const { currentUser, getUserById, users } = useAuth();
  const { getUserSchedule } = useWorkSchedule();
  const { isAdmin, isManager } = useRolePermission();
  const navigate = useNavigate();
  const logger = useLogger("TimesheetContext");
  
  // If no userId is provided or it's 'me', use the current user's ID
  const targetUserId = (!userId || userId === 'me') ? currentUser?.id : userId;
  
  // Check if we're viewing another user's timesheet
  const isViewingOtherUser = targetUserId && targetUserId !== currentUser?.id;
  
  // Get the user we're viewing (could be current user or another user)
  const viewedUser: User | undefined = targetUserId ? getUserById(targetUserId) : currentUser;
  
  // Log the viewedUser to debug
  if (viewedUser) {
    logger.debug("Current viewed user data:", viewedUser);
  } else {
    logger.warn("No viewed user found", { targetUserId });
  }
  
  // Get the user's work schedule
  const userWorkSchedule = viewedUser ? getUserSchedule(viewedUser.id) : undefined;
  
  // Check permission to view this timesheet
  const canViewTimesheet = !isViewingOtherUser || isAdmin() || isManager();

  // Redirect to personal timesheet if trying to access a non-existent 'me' route
  if (userId === 'me' && currentUser) {
    logger.debug("Redirecting from 'me' route to personal timesheet");
    navigate('/timesheet', { replace: true });
  }

  return {
    activeTab,
    targetUserId,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    userWorkSchedule,
    setActiveTab
  };
};
