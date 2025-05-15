
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/auth";

interface HeaderProps {
  userRole: string;
}

const Header: React.FC<HeaderProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const { currentUser, logout } = useAuth();
  
  // Get user initials for the avatar fallback
  const userInitials = currentUser?.name 
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : 'U';
  
  const handleSignOut = () => {
    // Handle sign out logic using auth context
    logout();
    navigate("/");
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-30">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link to="/timesheet" className="flex items-center gap-2 text-brand-600">
            <Clock className="h-6 w-6" />
            <span className="font-bold text-xl">Timesheet Tamer</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="p-1 h-9 flex items-center gap-2"
              >
                <Avatar className="h-7 w-7">
                  {!imageError && (
                    <AvatarImage 
                      src={currentUser?.avatarUrl || ""} 
                      alt="User avatar"
                      onError={() => setImageError(true)} 
                    />
                  )}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-normal">
                  {currentUser?.name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserRound className="h-4 w-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
