
import React from "react";
import UserInfo from "@/components/timesheet/UserInfo";
import TimesheetEntryDetail from "@/components/timesheet/TimesheetEntryDetail";
import TimesheetTabs from "@/components/timesheet/TimesheetTabs";
import FloatingActionButton from "@/components/timesheet/FloatingActionButton";
import TimesheetBackNavigation from "@/components/timesheet/navigation/TimesheetBackNavigation";
import TimesheetNotFound from "@/components/timesheet/navigation/TimesheetNotFound";
import { useTimesheet } from "@/hooks/useTimesheet";
import { useToast } from "@/hooks/use-toast";
import { TimeEntry } from "@/types";
import { useRolePermission } from "@/hooks/useRolePermission";

const Timesheet = () => {
  const { toast } = useToast();
  const { isAdmin, isManager } = useRolePermission();
  const {
    currentMonth,
    selectedDay,
    activeTab,
    isViewingOtherUser,
    viewedUser,
    canViewTimesheet,
    userWorkSchedule,
    targetUserId,
    setActiveTab,
    prevMonth,
    nextMonth,
    handleDayClick,
    deleteEntry,
    getUserEntries,
    getDayEntries,
    setSelectedDay,
    addEntry
  } = useTimesheet();

  // Check for permission or if user exists
  if (!viewedUser || !canViewTimesheet) {
    return (
      <TimesheetNotFound 
        userExists={!!viewedUser} 
        canViewTimesheet={canViewTimesheet} 
      />
    );
  }

  // Check if current user can edit this timesheet
  const canEditTimesheet = !isViewingOtherUser || isAdmin() || isManager();

  const handleDeleteEntry = (id: string) => {
    deleteEntry(id);
    toast({
      title: "Entry deleted",
      description: "Time entry has been removed successfully",
    });
  };

  const handleAddEntry = (entry: TimeEntry) => {
    addEntry(entry);
    toast({
      title: "Entry added",
      description: "Time entry has been added successfully",
    });
    
    // We're not changing selectedDay after adding an entry
    // This ensures the form stays open for adding multiple entries
  };

  return (
    <div className="container py-6 max-w-7xl">
      {/* Back button when viewing other user's timesheet */}
      <TimesheetBackNavigation 
        user={viewedUser}
        isViewingOtherUser={isViewingOtherUser}
      />

      <UserInfo user={viewedUser} />

      <TimesheetTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        entries={getUserEntries()}
        currentMonth={currentMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onDayClick={handleDayClick}
        workSchedule={userWorkSchedule}
        user={viewedUser}
      />

      {selectedDay && activeTab === "timesheet" && (
        <div className="mb-8">
          <TimesheetEntryDetail 
            date={selectedDay}
            entries={getDayEntries(selectedDay)}
            onAddEntry={handleAddEntry}
            onDeleteEntry={handleDeleteEntry}
            readOnly={!canEditTimesheet}
            workSchedule={userWorkSchedule}
            userId={targetUserId}
          />
        </div>
      )}

      {/* Only show FloatingActionButton if user can edit this timesheet */}
      {canEditTimesheet && (
        <FloatingActionButton onClick={() => setSelectedDay(new Date())} />
      )}
    </div>
  );
};

export default Timesheet;
