
import React, { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
};

type TeamEvent = {
  id: string;
  memberId: string;
  title: string;
  startHour: number;
  duration: number;
  date: Date;
  project: string;
  color: string;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

const TEAM_MEMBERS: TeamMember[] = [
  { id: "1", name: "John Doe", role: "Frontend Developer", avatar: "" },
  { id: "2", name: "Jane Smith", role: "UX Designer", avatar: "" },
  { id: "3", name: "Michael Brown", role: "Project Manager", avatar: "" },
  { id: "4", name: "Sarah Wilson", role: "Backend Developer", avatar: "" },
];

const TEAM_EVENTS: TeamEvent[] = [
  {
    id: "1",
    memberId: "1",
    title: "Website Frontend",
    startHour: 9,
    duration: 4,
    date: new Date(),
    project: "Website Redesign",
    color: "bg-blue-200 border-blue-500",
  },
  {
    id: "2",
    memberId: "2",
    title: "UX Research",
    startHour: 10,
    duration: 3,
    date: new Date(),
    project: "Mobile App",
    color: "bg-purple-200 border-purple-500",
  },
  {
    id: "3",
    memberId: "3",
    title: "Team Meeting",
    startHour: 14,
    duration: 1,
    date: new Date(),
    project: "All Projects",
    color: "bg-amber-200 border-amber-500",
  },
  {
    id: "4",
    memberId: "4",
    title: "API Development",
    startHour: 12,
    duration: 5,
    date: new Date(),
    project: "Backend Services",
    color: "bg-emerald-200 border-emerald-500",
  },
];

const TeamCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const today = () => setCurrentWeek(new Date());

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const getEventsForMemberAndDay = (memberId: string, date: Date) => {
    return TEAM_EVENTS.filter(
      (event) =>
        event.memberId === memberId &&
        format(event.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Team Calendar</h1>
      
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Previous Week
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={today}>
            Today
          </Button>
          <h2 className="text-lg font-medium">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </h2>
        </div>
        
        <Button variant="outline" onClick={nextWeek}>
          Next Week <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-brand-50">
            <div className="p-4 border-b border-r border-brand-200 font-medium">
              Team Member
            </div>
            {daysOfWeek.map((day) => {
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              
              return (
                <div
                  key={day.toString()}
                  className={`p-2 text-center border-b border-r border-brand-200 ${
                    isToday ? "bg-brand-100" : ""
                  }`}
                >
                  <div className="font-medium">{format(day, "EEE")}</div>
                  <div className={`text-sm ${isToday ? "font-medium text-brand-600" : "text-muted-foreground"}`}>
                    {format(day, "MMM d")}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div>
            {TEAM_MEMBERS.map((member, memberIndex) => (
              <div key={member.id} className="grid grid-cols-[200px_repeat(7,1fr)]">
                <div className={`p-4 border-b border-r border-brand-200 ${
                  memberIndex % 2 === 0 ? "bg-white" : "bg-brand-50"
                }`}>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.role}
                      </div>
                    </div>
                  </div>
                </div>
                
                {daysOfWeek.map((day) => {
                  const events = getEventsForMemberAndDay(member.id, day);
                  
                  return (
                    <div
                      key={day.toString()}
                      className={`border-b border-r border-brand-200 relative min-h-[100px] ${
                        memberIndex % 2 === 0 ? "bg-white" : "bg-brand-50"
                      }`}
                    >
                      {events.map((event) => {
                        const topPosition = (event.startHour - 8) * 25;
                        const height = event.duration * 25;
                        
                        return (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 ${event.color} p-1 rounded border-l-2 text-xs overflow-hidden`}
                            style={{
                              top: `${topPosition}px`,
                              height: `${height}px`,
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="truncate">{event.project}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCalendar;
