
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, FileText, Users } from "lucide-react";

interface StatisticsCardsProps {
  activeEmployeesCount: number;
  totalToilHours: number;
  pendingApprovalsCount: number;
  totalBankedLeave: number;
  teamsCount: number;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  activeEmployeesCount,
  totalToilHours,
  pendingApprovalsCount,
  totalBankedLeave,
  teamsCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Employees</p>
              <h2 className="text-3xl font-bold">{activeEmployeesCount}</h2>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-full">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total TOIL Hours</p>
              <h2 className="text-3xl font-bold">{totalToilHours.toFixed(1)}</h2>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-full">
              <FileText className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <h2 className="text-3xl font-bold">{pendingApprovalsCount}</h2>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Banked Leave</p>
              <h2 className="text-3xl font-bold">{totalBankedLeave.toFixed(1)}</h2>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teams</p>
              <h2 className="text-3xl font-bold">{teamsCount}</h2>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
