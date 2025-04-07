
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import {
  Calendar,
  Clock,
  FileText,
  LogOut,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  Import,
  Export,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: React.ReactNode;
};

type UserRole = "admin" | "manager" | "team-member";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  role: "all" | UserRole;
  variant?: "default" | "accent";
};

const navItems: NavItem[] = [
  {
    title: "Timesheet",
    href: "/timesheet",
    icon: <Calendar className="h-5 w-5" />,
    role: "all",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <FileText className="h-5 w-5" />,
    role: "all",
  },
  {
    title: "Schedule",
    href: "/team-calendar",
    icon: <Calendar className="h-5 w-5" />,
    role: "all",
  },
  {
    title: "Manager",
    href: "/manager",
    icon: <Users className="h-5 w-5" />,
    role: "manager",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    role: "all",
    variant: "accent",
  },
  {
    title: "Admin",
    href: "/admin",
    icon: <ShieldAlert className="h-5 w-5" />,
    role: "admin",
    variant: "accent",
  },
];

const actionItems = [
  {
    title: "Export",
    icon: <Export className="h-5 w-5" />,
    action: () => console.log("Export clicked"),
  },
  {
    title: "Import",
    icon: <Import className="h-5 w-5" />,
    action: () => console.log("Import clicked"),
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mock user role - in a real app, this would come from auth context
  const userRole: UserRole = "admin"; // can be "admin", "manager", or "team-member"
  
  const handleSignOut = () => {
    // Handle sign out logic
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/timesheet" className="flex items-center gap-2 text-brand-600">
              <Clock className="h-6 w-6" />
              <span className="font-bold text-xl">Timesheet Tamer</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-2">
              {navItems
                .filter(item => 
                  item.role === "all" || 
                  item.role === userRole
                )
                .map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md",
                      location.pathname === item.href
                        ? "text-brand-600 font-bold"
                        : "text-muted-foreground hover:text-foreground",
                      item.variant === "accent" && 
                        (location.pathname === item.href 
                          ? "bg-gray-900 text-white" 
                          : "bg-gray-100 hover:bg-gray-200")
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              {actionItems.map((item, index) => (
                <Button 
                  key={index} 
                  variant="ghost" 
                  size="sm" 
                  onClick={item.action}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Button>
              ))}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-1 h-9 flex items-center gap-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="" />
                    <AvatarFallback>AH</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm font-normal">
                    AH
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
      
      <main className="flex-1 bg-muted/30">{children}</main>
      
      <footer className="border-t py-4 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 TimeFlow. All rights reserved.</p>
          <nav className="flex gap-4">
            <Link to="#" className="hover:underline">
              Terms
            </Link>
            <Link to="#" className="hover:underline">
              Privacy
            </Link>
            <Link to="#" className="hover:underline">
              Help
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
