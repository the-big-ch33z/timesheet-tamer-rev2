
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

// Mock team data
const TEAMS: Team[] = [
  {
    id: "team-1",
    name: "Frontend Team",
    organizationId: "org-1",
    managerId: "3",
    description: "UI/UX and frontend development"
  },
  {
    id: "team-2",
    name: "Backend Team",
    organizationId: "org-1",
    managerId: "3",
    description: "API and database development"
  }
];

// Mock user data
const TEAM_MEMBERS: User[] = [
  { 
    id: "1", 
    name: "John Doe", 
    email: "john@example.com", 
    role: "team-member", 
    teamIds: ["team-1"],
    avatarUrl: "",
    status: "active" 
  },
  { 
    id: "2", 
    name: "Jane Smith", 
    email: "jane@example.com", 
    role: "team-member", 
    teamIds: ["team-1"],
    avatarUrl: "",
    status: "archived" 
  },
  { 
    id: "3", 
    name: "Michael Brown", 
    email: "michael@example.com", 
    role: "manager", 
    teamIds: ["team-1", "team-2"],
    avatarUrl: "",
    status: "active" 
  },
  { 
    id: "4", 
    name: "Sarah Wilson", 
    email: "sarah@example.com", 
    role: "team-member", 
    teamIds: ["team-2"],
    avatarUrl: "",
    status: "active" 
  },
  { 
    id: "5", 
    name: "Alex Johnson", 
    email: "alex@example.com", 
    role: "team-member", 
    teamIds: ["team-2"],
    avatarUrl: "",
    status: "active" 
  }
];

// Generate mock schedule data for demo purposes
const generateMockScheduleData = (
  teamMembers: User[],
  teams: Team[],
  month: Date,
  includeArchived: boolean
): TeamWithMembers[] => {
  // Get all days in the month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Filter members based on status if needed
  const filteredMembers = includeArchived 
    ? teamMembers 
    : teamMembers.filter(member => member.status !== "archived");
  
  // Status options with weighted probabilities
  const statusOptions: {value: ScheduleEntry["status"], weight: number}[] = [
    { value: "Completed", weight: 20 },
    { value: "RDO", weight: 3 },
    { value: "PublicHoliday", weight: 1 },
    { value: "Sick", weight: 2 },
    { value: "TOIL", weight: 2 },
    { value: "None", weight: 5 }
  ];
  
  // Helper function to select random status based on weights
  const getRandomStatus = (): ScheduleEntry["status"] => {
    const totalWeight = statusOptions.reduce((acc, option) => acc + option.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const option of statusOptions) {
      if (random < option.weight) return option.value;
      random -= option.weight;
    }
    
    return "None";
  };

  // Group members by team
  const teamMap: Record<string, User[]> = {};
  filteredMembers.forEach(member => {
    if (member.teamIds) {
      member.teamIds.forEach(teamId => {
        if (!teamMap[teamId]) teamMap[teamId] = [];
        teamMap[teamId].push(member);
      });
    }
  });
  
  // Generate team data with members and their schedules
  return teams.map(team => {
    const teamMembersList = teamMap[team.id] || [];
    
    const membersWithSchedules: MemberSchedule[] = teamMembersList.map(member => {
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
  });
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

const TeamCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const resetToday = () => setCurrentMonth(new Date());
  const toggleArchived = () => setShowArchived(!showArchived);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Generate mock data for calendar with archived filter
  const teamsWithSchedules = useMemo(() => 
    generateMockScheduleData(TEAM_MEMBERS, TEAMS, currentMonth, showArchived),
  [currentMonth, showArchived]);

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
              {teamsWithSchedules.map((teamData) => (
                <TeamSection 
                  key={teamData.team.id}
                  teamWithMembers={teamData}
                  daysInMonth={daysInMonth}
                  today={today}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCalendar;
