
import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import TimeEntryDialog from "@/components/timesheet/TimeEntryDialog";
import TimeEntryList from "@/components/timesheet/TimeEntryList";
import { TimeEntry } from "@/types";

const Timesheet = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([
    {
      id: "1",
      date: new Date(),
      project: "Website Redesign",
      hours: 3.5,
      description: "Homepage layout updates",
    },
    {
      id: "2",
      date: new Date(),
      project: "Client Meeting",
      hours: 1.0,
      description: "Weekly progress review",
    },
  ]);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

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

  const getTotalHours = (day: Date) => {
    return getDayEntries(day).reduce((total, entry) => total + entry.hours, 0);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-800">Timesheet</h1>
        <Button 
          onClick={() => {
            setSelectedDay(new Date());
            setIsEntryDialogOpen(true);
          }}
          className="bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Time Entry
        </Button>
      </div>

      <Card className="border-brand-200">
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between bg-brand-50 border-b border-brand-200">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-medium text-brand-800">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 bg-brand-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-brand-700"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-brand-200">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[100px]" />
            ))}

            {daysInMonth.map((day) => {
              const dayEntries = getDayEntries(day);
              const totalHours = getTotalHours(day);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              const hasEntries = dayEntries.length > 0;
              
              return (
                <div
                  key={day.toString()}
                  className={`bg-white p-2 min-h-[100px] border hover:bg-brand-50 transition-colors cursor-pointer ${
                    isToday ? "border-brand-500" : "border-transparent"
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isToday
                          ? "bg-brand-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {hasEntries && (
                      <span className="text-xs font-medium text-brand-700">{totalHours}h</span>
                    )}
                  </div>
                  {hasEntries && (
                    <div className="mt-1">
                      {dayEntries.slice(0, 2).map((entry) => (
                        <div
                          key={entry.id}
                          className="text-xs p-1 mb-1 bg-brand-100 rounded truncate"
                        >
                          {entry.project} ({entry.hours}h)
                        </div>
                      ))}
                      {dayEntries.length > 2 && (
                        <div className="text-xs text-brand-600">
                          +{dayEntries.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedDay)} onOpenChange={(open) => !open && setSelectedDay(null)}>
        {selectedDay && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Entries for {format(selectedDay, "MMMM d, yyyy")}
              </DialogTitle>
            </DialogHeader>
            <TimeEntryList 
              entries={getDayEntries(selectedDay)}
              onAddEntry={() => {
                setIsEntryDialogOpen(true);
              }}
            />
          </DialogContent>
        )}
      </Dialog>

      <TimeEntryDialog
        open={isEntryDialogOpen}
        onOpenChange={setIsEntryDialogOpen}
        onSave={addEntry}
        selectedDate={selectedDay || new Date()}
      />
    </div>
  );
};

export default Timesheet;
