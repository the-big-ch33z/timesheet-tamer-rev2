
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, Settings as SettingsIcon, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useRolePermission } from "@/hooks/useRolePermission";

const Settings = () => {
  const { toast } = useToast();
  const { isAdminOrManager } = useRolePermission();
  
  const saveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully",
    });
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Settings</h1>
      
      {/* Admin/Manager Quick Links */}
      {isAdminOrManager && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mb-8">
          <Link to="/schedule-settings">
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer">
              <CardContent className="flex items-center p-6">
                <div className="bg-brand-100 p-3 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-brand-800" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">Work Schedule Settings</h3>
                  <p className="text-muted-foreground">Manage work schedules and user assignments</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          {/* Additional quick links can be added here */}
        </div>
      )}
      
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how you receive notifications from the timesheet system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Email Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Timesheet Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders when timesheets are due
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Timesheet Approvals</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your timesheet is approved or rejected
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Team Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Updates when team members are added or removed
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">In-App Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dashboard Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications on the dashboard
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sound Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Play sound when notifications arrive
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks on your devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more content with reduced spacing
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Appearance</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timesheets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Settings</CardTitle>
              <CardDescription>
                Configure how timesheets work for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Calendar View</Label>
                <Select defaultValue="monthly">
                  <SelectTrigger>
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>First Day of Week</Label>
                <Select defaultValue="monday">
                  <SelectTrigger>
                    <SelectValue placeholder="Select first day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Working Hours Format</Label>
                <Select defaultValue="decimal">
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="decimal">Decimal (8.5h)</SelectItem>
                    <SelectItem value="hours-minutes">Hours and Minutes (8h 30m)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="bg-brand-100">Mon</Button>
                  <Button variant="outline" className="bg-brand-100">Tue</Button>
                  <Button variant="outline" className="bg-brand-100">Wed</Button>
                  <Button variant="outline" className="bg-brand-100">Thu</Button>
                  <Button variant="outline" className="bg-brand-100">Fri</Button>
                  <Button variant="outline">Sat</Button>
                  <Button variant="outline">Sun</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-fill Working Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically fill standard working hours for new entries
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveSettings}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
