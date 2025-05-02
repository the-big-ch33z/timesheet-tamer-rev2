
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import TeamsList from "./TeamsList";
import TeamOverview from "./team-overview";
import ToilApprovalSection from "./ToilApprovalSection";

const TabContent: React.FC = () => {
  return (
    <>
      <TabsContent value="teams">
        <TeamsList />
      </TabsContent>
      <TabsContent value="team-overview">
        <TeamOverview />
      </TabsContent>
      <TabsContent value="toil-approvals">
        <ToilApprovalSection />
      </TabsContent>
    </>
  );
};

export default TabContent;
