
import { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { TimeEntry, User } from "@/types";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { useWorkSchedule } from "@/contexts/work-schedule";
import { useUserMetrics } from "@/contexts/user-metrics";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useRolePermission } from "@/hooks/useRolePermission";
import { initializeHolidays } from "@/lib/holidays";

export const useTimesheet = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("timesheet");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  
  const { userId } = useParams<{ userId?: string }>();
  const { currentUser, getUserById, users } = useAuth();
  const { getUserMetrics } = useUserMetrics();
  const { toast } = useToast();
  const { isAdmin, isManager } = useRolePermission();
  const navigate = useNavigate();
  const { getUserSchedule } = useWorkSchedule();
  
  // If no userId is provided or it's 'me', use the current user's ID
  const targetUserId = (!userId || userId === 'me') ? currentUser?.id : userId;
  
  // Check if we're viewing another user's timesheet
  const isViewingOtherUser = targetUserId && targetUserId !== currentUser?.id;
  
  // Get the user we're viewing (could be current user or another user)
  // Using users dependency to force re-fetch when users array changes
  const viewedUser = targetUserId ? getUserById(targetUserId) : currentUser;
  
  // Add dependency on users array to ensure we get fresh data when it changes
  useEffect(() => {
    if (targetUserId) {
      console.log("Users data changed, refreshing viewed user");
    }
  }, [users, targetUserId]);
  
  // Log the viewedUser to debug
  useEffect(() => {
    console.log("Current viewed user data:", viewedUser);
    
    // Also log user metrics for debugging
    if (viewedUser) {
      const metrics = getUserMetrics(viewedUser.id);
      console.log("User metrics:", metrics);
    }
  }, [viewedUser, getUserMetrics]);
  
  // Get the user's work schedule
  const userWorkSchedule = viewedUser ? getUserSchedule(viewedUser.id) : undefined;
  
  // Check permission to view this timesheet
  const canViewTimesheet = !isViewingOtherUser || isAdmin() || isManager();

  // Initialize holidays
  useEffect(() => {
    initializeHolidays();
  }, []);

  // Redirect to personal timesheet if trying to access a non-existent 'me' route
  useEffect(() => {
    if (userId === 'me' && currentUser) {
      navigate('/timesheet', { replace: true });
    }
  }, [userId, currentUser, navigate]);

  // Load entries from localStorage
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('timeEntries');
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
        setEntries(parsedEntries);
      }
    } catch (error) {
      console.error("Error loading entries:", error);
    }
  }, []);

  // Listen for new entries added
  useEffect(() => {
    const handleEntryAdded = (event: any) => {
      const newEntry = event.detail;
      if (newEntry) {
        setEntries(prev => [...prev, newEntry]);
      }
    };
    
    document.addEventListener('entry-added', handleEntryAdded);
    
    return () => {
      document.removeEventListener('entry-added', handleEntryAdded);
    };
  }, []);

  // Save entries to localStorage when they change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('timeEntries', JSON.stringify(entries));
    }
  }, [entries]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
    
    toast({
      title: "Entry deleted",
      description: "Time entry has been removed",
    });
  };

  const getUserEntries = () => {
    // If no viewed user is found, return empty array
    if (!viewedUser) return [];
    
    // Return entries for the viewed user
    return entries.filter(entry => entry.userId === viewedUser.id);
  };

  const getDayEntries = (day: Date) => {
    const userEntries = getUserEntries();
    return userEntries.filter(
      (entry) =>
        format(entry.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  return {
    currentMonth,
    selectedDay,
    activeTab,
    entries,
    targetUserId,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    userWorkSchedule,
    setActiveTab,
    prevMonth,
    nextMonth,
    handleDayClick,
    deleteEntry,
    getUserEntries,
    getDayEntries,
    setSelectedDay
  };
};
