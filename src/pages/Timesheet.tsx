
import React, { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import TimeEntryDialog from "@/components/timesheet/TimeEntryDialog";
import TimeEntryList from "@/components/timesheet/TimeEntryList";
import { TimeEntry } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import UserInfo from "@/components/timesheet/UserInfo";
import TimesheetCalendar from "@/components/timesheet/TimesheetCalendar";
import TimesheetEntryDetail from "@/components/timesheet/TimesheetEntryDetail";
import ToilSummary from "@/components/timesheet/ToilSummary";
import MonthlyHours from "@/components/timesheet/MonthlyHours";

const Timesheet = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>("timesheet");
  const [entries, setEntries] = useState<TimeEntry[]>([
    {
      id: "1",
      date: new Date(),
      project: "Website Redesign",
      hours: 3.5,
      description: "Homepage layout updates",
      startTime: "09:00",
      endTime: "12:30",
    },
    {
      id: "2",
      date: new Date(),
      project: "Client Meeting",
      hours: 1.0,
      description: "Weekly progress review",
      startTime: "14:00",
      endTime: "15:00",
    },
  ]);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  const addEntry = (entry: Omit<TimeEntry, "id">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    
    setEntries([...entries, newEntry]);
    setIsEntryDialogOpen(false);
  };

  const getDayEntries = (day: Date) => {
    return entries.filter(
      (entry) =>
        format(entry.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
  };

  const recentEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  return (
    <div className="container py-6 max-w-7xl">
      <UserInfo />

      {/* Tabs */}
      <Tabs defaultValue="timesheet" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          <TabsTrigger value="toil">TOIL</TabsTrigger>
          <TabsTrigger value="dta">DTA</TabsTrigger>
          <TabsTrigger value="recent">Recent Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="timesheet">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <TimesheetCalendar 
                currentMonth={currentMonth}
                entries={entries}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onDayClick={handleDayClick}
              />
            </div>

            <div className="space-y-6">
              <ToilSummary />
              <MonthlyHours />
            </div>
          </div>

          {/* Selected day entry detail - always visible when a day is selected */}
          {selectedDay && (
            <div className="mb-8">
              <TimesheetEntryDetail 
                date={selectedDay}
                entries={getDayEntries(selectedDay)}
                onAddEntry={() => setIsEntryDialogOpen(true)}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="toil">
          <div className="bg-gray-50 p-8 rounded-lg text-center mb-8">
            <h3 className="text-xl font-medium mb-2">TOIL Records</h3>
            <p className="text-gray-500 mb-4">View and manage your Time Off In Lieu records</p>
          </div>
        </TabsContent>

        <TabsContent value="dta">
          <div className="bg-gray-50 p-8 rounded-lg text-center mb-8">
            <h3 className="text-xl font-medium mb-2">DTA Records</h3>
            <p className="text-gray-500 mb-4">View and manage your DTA records</p>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="bg-gray-50 p-8 rounded-lg mb-8">
            <h3 className="text-xl font-medium mb-4">Recent Time Entries</h3>
            <div className="space-y-4">
              {entries.slice(0, 5).map(entry => (
                <div key={entry.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{entry.project}</span>
                    <span>{format(entry.date, "MMM dd, yyyy")}</span>
                  </div>
                  <p className="text-sm text-gray-600">{entry.description}</p>
                  <div className="text-right text-sm font-medium mt-2">{entry.hours} hours</div>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-gray-500">No recent entries</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Entries Section - Always visible at bottom regardless of tab */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-medium mb-4">Recent Time Entries</h3>
        <div className="space-y-3">
          {recentEntries.map(entry => (
            <div key={entry.id} className="p-3 bg-white rounded-lg border border-gray-100 flex justify-between items-center">
              <div>
                <div className="font-medium">{entry.project}</div>
                <div className="text-sm text-gray-600 mt-1">{format(entry.date, "MMM dd, yyyy")} · {entry.description}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{entry.hours} hours</div>
                {entry.startTime && entry.endTime && (
                  <div className="text-xs text-gray-500 mt-1">{entry.startTime} - {entry.endTime}</div>
                )}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent entries</p>
          )}
        </div>
      </div>

      <TimeEntryDialog
        open={isEntryDialogOpen}
        onOpenChange={setIsEntryDialogOpen}
        onSave={addEntry}
        selectedDate={selectedDay || new Date()}
      />

      {/* Floating action button */}
      <Button 
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-indigo-600 hover:bg-indigo-700"
        onClick={() => {
          setSelectedDay(new Date());
          setIsEntryDialogOpen(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Timesheet;
