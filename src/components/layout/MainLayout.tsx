
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { useAuth } from '@/contexts/auth';

type MainLayoutProps = {
  children?: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Get user role from auth context
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || "team-member";
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header userRole={userRole} />
      
      <div className="container py-3">
        <Navigation userRole={userRole} />
      </div>
      
      <main className="flex-1 bg-muted/30">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;
