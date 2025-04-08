
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import TeamsList from "@/components/manager/TeamsList";
import TeamOverview from "@/components/manager/TeamOverview";
import { Team, User } from "@/types";

interface TabContentProps {
  activeTab: string;
  filteredTeams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string) => void;
  selectedTeam: Team | null;
  manager: User | null;
  teamMembers: User[];
  onRefreshData: () => void;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  filteredTeams,
  selectedTeamId,
  setSelectedTeamId,
  selectedTeam,
  manager,
  teamMembers,
  onRefreshData
}) => {
  return (
    <>
      <TabsContent value="team-overview">
        <TeamOverview
          teams={filteredTeams}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          selectedTeam={selectedTeam}
          manager={manager}
          teamMembers={teamMembers}
          onRefreshData={onRefreshData}
        />
      </TabsContent>
      
      <TabsContent value="teams">
        <TeamsList />
      </TabsContent>
      
      <TabsContent value="toil-report">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-6">TOIL Approval Report</h2>
          <p className="text-muted-foreground">
            This section would display Time Off In Lieu (TOIL) approvals and reports.
          </p>
        </div>
      </TabsContent>
      
      <TabsContent value="dta-report">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-6">DTA Approval Report</h2>
          <p className="text-muted-foreground">
            This section would display DTA approvals and reports.
          </p>
        </div>
      </TabsContent>
    </>
  );
};

export default TabContent;
