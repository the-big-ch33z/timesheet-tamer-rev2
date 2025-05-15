
import React, { useState } from "react";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface UserInfoProps {
  user: User;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  const [imageError, setImageError] = useState(false);

  // Generate initials from user name for avatar fallback
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          {!imageError && user.avatarUrl && (
            <AvatarImage 
              src={user.avatarUrl} 
              alt={user.name}
              onError={() => setImageError(true)}
            />
          )}
          <AvatarFallback>
            {getUserInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>
      </div>
    </Card>
  );
};

export default UserInfo;
