
import React from "react";
import UserInfo from "@/components/timesheet/UserInfo";
import TimesheetEntryDetail from "@/components/timesheet/TimesheetEntryDetail";
import TimesheetTabs from "@/components/timesheet/TimesheetTabs";
import FloatingActionButton from "@/components/timesheet/FloatingActionButton";
import TimesheetBackNavigation from "@/components/timesheet/navigation/TimesheetBackNavigation";
import TimesheetNotFound from "@/components/timesheet/navigation/TimesheetNotFound";
import { useTimesheet } from "@/hooks/useTimesheet";

const Timesheet = () => {
  const {
    currentMonth,
    selectedDay,
    activeTab,
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
            onAddEntry={() => {}}
            onDeleteEntry={deleteEntry}
            readOnly={isViewingOtherUser}
            workSchedule={userWorkSchedule}
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
