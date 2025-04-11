
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DialogTrigger } from "@/components/ui/dialog";
import { ScheduleSelector } from "./schedule/ScheduleSelector";
import { WeekConfiguration } from "./schedule/WeekConfiguration";
import { CreateScheduleDialog } from "./schedule/CreateScheduleDialog";
import { useScheduleState } from "./schedule/useScheduleState";

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
    toggleRdoDay
  } = useScheduleState();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Work Schedules</CardTitle>
          <CardDescription>
            Configure work schedules for your organization
          </CardDescription>
        </div>
        <CreateScheduleDialog
          open={showCreateScheduleDialog}
          onOpenChange={setShowCreateScheduleDialog}
          onCreateSchedule={handleCreateSchedule}
        />
        <DialogTrigger asChild>
          <Button onClick={() => setShowCreateScheduleDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Schedule
          </Button>
        </DialogTrigger>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ScheduleSelector
            schedules={schedules}
            selectedScheduleId={selectedScheduleId}
            editingSchedule={editingSchedule}
            onScheduleChange={handleScheduleChange}
            onNameChange={handleNameChange}
          />

          <Separator />

          <WeekConfiguration
            weekDays={weekDays}
            activeWeek={activeWeek}
            setActiveWeek={setActiveWeek}
            editingSchedule={editingSchedule}
            updateWorkDay={updateWorkDay}
            updateWorkHours={updateWorkHours}
            toggleRdoDay={toggleRdoDay}
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
