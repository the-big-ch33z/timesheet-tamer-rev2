
import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import TimeEntryDialog from "@/components/timesheet/TimeEntryDialog";
import TimeEntryList from "@/components/timesheet/TimeEntryList";
import { TimeEntry } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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

  // Holiday days (sample data)
  const holidays = [
    "2025-04-18",
    "2025-04-21",
    "2025-04-25"
  ];

  const isHoliday = (day: Date) => {
    return holidays.includes(format(day, "yyyy-MM-dd"));
  };

  return (
    <div className="container py-6 max-w-7xl">
      {/* User info section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-indigo-600 mb-3">aidan hart</h1>
        <div className="bg-gray-50 p-4 rounded-md">
          <span className="text-lg">aidan hart</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timesheet" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          <TabsTrigger value="toil">TOIL</TabsTrigger>
          <TabsTrigger value="dta">DTA</TabsTrigger>
          <TabsTrigger value="recent">Recent Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="timesheet" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between bg-white">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-medium">
                        {format(currentMonth, "MMMM yyyy")}
                      </h2>
                      <Button variant="outline" size="icon">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 border-b">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                      <div
                        key={day}
                        className={`p-2 text-center text-sm font-medium ${
                          i === 0 || i === 6 ? "text-red-500" : "text-gray-700"
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-white p-4 border min-h-[80px]" />
                    ))}

                    {daysInMonth.map((day) => {
                      const dayEntries = getDayEntries(day);
                      const totalHours = getTotalHours(day);
                      const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                      const hasEntries = dayEntries.length > 0;
                      const dayHoliday = isHoliday(day);
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      
                      return (
                        <div
                          key={day.toString()}
                          className={`p-2 min-h-[80px] border cursor-pointer hover:bg-gray-50 ${
                            isToday ? "border-indigo-500" : ""
                          } ${
                            dayHoliday ? "bg-amber-50" : ""
                          } ${
                            day.getDay() === 0 ? "border-l-2 border-l-red-100" : ""
                          } ${
                            day.getDay() === 6 ? "border-r-2 border-r-red-100" : ""
                          }`}
                          onClick={() => handleDayClick(day)}
                        >
                          <div className="flex justify-between items-start">
                            <span
                              className={`inline-block w-6 h-6 text-center ${
                                isToday
                                  ? "bg-indigo-500 text-white rounded-full"
                                  : isWeekend ? "text-red-500" : ""
                              }`}
                            >
                              {format(day, "d")}
                            </span>
                            {hasEntries && (
                              <span className="text-xs font-medium text-indigo-700">{totalHours}h</span>
                            )}
                          </div>
                          {hasEntries && (
                            <div className="mt-1">
                              {dayEntries.slice(0, 1).map((entry) => (
                                <div
                                  key={entry.id}
                                  className="text-xs p-1 mb-1 bg-indigo-100 rounded truncate"
                                >
                                  {entry.project} ({entry.hours}h)
                                </div>
                              ))}
                              {dayEntries.length > 1 && (
                                <div className="text-xs text-indigo-600">
                                  +{dayEntries.length - 1} more
                                </div>
                              )}
                            </div>
                          )}
                          {dayHoliday && (
                            <div className="text-xs text-amber-700 mt-1">
                              Holiday
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* TOIL Summary Section */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold text-indigo-600 mb-4">TOIL Summary</h3>
                  
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-indigo-600">0.0</div>
                      <div className="text-sm text-gray-500">hours</div>
                      <div className="text-sm">Earned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-500">0.0</div>
                      <div className="text-sm text-gray-500">hours</div>
                      <div className="text-sm">Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-500">0.0</div>
                      <div className="text-sm text-gray-500">hours</div>
                      <div className="text-sm">Remaining</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Balance</div>
                    <Progress value={50} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4">Monthly Hours</h3>
                  
                  <div className="text-4xl font-bold mb-1">
                    0.0 <span className="text-lg text-gray-500">/ 159.6 hrs</span>
                  </div>
                  
                  <div className="text-right mb-2">0%</div>
                  
                  <Progress value={0} className="h-2 mb-4" />
                  
                  <div className="text-sm text-gray-500">
                    159.6 hours remaining to meet target
                  </div>
                  <div className="text-sm text-gray-500">
                    Based on 19.9 work days this month
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="toil">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-xl font-medium mb-2">TOIL Records</h3>
            <p className="text-gray-500 mb-4">View and manage your Time Off In Lieu records</p>
          </div>
        </TabsContent>

        <TabsContent value="dta">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h3 className="text-xl font-medium mb-2">DTA Records</h3>
            <p className="text-gray-500 mb-4">View and manage your DTA records</p>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="bg-gray-50 p-8 rounded-lg">
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
