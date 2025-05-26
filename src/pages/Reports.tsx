
import React from "react";
import { useReportsData } from "@/hooks/reports/useReportsData";
import { ReportsSummaryCards } from "@/components/reports/ReportsSummaryCards";
// TEMPORARILY DISABLED FOR TESTING - Chart components
// import { WeeklySummaryChart } from "@/components/reports/WeeklySummaryChart";
// import { ProjectDistributionChart } from "@/components/reports/ProjectDistributionChart";

const Reports: React.FC = () => {
  console.debug("[Reports] Rendering Reports page");
  
  const reportsData = useReportsData();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-brand-800 mb-6">Reports</h1>

      <ReportsSummaryCards data={reportsData} />
      
      {/* TEMPORARILY DISABLED FOR TESTING - WeeklySummaryChart */}
      <div className="mb-8 p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Weekly Summary Chart</h3>
        <p className="text-gray-500">Chart temporarily disabled for testing</p>
      </div>

      {/* TEMPORARILY DISABLED FOR TESTING - ProjectDistributionChart */}
      <div className="p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Project Distribution Chart</h3>
        <p className="text-gray-500">Chart temporarily disabled for testing</p>
      </div>
    </div>
  );
};

export default Reports;
