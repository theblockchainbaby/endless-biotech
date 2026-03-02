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
  const [generatingCSV, setGeneratingCSV] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const generateCSV = async () => {
    setGeneratingCSV(true);
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
      setGeneratingCSV(false);
    }
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const res = await fetch(`/api/reports/pdf?type=${reportType}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vitros-${reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF report downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const reportDescriptions: Record<ReportType, string> = {
    vessels: "Complete vessel inventory with cultivar, stage, status, health, and location data.",
    activity: "Full audit trail of all vessel operations with timestamps and user attribution.",
    production: "Summary of active vessels, pipeline stages, cultivar breakdown, and key metrics.",
    contamination: "Contamination breakdown by type and cultivar over the past quarter.",
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Reports"
        description="Generate and download reports as CSV or PDF"
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

          <p className="text-sm text-muted-foreground">{reportDescriptions[reportType]}</p>

          <div className="flex gap-2">
            <Button onClick={generateCSV} disabled={generatingCSV} variant="outline" className="flex-1">
              {generatingCSV ? "Generating..." : "Download CSV"}
            </Button>
            <Button onClick={generatePDF} disabled={generatingPDF} className="flex-1">
              {generatingPDF ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Download</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ReportOption
              title="Vessel Report"
              description="Complete vessel inventory with all metadata"
              onCSV={() => { setReportType("vessels"); generateCSV(); }}
              onPDF={() => { setReportType("vessels"); generatePDF(); }}
            />
            <ReportOption
              title="Activity Log"
              description="Full audit trail of all vessel operations"
              onCSV={() => { setReportType("activity"); generateCSV(); }}
              onPDF={() => { setReportType("activity"); generatePDF(); }}
            />
            <ReportOption
              title="Production Summary"
              description="KPIs, pipeline stages, and cultivar metrics"
              onCSV={() => { setReportType("production"); generateCSV(); }}
              onPDF={() => { setReportType("production"); generatePDF(); }}
            />
            <ReportOption
              title="Contamination Report"
              description="Contamination rates by type and cultivar"
              onCSV={() => { setReportType("contamination"); generateCSV(); }}
              onPDF={() => { setReportType("contamination"); generatePDF(); }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportOption({
  title,
  description,
  onCSV,
  onPDF,
}: {
  title: string;
  description: string;
  onCSV: () => void;
  onPDF: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md border">
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-1.5 shrink-0 ml-3">
        <button
          onClick={onCSV}
          className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
        >
          CSV
        </button>
        <button
          onClick={onPDF}
          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          PDF
        </button>
      </div>
    </div>
  );
}
