
import React, { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { User, Team } from "@/types";
import { useAuth } from "@/contexts/auth";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/common/ErrorBoundary";

type ScheduleEntry = {
  date: Date;
  status: "Completed" | "RDO" | "PublicHoliday" | "Sick" | "TOIL" | "None";
  details?: string;
};

type MemberSchedule = {
  member: User;
  schedule: Record<string, ScheduleEntry>; // Using date string as key for faster lookups
};

type TeamWithMembers = {
  team: Team;
  members: MemberSchedule[];
};

// Status color mapping
const statusColorMap: Record<ScheduleEntry["status"], string> = {
  Completed: "bg-green-200 border-green-500",
  RDO: "bg-blue-100 border-blue-500",
  PublicHoliday: "bg-amber-100 border-amber-500",
  Sick: "bg-red-100 border-red-500",
  TOIL: "bg-purple-100 border-purple-500",
  None: "bg-transparent"
};

// Status label mapping
const statusLabelMap: Record<ScheduleEntry["status"], string> = {
  Completed: "Completed Entry",
  RDO: "Rostered Day Off",
  PublicHoliday: "Public Holiday",
  Sick: "Sick Day",
  TOIL: "Time Off in Lieu",
  None: "No Entry"
};

// Status emoji mapping
const statusEmojiMap: Record<ScheduleEntry["status"], string> = {
  Completed: "✅",
  RDO: "📅",
  PublicHoliday: "🇦🇺",
  Sick: "💤",
  TOIL: "🟣",
  None: "⬜"
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
};

// Generate schedule data for real users from auth context
const generateScheduleData = (
  teams: Team[],
  getUsersByTeam: (teamId: string) => User[],
  month: Date,
  includeArchived: boolean
): TeamWithMembers[] => {
  try {
    // Get all days in the month
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Helper function to select random status based on weights
    const getRandomStatus = (): ScheduleEntry["status"] => {
      const statusOptions: {value: ScheduleEntry["status"], weight: number}[] = [
        { value: "Completed", weight: 20 },
        { value: "RDO", weight: 3 },
        { value: "PublicHoliday", weight: 1 },
        { value: "Sick", weight: 2 },
        { value: "TOIL", weight: 2 },
        { value: "None", weight: 5 }
      ];
      
      const totalWeight = statusOptions.reduce((acc, option) => acc + option.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const option of statusOptions) {
        if (random < option.weight) return option.value;
        random -= option.weight;
      }
      
      return "None";
    };
    
    // Generate team data with members and their schedules
    return teams.map(team => {
      try {
        // Get real team members from auth context
        const teamMembers = getUsersByTeam(team.id);
        
        // Filter members based on status if needed
        const filteredMembers = includeArchived 
          ? teamMembers 
          : teamMembers.filter(member => member.status !== "archived");
        
        const membersWithSchedules: MemberSchedule[] = filteredMembers.map(member => {
          // Generate schedule for this member
          const schedule: Record<string, ScheduleEntry> = {};
          
          daysInMonth.forEach(day => {
            // Weekend days more likely to be empty
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const dateKey = format(day, "yyyy-MM-dd");

            // Public holidays (let's say 1st and 25th are holidays)
            const isHoliday = day.getDate() === 1 || day.getDate() === 25;

            let status: ScheduleEntry["status"];
            
            if (isHoliday) {
              status = "PublicHoliday";
            } else if (isWeekend) {
              status = Math.random() > 0.8 ? getRandomStatus() : "None";
            } else {
              status = getRandomStatus();
            }
            
            schedule[dateKey] = {
              date: day,
              status,
              details: `${status} on ${format(day, "MMM d")}`
            };
          });
          
          return {
            member,
            schedule
          };
        });
        
        return {
          team,
          members: membersWithSchedules
        };
      } catch (err) {
        console.error(`Error processing team ${team.id}:`, err);
        // Return team with empty members as fallback
        return {
          team,
          members: []
        };
      }
    });
  } catch (err) {
    console.error("Error in generateScheduleData:", err);
    return [];
  }
};

const MonthNavigationHeader = ({ 
  currentMonth, 
  onPrevMonth, 
  onNextMonth, 
  onToday,
  showArchived,
  onToggleArchived
}: { 
  currentMonth: Date; 
  onPrevMonth: () => void; 
  onNextMonth: () => void; 
  onToday: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
}) => (
  <div className="flex justify-between items-center mb-6">
    <Button variant="outline" onClick={onPrevMonth}>
      <ChevronLeft className="h-4 w-4 mr-2" /> Previous Month
    </Button>
    
    <div className="flex items-center space-x-2">
      <Button variant="secondary" onClick={onToday}>
        Today
      </Button>
      <h2 className="text-lg font-medium">
        {format(currentMonth, "MMMM yyyy")}
      </h2>
    </div>
    
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="show-archived"
          checked={showArchived}
          onCheckedChange={onToggleArchived}
        />
        <label htmlFor="show-archived" className="text-sm cursor-pointer select-none">
          Show Archived Members
        </label>
      </div>
      <Button variant="outline" onClick={onNextMonth}>
        Next Month <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  </div>
);

const StatusLegend = () => (
  <div className="flex flex-wrap gap-3 mb-6 text-xs">
    {Object.entries(statusLabelMap).map(([status, label]) => (
      <div key={status} className="flex items-center">
        <div className={`w-3 h-3 rounded ${statusColorMap[status as ScheduleEntry["status"]]} mr-1`}></div>
        <span>{statusEmojiMap[status as ScheduleEntry["status"]]} {label}</span>
      </div>
    ))}
  </div>
);

interface DayCellProps {
  day: Date;
  entry?: ScheduleEntry;
  isToday: boolean;
}

const DayCell: React.FC<DayCellProps> = ({ day, entry, isToday }) => {
  const status = entry?.status || "None";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`
              w-10 h-10 flex flex-col items-center justify-center border 
              ${isToday ? 'border-brand-600' : 'border-gray-200'} 
              ${statusColorMap[status]} 
              text-xs relative
            `}
          >
            <span className="font-medium">{format(day, "d")}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{format(day, "EEEE, MMMM d")}</p>
          <p>{statusLabelMap[status]}</p>
          {entry?.details && <p className="text-xs mt-1">{entry.details}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface TeamSectionProps {
  teamWithMembers: TeamWithMembers;
  daysInMonth: Date[];
  today: Date;
}

const TeamSection: React.FC<TeamSectionProps> = ({ teamWithMembers, daysInMonth, today }) => {
  const { team, members } = teamWithMembers;
  
  if (members.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-brand-700">{team.name}</h3>
        <div className="border rounded-lg p-8 flex flex-col items-center justify-center text-center">
          <Users className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">No active team members to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-brand-700">{team.name}</h3>
      <div className="border rounded-lg overflow-hidden">
        {members.map((memberSchedule) => (
          <div 
            key={memberSchedule.member.id}
            className="flex border-b last:border-b-0"
          >
            <div className="w-48 p-4 bg-gray-50 border-r flex items-center space-x-3 sticky left-0 z-10">
              <Avatar>
                <AvatarImage src={memberSchedule.member.avatarUrl} />
                <AvatarFallback>{getInitials(memberSchedule.member.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="font-medium">
                  {memberSchedule.member.name}
                  {memberSchedule.member.status === "archived" && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                      Archived
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {memberSchedule.member.role}
                </div>
              </div>
            </div>
            <div className="flex">
              {daysInMonth.map(day => {
                const dateKey = format(day, "yyyy-MM-dd");
                const entry = memberSchedule.schedule[dateKey];
                const isToday = isSameDay(day, today);
                
                return (
                  <DayCell 
                    key={dateKey} 
                    day={day} 
                    entry={entry}
                    isToday={isToday}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading state component for the calendar
const CalendarLoadingState = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-10 w-40" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    
    <Skeleton className="h-8 w-full mb-6" />
    
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {[1, 2].map((teamIndex) => (
            <div key={teamIndex} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                {[1, 2, 3].map((memberIndex) => (
                  <Skeleton key={memberIndex} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Error fallback component
const CalendarErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <Card className="p-6 text-center">
    <h2 className="text-xl font-medium mb-4 text-red-600">Calendar Error</h2>
    <p className="mb-4">There was a problem loading the team calendar.</p>
    <p className="text-sm text-gray-600 mb-4">{error.message}</p>
    <Button onClick={resetErrorBoundary}>Try Again</Button>
  </Card>
);

const TeamCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { teams, getUsersByTeam, isAuthenticated } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Set loading to false after initial render
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const resetToday = () => setCurrentMonth(new Date());
  const toggleArchived = () => setShowArchived(!showArchived);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Generate schedule data from actual teams/members in auth context
  // Use defensive programming to handle potential errors
  const teamsWithSchedules = useMemo(() => {
    try {
      if (!teams || teams.length === 0) {
        console.log("No teams available");
        return [];
      }
      
      if (!getUsersByTeam) {
        console.error("getUsersByTeam function not available");
        return [];
      }
      
      return generateScheduleData(teams, getUsersByTeam, currentMonth, showArchived);
    } catch (error) {
      console.error("Error generating schedule data:", error);
      return [];
    }
  }, [teams, getUsersByTeam, currentMonth, showArchived]);

  // If authentication is still loading, show loading state
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-brand-800 mb-6">Team Monthly Calendar</h1>
        <CalendarLoadingState />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-brand-800 mb-6">Team Monthly Calendar</h1>
        <Card className="p-8 text-center">
          <p className="mb-4">Please login to view team calendars.</p>
          <Button onClick={() => window.location.href = '/login'}>Login</Button>
        </Card>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-brand-800 mb-6">Team Monthly Calendar</h1>
        <Card className="p-8 text-center">
          <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">No Teams Available</h2>
          <p className="text-muted-foreground mb-4">There are no teams created yet or you don't have access to any teams.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Team Monthly Calendar</h1>
      
      <MonthNavigationHeader 
        currentMonth={currentMonth}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onToday={resetToday}
        showArchived={showArchived}
        onToggleArchived={toggleArchived}
      />
      
      <StatusLegend />
      
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <ScrollArea className="w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Month header */}
              <div className="flex">
                <div className="w-48 p-4 bg-brand-100 border-r font-semibold sticky left-0 z-20">
                  Team Member
                </div>
                <div className="flex bg-brand-50">
                  {daysInMonth.map(day => (
                    <div 
                      key={day.toString()} 
                      className={`
                        w-10 h-10 flex flex-col items-center justify-center border-r border-b text-center 
                        ${isSameDay(day, today) ? 'bg-brand-100 font-semibold' : ''}
                      `}
                    >
                      <div className="text-xs font-medium">{format(day, "EEE")}</div>
                      <div className="text-xs">{format(day, "d")}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Teams and members */}
              {teamsWithSchedules.length > 0 ? (
                teamsWithSchedules.map((teamData) => (
                  <TeamSection 
                    key={teamData.team.id}
                    teamWithMembers={teamData}
                    daysInMonth={daysInMonth}
                    today={today}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No team data available to display</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Wrap the component in an error boundary to catch rendering errors
const TeamCalendarWithErrorBoundary = () => (
  <ErrorBoundary fallbackComponent={CalendarErrorFallback}>
    <TeamCalendar />
  </ErrorBoundary>
);

export default TeamCalendarWithErrorBoundary;
