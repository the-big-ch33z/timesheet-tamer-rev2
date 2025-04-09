
import React, { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { TimeEntry } from "@/types";
import UserInfo from "@/components/timesheet/UserInfo";
import TimesheetEntryDetail from "@/components/timesheet/TimesheetEntryDetail";
import { initializeHolidays } from "@/lib/holidays";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import TimesheetTabs from "@/components/timesheet/TimesheetTabs";
import FloatingActionButton from "@/components/timesheet/FloatingActionButton";
import { useParams, Navigate } from "react-router-dom";
import { useRolePermission } from "@/hooks/useRolePermission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Timesheet = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("timesheet");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const { userId } = useParams<{ userId: string }>();
  const { currentUser, getUserById, users } = useAuth();
  const { toast } = useToast();
  const { isAdmin, isManager } = useRolePermission();
  const isViewingOtherUser = userId && userId !== currentUser?.id;
  const viewedUser = userId ? getUserById(userId) : currentUser;
  
  // Check permission to view this timesheet
  const canViewTimesheet = !isViewingOtherUser || isAdmin() || isManager();
  
  useEffect(() => {
    initializeHolidays();
  }, []);

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
    // If viewing another user's timesheet, filter by that userId
    if (!viewedUser) return entries;
    return entries.filter(entry => entry.userId === viewedUser.id);
  };

  const getDayEntries = (day: Date) => {
    const userEntries = getUserEntries();
    return userEntries.filter(
      (entry) =>
        format(entry.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  // If user doesn't have permission, redirect to their own timesheet
  if (isViewingOtherUser && !canViewTimesheet) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to view this timesheet",
      variant: "destructive",
    });
    return <Navigate to="/timesheet" replace />;
  }

  // User not found
  if (userId && !viewedUser) {
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

  return (
    <div className="container py-6 max-w-7xl">
      {/* Back button when viewing other user's timesheet */}
      {isViewingOtherUser && (
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
            Viewing {viewedUser?.name}'s Timesheet
          </h2>
        </div>
      )}

      <UserInfo user={viewedUser} />

      <TimesheetTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        entries={getUserEntries()}
        currentMonth={currentMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onDayClick={handleDayClick}
      />

      {selectedDay && activeTab === "timesheet" && (
        <div className="mb-8">
          <TimesheetEntryDetail 
            date={selectedDay}
            entries={getDayEntries(selectedDay)}
            onAddEntry={() => {}}
            onDeleteEntry={deleteEntry}
            readOnly={isViewingOtherUser}  // Make read-only when viewing another user's timesheet
          />
        </div>
      )}

      {/* Only show FloatingActionButton if not in read-only mode */}
      {!isViewingOtherUser && (
        <FloatingActionButton onClick={() => setSelectedDay(new Date())} />
      )}
    </div>
  );
};

export default Timesheet;
