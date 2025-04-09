
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth/AuthProvider";
import { User } from "@/types";

interface UserInfoProps {
  user?: User | null;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  const { currentUser } = useAuth();
  const displayUser = user || currentUser;
  
  if (!displayUser) return null;
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{displayUser.name}</h1>
            <p className="text-muted-foreground">{displayUser.email}</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <Tabs defaultValue="timesheet" className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="timesheet" className="text-xs md:text-sm">
                  Current Week
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs md:text-sm">
                  Month View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfo;
