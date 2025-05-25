
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

interface AuthProps {
  mode?: "login" | "signup";
}

const Auth: React.FC<AuthProps> = ({
  mode = "login"
}) => {
  const {
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already authenticated, redirect to timesheet
    if (isAuthenticated) {
      navigate('/timesheet');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-brand-50 to-brand-100">
      <div className="w-full max-w-md p-4">
        <Card className="border border-brand-200 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/b5e6a92a-abec-4f69-a13f-62b69b5f96dc.png" 
                alt="Lieu - Time management made simple" 
                className="max-w-full h-auto max-h-32 object-contain"
              />
            </div>
            <CardDescription className="text-center">Manage your time efficiently across all devices</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={mode} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignupForm />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="text-sm text-center text-muted-foreground">
            <p className="w-full">Protected by Lieu &copy; {new Date().getFullYear()}</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
