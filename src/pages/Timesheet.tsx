
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

const Timesheet = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("timesheet");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
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
    if (!currentUser) return entries;
    return entries.filter(entry => entry.userId === currentUser.id);
  };

  const getDayEntries = (day: Date) => {
    const userEntries = getUserEntries();
    return userEntries.filter(
      (entry) =>
        format(entry.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  const recentEntries = getUserEntries()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="container py-6 max-w-7xl">
      <UserInfo />

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
          />
        </div>
      )}

      <FloatingActionButton onClick={() => setSelectedDay(new Date())} />
    </div>
  );
};

export default Timesheet;
