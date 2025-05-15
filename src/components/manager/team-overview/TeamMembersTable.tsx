import React, { useState } from "react";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMembersTableProps {
  members: User[];
  onMemberSelect?: (user: User) => void;
  setUserToArchive?: (userId: string) => void;
  setUserToRestore?: (userId: string) => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({ 
  members, 
  onMemberSelect,
  setUserToArchive,
  setUserToRestore 
}) => {
  // Keep track of images that failed to load
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle image loading error
  const handleImageError = (userId: string) => {
    setFailedImages(prev => ({
      ...prev,
      [userId]: true
    }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Member</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-t hover:bg-gray-50 cursor-pointer"
              onClick={() => onMemberSelect?.(member)}
            >
              <td className="px-4 py-2">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    {!failedImages[member.id] && member.avatarUrl && (
                      <AvatarImage
                        src={member.avatarUrl}
                        alt={member.name}
                        onError={() => handleImageError(member.id)}
                      />
                    )}
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                </div>
              </td>
              <td className="px-4 py-2">{member.role}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    member.status === "active"
                      ? "bg-green-100 text-green-800"
                      : member.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {member.status || "unknown"}
                </span>
              </td>
              <td className="px-4 py-2 text-right">
                {member.status === "active" && setUserToArchive && (
                  <button 
                    className="text-amber-500 hover:text-amber-700 mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToArchive(member.id);
                    }}
                  >
                    Archive
                  </button>
                )}
                {member.status === "archived" && setUserToRestore && (
                  <button 
                    className="text-green-500 hover:text-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToRestore(member.id);
                    }}
                  >
                    Restore
                  </button>
                )}
                {!member.status && (
                  <button className="text-blue-500 hover:text-blue-700">
                    View
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamMembersTable;
