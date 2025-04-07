
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
  AlertTriangle,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
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
  role: "all" | "manager" | "admin";
};

const navItems: NavItem[] = [
  {
    title: "Timesheet",
    href: "/timesheet",
    icon: <Clock className="h-5 w-5" />,
    role: "all",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <FileText className="h-5 w-5" />,
    role: "all",
  },
  {
    title: "Team Calendar",
    href: "/team-calendar",
    icon: <Calendar className="h-5 w-5" />,
    role: "all",
  },
  {
    title: "Team Management",
    href: "/manager",
    icon: <Users className="h-5 w-5" />,
    role: "manager",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    role: "all",
  },
  {
    title: "Admin",
    href: "/admin",
    icon: <ShieldAlert className="h-5 w-5" />,
    role: "admin",
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
            <Link to="/timesheet" className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-brand-600" />
              <span className="font-bold text-xl text-brand-800">TimeFlow</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems
                .filter(item => 
                  item.role === "all" || 
                  (item.role === "manager" && (userRole === "manager" || userRole === "admin")) ||
                  (item.role === "admin" && userRole === "admin")
                )
                .map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted",
                      location.pathname === item.href
                        ? "text-brand-700 bg-brand-50"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Pending Timesheets
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-1 h-9 flex items-center gap-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block text-sm font-normal">
                    John Doe
                  </span>
                  <ChevronDown className="h-4 w-4" />
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
