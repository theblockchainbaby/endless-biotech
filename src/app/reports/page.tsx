"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { exportToCSV, flattenVesselForExport, flattenActivityForExport } from "@/lib/csv-export";
import { toast } from "sonner";

type ReportType = "vessels" | "activity" | "production" | "contamination";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("vessels");
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      switch (reportType) {
        case "vessels": {
          const res = await fetch("/api/vessels?limit=10000");
          const data = await res.json();
          const rows = (data.vessels || []).map((v: Record<string, unknown>) => flattenVesselForExport(v));
          exportToCSV(rows, `vessels-report-${new Date().toISOString().split("T")[0]}`);
          toast.success(`Exported ${rows.length} vessels`);
          break;
        }
        case "activity": {
          const res = await fetch("/api/activities?limit=10000");
          const data = await res.json();
          const activities = Array.isArray(data) ? data : data.activities || [];
          const rows = activities.map((a: Record<string, unknown>) => flattenActivityForExport(a));
          exportToCSV(rows, `activity-report-${new Date().toISOString().split("T")[0]}`);
          toast.success(`Exported ${rows.length} activities`);
          break;
        }
        case "production": {
          const [statsRes, analyticsRes] = await Promise.all([
            fetch("/api/stats"),
            fetch("/api/stats/analytics?period=month"),
          ]);
          const stats = await statsRes.json();
          const analytics = await analyticsRes.json();

          const rows = [
            { metric: "Active Vessels", value: stats.activeVessels },
            { metric: "Total Vessels", value: stats.totalVessels },
            { metric: "Total Explants", value: stats.totalExplants },
            { metric: "Contamination Rate (%)", value: analytics.contaminationRate },
            { metric: "Multiplication Rate (%)", value: analytics.multiplicationRate },
            ...(stats.vesselsByStage || []).map((s: { stage: string; count: number }) => ({
              metric: `Stage: ${s.stage}`,
              value: s.count,
            })),
            ...(stats.vesselsByCultivar || []).map((c: { cultivarName: string; vesselCount: number; explantCount: number }) => ({
              metric: `Cultivar: ${c.cultivarName}`,
              value: `${c.vesselCount} vessels / ${c.explantCount} explants`,
            })),
          ];
          exportToCSV(rows, `production-summary-${new Date().toISOString().split("T")[0]}`);
          toast.success("Production summary exported");
          break;
        }
        case "contamination": {
          const analyticsRes = await fetch("/api/stats/analytics?period=quarter");
          const analytics = await analyticsRes.json();

          const rows = [
            { category: "Overall Contamination Rate", detail: "", count: `${analytics.contaminationRate}%` },
            ...analytics.contaminationByType.map((c: { type: string; count: number }) => ({
              category: "By Type",
              detail: c.type,
              count: c.count,
            })),
            ...analytics.contaminationByCultivar.map((c: { cultivar: string; count: number }) => ({
              category: "By Cultivar",
              detail: c.cultivar,
              count: c.count,
            })),
          ];
          exportToCSV(rows, `contamination-report-${new Date().toISOString().split("T")[0]}`);
          toast.success("Contamination report exported");
          break;
        }
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Reports"
        description="Generate and download reports"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vessels">Vessel Report</SelectItem>
                <SelectItem value="activity">Activity Log</SelectItem>
                <SelectItem value="production">Production Summary</SelectItem>
                <SelectItem value="contamination">Contamination Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            {reportType === "vessels" && "Export all vessels with cultivar, stage, status, health, and location data."}
            {reportType === "activity" && "Export the complete activity log with vessel references and timestamps."}
            {reportType === "production" && "Summary of active vessels, pipeline stages, cultivar breakdown, and key metrics."}
            {reportType === "contamination" && "Contamination breakdown by type and cultivar over the past quarter."}
          </div>

          <Button onClick={generateReport} disabled={generating} className="w-full">
            {generating ? "Generating..." : "Download CSV Report"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportOption
              title="Vessel Report"
              description="Complete vessel inventory with all metadata"
              onClick={() => { setReportType("vessels"); generateReport(); }}
            />
            <ReportOption
              title="Activity Log"
              description="Full audit trail of all vessel operations"
              onClick={() => { setReportType("activity"); generateReport(); }}
            />
            <ReportOption
              title="Production Summary"
              description="KPIs, pipeline stages, and cultivar metrics"
              onClick={() => { setReportType("production"); generateReport(); }}
            />
            <ReportOption
              title="Contamination Report"
              description="Contamination rates by type and cultivar"
              onClick={() => { setReportType("contamination"); generateReport(); }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportOption({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-md border hover:bg-accent/50 transition-colors flex items-center justify-between"
    >
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">CSV</span>
    </button>
  );
}
