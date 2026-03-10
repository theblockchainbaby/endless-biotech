"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { STAGE_LABELS, HEALTH_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#16a34a", "#2563eb", "#7c3aed", "#d97706", "#dc2626", "#0891b2", "#be185d"];
const CONTAMINATION_COLORS = ["#ef4444", "#f97316", "#eab308", "#a855f7"];
const HEALTH_COLORS: Record<string, string> = {
  healthy: "#16a34a",
  stable: "#3b82f6",
  critical: "#ef4444",
  slow_growth: "#f59e0b",
  necrotic: "#6b7280",
  vitrified: "#8b5cf6",
  dead: "#1f2937",
};

interface AnalyticsData {
  period: string;
  startDate: string;
  endDate: string;
  totalActive: number;
  totalContaminated: number;
  contaminationRate: number;
  multiplicationRate: number;
  multiplicationEvents: number;
  totalCreated: number;
  productionTrends: { date: string; created: number; multiplied: number; disposed: number; contaminated: number; stage_advanced: number }[];
  contaminationTrend: { week: string; rate: number; count: number }[];
  cultivarPerformance: {
    id: string;
    name: string;
    totalVessels: number;
    activeVessels: number;
    contaminated: number;
    contaminationRate: number;
    avgGeneration: number;
    multiplicationEvents: number;
    byStage: Record<string, number>;
  }[];
  survivalFunnel: { stage: string; count: number; pct: number }[];
  cycleTime: { stage: string; avgDays: number; samples: number }[];
  contaminationByType: { type: string; count: number }[];
  healthDistribution: { status: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Performance metrics and operational intelligence" />
        <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Performance metrics and operational intelligence" />
        <div className="text-center py-12 text-muted-foreground">Failed to load analytics</div>
      </div>
    );
  }

  const survivalRate = data.survivalFunnel.length > 1
    ? data.survivalFunnel[data.survivalFunnel.length - 1].pct
    : 0;

  const avgCycleTime = data.cycleTime.length > 0
    ? Math.round(data.cycleTime.reduce((sum, c) => sum + c.avgDays, 0) / data.cycleTime.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance metrics and operational intelligence"
        actions={
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cultivars">Cultivar Performance</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="Contamination Rate"
              value={`${data.contaminationRate}%`}
              subtitle={`${data.totalContaminated} of ${data.totalActive} active`}
              alert={data.contaminationRate > 5}
            />
            <KpiCard
              title="Multiplication Rate"
              value={`${data.multiplicationRate}%`}
              subtitle={`${data.multiplicationEvents} events this period`}
            />
            <KpiCard
              title="Avg Cycle Time"
              value={avgCycleTime > 0 ? `${avgCycleTime}d` : "—"}
              subtitle="Planted to stage advance"
            />
            <KpiCard
              title="Survival Rate"
              value={`${survivalRate}%`}
              subtitle="Reaching final stage"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Production Throughput</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.productionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), "MMM d")} fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip labelFormatter={(d) => format(new Date(d as string), "MMM d, yyyy")} />
                    <Legend />
                    <Area type="monotone" dataKey="created" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} name="Created" />
                    <Area type="monotone" dataKey="multiplied" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} name="Multiplied" />
                    <Area type="monotone" dataKey="stage_advanced" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} name="Stage Advanced" />
                    <Area type="monotone" dataKey="disposed" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.4} name="Disposed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Contamination Rate Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.contaminationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickFormatter={(d) => format(new Date(d), "MMM d")} fontSize={11} />
                    <YAxis unit="%" fontSize={11} />
                    <Tooltip
                      labelFormatter={(d) => `Week of ${format(new Date(d as string), "MMM d")}`}
                    />
                    <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Contamination %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── CULTIVAR PERFORMANCE TAB ── */}
        <TabsContent value="cultivars" className="space-y-4">
          {data.cultivarPerformance.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No cultivar data available</CardContent></Card>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium">Contamination Rate by Cultivar</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={Math.max(200, data.cultivarPerformance.length * 36)}>
                      <BarChart
                        data={data.cultivarPerformance.filter((c) => c.totalVessels > 0).slice(0, 15)}
                        layout="vertical"
                        margin={{ left: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit="%" fontSize={11} />
                        <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="contaminationRate" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm font-medium">Active Vessels by Cultivar</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={Math.max(200, data.cultivarPerformance.length * 36)}>
                      <BarChart
                        data={data.cultivarPerformance.filter((c) => c.activeVessels > 0).slice(0, 15)}
                        layout="vertical"
                        margin={{ left: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={11} />
                        <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="activeVessels" fill="#2563eb" radius={[0, 4, 4, 0]} name="Active" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Cultivar Comparison</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">Cultivar</th>
                          <th className="pb-2 font-medium text-right">Total</th>
                          <th className="pb-2 font-medium text-right">Active</th>
                          <th className="pb-2 font-medium text-right">Contamination</th>
                          <th className="pb-2 font-medium text-right">Avg Gen</th>
                          <th className="pb-2 font-medium text-right">Multiplications</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.cultivarPerformance.map((c) => (
                          <tr key={c.id} className="border-b last:border-0">
                            <td className="py-2 font-medium">{c.name}</td>
                            <td className="py-2 text-right">{c.totalVessels}</td>
                            <td className="py-2 text-right">{c.activeVessels}</td>
                            <td className="py-2 text-right">
                              <span className={c.contaminationRate > 5 ? "text-red-600 font-semibold" : ""}>
                                {c.contaminationRate}%
                              </span>
                              <span className="text-muted-foreground ml-1">({c.contaminated})</span>
                            </td>
                            <td className="py-2 text-right">{c.avgGeneration}</td>
                            <td className="py-2 text-right">{c.multiplicationEvents}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── PRODUCTION TAB ── */}
        <TabsContent value="production" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Survival Funnel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.survivalFunnel.map((s, i) => (
                    <div key={s.stage}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{STAGE_LABELS[s.stage] || s.stage}</span>
                        <span className="text-muted-foreground">{s.count} vessels ({s.pct}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center pl-2 text-xs text-white font-medium transition-all"
                          style={{
                            width: `${Math.max(s.pct, 2)}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        >
                          {s.pct > 10 ? `${s.pct}%` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Of {data.totalCreated} total vessels created, showing how many reached each stage or beyond.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Average Cycle Time by Stage</CardTitle></CardHeader>
              <CardContent>
                {data.cycleTime.some((c) => c.avgDays > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.cycleTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" tickFormatter={(s) => STAGE_LABELS[s] || s} fontSize={11} />
                      <YAxis unit="d" fontSize={11} />
                      <Tooltip labelFormatter={(s) => STAGE_LABELS[s as string] || s} />
                      <Bar dataKey="avgDays" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Avg Days" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Not enough stage advancement data yet to calculate cycle times.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Weekly Throughput</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={aggregateWeekly(data.productionTrends)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tickFormatter={(d) => format(new Date(d), "MMM d")} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip labelFormatter={(d) => `Week of ${format(new Date(d as string), "MMM d")}`} />
                  <Legend />
                  <Bar dataKey="created" fill="#16a34a" name="Created" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="multiplied" fill="#2563eb" name="Multiplied" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="disposed" fill="#dc2626" name="Disposed" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QUALITY TAB ── */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Contamination by Type</CardTitle></CardHeader>
              <CardContent>
                {data.contaminationByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.contaminationByType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {data.contaminationByType.map((_, i) => (
                          <Cell key={i} fill={CONTAMINATION_COLORS[i % CONTAMINATION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">No contamination events recorded</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Health Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {data.healthDistribution.length > 0 ? (
                  <div className="space-y-2">
                    {data.healthDistribution.map((h) => {
                      const total = data.totalActive;
                      const pct = total > 0 ? Math.round((h.count / total) * 100) : 0;
                      return (
                        <div key={h.status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{HEALTH_STATUS_LABELS[h.status] || h.status}</span>
                            <span className="text-muted-foreground">{h.count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.max(pct, 1)}%`,
                                backgroundColor: HEALTH_COLORS[h.status] || "#6b7280",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">No vessel health data</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Contamination Rate Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.contaminationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tickFormatter={(d) => format(new Date(d), "MMM d")} fontSize={11} />
                  <YAxis unit="%" fontSize={11} />
                  <Tooltip labelFormatter={(d) => `Week of ${format(new Date(d as string), "MMM d")}`} />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Rate %" />
                  <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 2 }} name="Events" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ title, value, subtitle, alert }: { title: string; value: string; subtitle: string; alert?: boolean }) {
  return (
    <Card className={alert ? "border-red-300 dark:border-red-800" : ""}>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${alert ? "text-red-600" : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function aggregateWeekly(
  daily: { date: string; created: number; multiplied: number; disposed: number }[]
): { week: string; created: number; multiplied: number; disposed: number }[] {
  const weeks = new Map<string, { created: number; multiplied: number; disposed: number }>();

  for (const d of daily) {
    const date = new Date(d.date);
    // Get Monday of the week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const key = monday.toISOString().split("T")[0];

    const existing = weeks.get(key) || { created: 0, multiplied: 0, disposed: 0 };
    existing.created += d.created;
    existing.multiplied += d.multiplied;
    existing.disposed += d.disposed;
    weeks.set(key, existing);
  }

  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, counts]) => ({ week, ...counts }));
}
