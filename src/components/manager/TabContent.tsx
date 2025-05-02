
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import TeamsList from "./TeamsList";
import ToilApprovalSection from "./ToilApprovalSection";

const TabContent: React.FC = () => {
  return (
    <>
      <TabsContent value="teams">
        <TeamsList />
      </TabsContent>
      <TabsContent value="toil-approvals">
        <ToilApprovalSection />
      </TabsContent>
      <TabsContent value="dta-report">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-medium mb-4">DTA Approval Report</h2>
          <p className="text-muted-foreground">No DTA approvals pending.</p>
        </div>
      </TabsContent>
    </>
  );
};

export default TabContent;
