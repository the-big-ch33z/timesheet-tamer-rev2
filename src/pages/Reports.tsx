
import React from "react";
import { useReportsData } from "@/hooks/reports/useReportsData";
import { ReportsSummaryCards } from "@/components/reports/ReportsSummaryCards";
import { WeeklySummaryChart } from "@/components/reports/WeeklySummaryChart";
import { ProjectDistributionChart } from "@/components/reports/ProjectDistributionChart";

const Reports: React.FC = () => {
  console.debug("[Reports] Rendering Reports page");
  
  const reportsData = useReportsData();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Reports</h1>

      <ReportsSummaryCards data={reportsData} />
      <WeeklySummaryChart data={reportsData} />
      <ProjectDistributionChart data={reportsData} />
    </div>
  );
};

export default Reports;
