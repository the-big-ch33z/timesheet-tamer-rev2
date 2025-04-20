
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog } from "@/components/ui/dialog";
import { ScheduleSelector } from "./schedule/ScheduleSelector";
import { WeekConfiguration } from "./schedule/WeekConfiguration";
import { CreateScheduleDialog } from "./schedule/CreateScheduleDialog";
import { useScheduleState } from "./schedule/useScheduleState";
import { Badge } from "@/components/ui/badge";
import { calculateFortnightHoursFromSchedule } from "@/utils/time/scheduleUtils";

const WorkScheduleSettings: React.FC = () => {
  const {
    activeWeek,
    setActiveWeek,
    showCreateScheduleDialog,
    setShowCreateScheduleDialog,
    schedules,
    selectedScheduleId,
    editingSchedule,
    weekDays,
    handleScheduleChange,
    handleNameChange,
    handleCreateSchedule,
    saveSchedule,
    handleDeleteSchedule,
    updateWorkDay,
    updateWorkHours,
    toggleRdoDay,
    toggleBreak
  } = useScheduleState();
  
  // Calculate fortnight hours based on the current editing schedule
  const [fortnightHours, setFortnightHours] = useState(0);
  
  // Update fortnight hours whenever the schedule changes
  useEffect(() => {
    if (editingSchedule) {
      const hours = calculateFortnightHoursFromSchedule(editingSchedule);
      setFortnightHours(hours);
    }
  }, [editingSchedule]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Work Schedules</CardTitle>
          <CardDescription>
            Configure work schedules for your organization
          </CardDescription>
        </div>
        <Dialog open={showCreateScheduleDialog} onOpenChange={setShowCreateScheduleDialog}>
          <CreateScheduleDialog
            open={showCreateScheduleDialog}
            onOpenChange={setShowCreateScheduleDialog}
            onCreateSchedule={handleCreateSchedule}
          />
          <Button onClick={() => setShowCreateScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Schedule
          </Button>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <ScheduleSelector
              schedules={schedules}
              selectedScheduleId={selectedScheduleId}
              editingSchedule={editingSchedule}
              onScheduleChange={handleScheduleChange}
              onNameChange={handleNameChange}
            />
            
            {/* Display the calculated fortnight hours */}
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Fortnight Hours:</span>
              <Badge variant="outline" className="text-sm font-medium">
                {fortnightHours} hours
              </Badge>
            </div>
          </div>

          <Separator />

          <WeekConfiguration
            weekDays={weekDays}
            activeWeek={activeWeek}
            setActiveWeek={setActiveWeek}
            editingSchedule={editingSchedule}
            updateWorkDay={updateWorkDay}
            updateWorkHours={updateWorkHours}
            toggleRdoDay={toggleRdoDay}
            toggleBreak={toggleBreak}
          />

          <div className="flex justify-between pt-4">
            {!editingSchedule.isDefault && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteSchedule}
                disabled={editingSchedule.isDefault}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Schedule
              </Button>
            )}
            <Button onClick={saveSchedule}>
              <Save className="h-4 w-4 mr-1" /> Save Schedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkScheduleSettings;
