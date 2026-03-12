"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Download } from "lucide-react";
import { generateForecast, type ForecastPoint } from "@/lib/forecasting";
import { STAGE_LABELS } from "@/lib/constants";
import type { DashboardStats } from "@/lib/types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STAGE_COLORS: Record<string, string> = {
  initiation: "#3b82f6",
  multiplication: "#22c55e",
  rooting: "#f59e0b",
  acclimation: "#a855f7",
  hardening: "#14b8a6",
};

export default function ForecastingPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [weeks, setWeeks] = useState("8");
  const [multRate, setMultRate] = useState("3.0");
  const [lossRate, setLossRate] = useState("0.05");
  const [advanceRate, setAdvanceRate] = useState("0.7");
  const [subcultureWeeks, setSubcultureWeeks] = useState("2");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  useEffect(() => {
    if (!stats?.vesselsByStage) return;

    const currentByStage: Record<string, number> = {};
    stats.vesselsByStage.forEach((s) => {
      currentByStage[s.stage] = s.count;
    });

    const result = generateForecast({
      currentByStage,
      multiplicationRate: parseFloat(multRate) || 3,
      subcultureIntervalWeeks: parseInt(subcultureWeeks) || 2,
      lossRate: parseFloat(lossRate) || 0.05,
      advanceRate: parseFloat(advanceRate) || 0.7,
      weeksToForecast: parseInt(weeks) || 8,
    });

    setForecast(result);
  }, [stats, weeks, multRate, lossRate, advanceRate, subcultureWeeks]);

  const finalPoint = forecast[forecast.length - 1];

  function handleExportCSV() {
    if (forecast.length === 0) return;
    const header = "Week,Date,Initiation,Multiplication,Rooting,Acclimation,Hardening,Total";
    const rows = forecast.map((p) =>
      [p.week, p.date, p.initiation, p.multiplication, p.rooting, p.acclimation, p.hardening, p.total].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Production Forecasting"
          description="Project vessel counts by stage over time"
        />
        {forecast.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="size-4 mr-1.5" /> Export CSV
          </Button>
        )}
      </div>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Forecast Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label>Weeks Ahead</Label>
              <Select value={weeks} onValueChange={setWeeks}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 weeks</SelectItem>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                  <SelectItem value="20">20 weeks (5 mo)</SelectItem>
                  <SelectItem value="30">30 weeks (7 mo)</SelectItem>
                  <SelectItem value="44">44 weeks (10 mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mult. Rate</Label>
              <Input type="number" step="0.1" value={multRate} onChange={(e) => setMultRate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Loss Rate (%)</Label>
              <Input type="number" step="0.01" value={lossRate} onChange={(e) => setLossRate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Advance Rate</Label>
              <Input type="number" step="0.1" value={advanceRate} onChange={(e) => setAdvanceRate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Subculture (wks)</Label>
              <Input type="number" value={subcultureWeeks} onChange={(e) => setSubcultureWeeks(e.target.value)} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Projected Vessel Counts
              {finalPoint && (
                <span className="text-muted-foreground font-normal ml-2">
                  (Week {finalPoint.week}: {finalPoint.total.toLocaleString()} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value, name) => [
                    Number(value).toLocaleString(),
                    STAGE_LABELS[name as string] || name,
                  ]}
                />
                <Legend formatter={(value) => STAGE_LABELS[value] || value} />
                <Area type="monotone" dataKey="initiation" stackId="1" stroke={STAGE_COLORS.initiation} fill={STAGE_COLORS.initiation} fillOpacity={0.6} />
                <Area type="monotone" dataKey="multiplication" stackId="1" stroke={STAGE_COLORS.multiplication} fill={STAGE_COLORS.multiplication} fillOpacity={0.6} />
                <Area type="monotone" dataKey="rooting" stackId="1" stroke={STAGE_COLORS.rooting} fill={STAGE_COLORS.rooting} fillOpacity={0.6} />
                <Area type="monotone" dataKey="acclimation" stackId="1" stroke={STAGE_COLORS.acclimation} fill={STAGE_COLORS.acclimation} fillOpacity={0.6} />
                <Area type="monotone" dataKey="hardening" stackId="1" stroke={STAGE_COLORS.hardening} fill={STAGE_COLORS.hardening} fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Week-by-week breakdown */}
      {forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Week-by-Week Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Week</th>
                    <th className="text-left py-2 pr-4">Date</th>
                    {Object.keys(STAGE_LABELS).map((s) => (
                      <th key={s} className="text-right py-2 px-2">{STAGE_LABELS[s]}</th>
                    ))}
                    <th className="text-right py-2 pl-4 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((p) => (
                    <tr key={p.week} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono">{p.week}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{p.date.slice(5)}</td>
                      <td className="text-right py-2 px-2 font-mono">{p.initiation}</td>
                      <td className="text-right py-2 px-2 font-mono">{p.multiplication}</td>
                      <td className="text-right py-2 px-2 font-mono">{p.rooting}</td>
                      <td className="text-right py-2 px-2 font-mono">{p.acclimation}</td>
                      <td className="text-right py-2 px-2 font-mono">{p.hardening}</td>
                      <td className="text-right py-2 pl-4 font-mono font-bold">{p.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
