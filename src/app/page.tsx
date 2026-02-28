"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StageBadge, HealthBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { STAGE_LABELS } from "@/lib/constants";
import { exportToCSV } from "@/lib/csv-export";
import { formatDistanceToNow } from "date-fns";
import type { DashboardStats } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, Legend,
} from "recharts";

const CONTAMINATION_COLORS = ["#ef4444", "#f97316", "#eab308", "#a855f7"];

interface AnalyticsData {
  period: string;
  contaminationRate: number;
  multiplicationRate: number;
  growthTrends: { date: string; created: number; multiplied: number; disposed: number; contaminated: number; stage_advanced: number }[];
  contaminationByType: { type: string; count: number }[];
  contaminationByCultivar: { cultivar: string; count: number }[];
  locationCapacity: { id: string; name: string; capacity: number; used: number; pct: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch(`/api/stats/analytics?period=${period}`).then((r) => r.json()),
    ])
      .then(([s, a]) => {
        setStats(s);
        setAnalytics(a);
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="VitrOS command center" />
      <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
    </div>
  );
  if (!stats) return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="VitrOS command center" />
      <div className="text-center py-12 text-muted-foreground">Failed to load stats</div>
    </div>
  );

  const stageData = (stats.vesselsByStage || []).map((s) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="VitrOS command center"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard title="Active Vessels" value={stats.activeVessels} />
        <KPICard title="Total Explants" value={stats.totalExplants} />
        <KPICard title="Total Vessels" value={stats.totalVessels} />
        <KPICard
          title="Contamination"
          value={`${analytics?.contaminationRate ?? 0}%`}
          alert={(analytics?.contaminationRate ?? 0) > 5}
        />
        <KPICard title="Cultivars" value={stats.vesselsByCultivar.length} />
      </div>

      {/* Subculture reminders */}
      {stats.subcultureDue && (stats.subcultureDue.overdue > 0 || stats.subcultureDue.today > 0) && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-900 dark:text-amber-200">
              Subculture Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm">
              {stats.subcultureDue.overdue > 0 && (
                <div className="text-red-600 dark:text-red-400 font-medium">
                  {stats.subcultureDue.overdue} overdue
                </div>
              )}
              {stats.subcultureDue.today > 0 && (
                <div className="text-amber-700 dark:text-amber-300 font-medium">
                  {stats.subcultureDue.today} due today
                </div>
              )}
              {stats.subcultureDue.thisWeek > 0 && (
                <div className="text-muted-foreground">
                  {stats.subcultureDue.thisWeek} this week
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts row 1: Pipeline + Growth Trends */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active vessels</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stageData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics?.growthTrends?.length ? (
              <p className="text-sm text-muted-foreground">No activity data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analytics.growthTrends} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(l) => `Date: ${l}`} />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#0d9488" fill="#0d9488" fillOpacity={0.6} name="Created" />
                  <Area type="monotone" dataKey="multiplied" stackId="1" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} name="Multiplied" />
                  <Area type="monotone" dataKey="stage_advanced" stackId="1" stroke="#5eead4" fill="#5eead4" fillOpacity={0.4} name="Advanced" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Contamination + Location Capacity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contamination Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics?.contaminationByType?.length ? (
              <p className="text-sm text-muted-foreground">No contamination recorded</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.contaminationByType}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name }) => name as string}
                    >
                      {analytics.contaminationByType.map((_, i) => (
                        <Cell key={i} fill={CONTAMINATION_COLORS[i % CONTAMINATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">By Cultivar</p>
                  {analytics.contaminationByCultivar.map((c) => (
                    <div key={c.cultivar} className="flex justify-between text-sm">
                      <span>{c.cultivar}</span>
                      <span className="font-mono text-red-500">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            {!analytics?.locationCapacity?.length ? (
              <p className="text-sm text-muted-foreground">No locations with capacity set</p>
            ) : (
              <div className="space-y-3">
                {analytics.locationCapacity.map((loc) => (
                  <div key={loc.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{loc.name}</span>
                      <span className={`font-mono ${loc.pct > 90 ? "text-red-500" : ""}`}>
                        {loc.used}/{loc.capacity} ({loc.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          loc.pct > 90 ? "bg-red-500" : loc.pct > 70 ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(loc.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Stage + Health + Cultivar breakdowns */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">By Stage</CardTitle></CardHeader>
          <CardContent>
            {!stats.vesselsByStage?.length ? (
              <p className="text-sm text-muted-foreground">No active vessels</p>
            ) : (
              <div className="space-y-3">
                {stats.vesselsByStage.map((s) => (
                  <div key={s.stage} className="flex items-center justify-between">
                    <StageBadge stage={s.stage} />
                    <span className="font-mono text-sm font-medium">{s.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Health Status</CardTitle></CardHeader>
          <CardContent>
            {stats.healthBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vessels yet</p>
            ) : (
              <div className="space-y-3">
                {stats.healthBreakdown.map((h) => (
                  <div key={h.status} className="flex items-center justify-between">
                    <HealthBadge status={h.status} />
                    <span className="font-mono text-sm font-medium">{h.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Cultivar</CardTitle></CardHeader>
          <CardContent>
            {stats.vesselsByCultivar.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cultivars yet</p>
            ) : (
              <div className="space-y-3">
                {stats.vesselsByCultivar.map((c) => (
                  <div key={c.cultivarId} className="flex items-center justify-between">
                    <span className="text-sm">{c.cultivarName}</span>
                    <div className="text-right">
                      <span className="font-mono text-sm">{c.vesselCount}</span>
                      <span className="text-muted-foreground text-xs ml-1">({c.explantCount})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ready to pull + Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {stats.readyToMultiply.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Ready to Pull ({stats.readyToMultiply.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.readyToMultiply.slice(0, 8).map((v) => (
                  <Link
                    key={v.id}
                    href={`/vessels/${v.id}`}
                    className="flex items-center justify-between p-2 rounded-md bg-background border hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <span className="font-mono text-sm font-medium">{v.barcode}</span>
                      <span className="text-sm text-muted-foreground ml-2">{v.cultivarName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={stats.readyToMultiply.length > 0 ? "" : "md:col-span-2"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <div className="flex gap-2 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const rows = stats.recentActivities.map((a) => ({
                      type: a.type,
                      vessel: a.vessel?.barcode ?? "",
                      user: a.user?.name ?? "",
                      notes: a.notes ?? "",
                      date: a.createdAt,
                    }));
                    exportToCSV(rows, "activity-export");
                  }}
                >
                  CSV
                </Button>
                <Link href="/activity" className="text-sm text-muted-foreground hover:underline">
                  View all
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivities.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {a.vessel && (
                        <Link href={`/vessels/${a.vessel.id}`} className="font-mono text-sm hover:underline">
                          {a.vessel.barcode}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {a.type.replace(/_/g, " ")}{a.user ? ` by ${a.user.name}` : ""}{a.notes ? ` — ${a.notes}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, alert }: { title: string; value: string | number; alert?: boolean }) {
  return (
    <Card className={alert ? "border-red-300 dark:border-red-800" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${alert ? "text-red-500" : ""}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </CardContent>
    </Card>
  );
}
