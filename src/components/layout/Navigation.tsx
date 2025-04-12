
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  FileText,
  Settings,
  ShieldAlert,
  Users,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type UserRole = "admin" | "manager" | "team-member";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  role: "all" | UserRole[];
  variant?: "default" | "accent";
};

interface NavigationProps {
  userRole: UserRole;
}

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
    role: ["admin", "manager"],
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
    role: ["admin"],
    variant: "accent",
  },
];

const actionItems = [
  {
    title: "Export",
    icon: <Download className="h-5 w-5" />,
    action: () => console.log("Export clicked"),
  },
  {
    title: "Import",
    icon: <Upload className="h-5 w-5" />,
    action: () => console.log("Import clicked"),
  },
];

const Navigation: React.FC<NavigationProps> = ({ userRole }) => {
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-4">
      <div className="hidden md:flex items-center gap-2">
        {navItems
          .filter(item => 
            item.role === "all" || 
            (Array.isArray(item.role) && item.role.includes(userRole))
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
      </div>
      
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
    </nav>
  );
};

export default Navigation;
