
import React, { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import TimeEntryDialog from "@/components/timesheet/TimeEntryDialog";
import TimeEntryList from "@/components/timesheet/TimeEntryList";
import { TimeEntry } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserInfo from "@/components/timesheet/UserInfo";
import TabContent from "@/components/timesheet/TabContent";

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

        <TabContent 
          entries={entries}
          currentMonth={currentMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onDayClick={handleDayClick}
        />
      </Tabs>

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
