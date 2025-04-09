
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Team, User } from "@/types";
import TeamOverview from "./TeamOverview";
import TeamsList from "./TeamsList";

interface TabContentProps {
  activeTab: string;
  filteredTeams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string) => void;
  selectedTeam: Team | null;
  manager: User | null;
  teamMembers: User[];
  onRefreshData: () => void;
  onEditUser?: (user: User) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  filteredTeams,
  selectedTeamId,
  setSelectedTeamId,
  selectedTeam,
  manager,
  teamMembers,
  onRefreshData,
  onEditUser,
}) => {
  return (
    <>
      <TabsContent value="team-overview" className="mt-6">
        <TeamOverview 
          teams={filteredTeams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          selectedTeam={selectedTeam}
          manager={manager}
          teamMembers={teamMembers}
          onRefreshData={onRefreshData}
          onEditUser={onEditUser}
        />
      </TabsContent>
      
      <TabsContent value="teams" className="mt-6">
        <TeamsList 
          teams={filteredTeams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
        />
      </TabsContent>
      
      <TabsContent value="toil-report" className="mt-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-4">TOIL Approval Report</h2>
          <p className="text-muted-foreground">No pending TOIL approvals.</p>
        </div>
      </TabsContent>
      
      <TabsContent value="dta-report" className="mt-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-4">DTA Approval Report</h2>
          <p className="text-muted-foreground">No pending DTA approvals.</p>
        </div>
      </TabsContent>
    </>
  );
};

export default TabContent;
