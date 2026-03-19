"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import {
  Users, Trophy, AlertTriangle, DollarSign, TrendingUp, Clock,
  Download, ChevronRight, ChevronLeft, Beaker, MessageSquare,
  Play, Square, Settings, FlaskConical, ArrowUpDown, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface TechPerformance {
  user: { id: string; name: string; email: string; role: string };
  vesselsProcessed: number;
  totalPoints: number;
  totalHours: number;
  overtimeHours: number;
  contaminationCount: number;
  contaminationRate: number;
  effectiveRate: number;
  bonusAmount: number;
  bonusEligible: boolean;
  status: string;
  taskBreakdown: { key: string; count: number; points: number; stage: string }[];
  shifts: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    hoursWorked: number | null;
    station: { id: string; name: string } | null;
    totalPoints: number;
    vesselsProcessed: number;
    effectiveRate: number | null;
    bonusAmount: number | null;
    isOvertime: boolean;
  }[];
}

interface TeamData {
  period: { from: string; to: string; type: string };
  config: {
    baseHourlyRate: number;
    pointDollarValue: number;
    contaminationThreshold: number;
    dailyVesselTarget: number | null;
    bonusPeriod: string;
    enableIncentives: boolean;
  };
  team: {
    totalVessels: number;
    totalPoints: number;
    totalHours: number;
    avgEffectiveRate: number;
    avgContaminationRate: number;
    totalBonusPool: number;
    eligibleCount: number;
    techCount: number;
  };
  technicians: TechPerformance[];
  stations: { id: string; name: string; vessels: number; contamination: number; contaminationRate: number }[];
  flaggedMediaBatches: { id: string; batchNumber: string; contaminationCount: number; createdAt: string }[];
}

interface ShiftNote {
  id: string;
  content: string;
  priority: string;
  createdAt: string;
  author: { id: string; name: string; role: string };
}

interface Station {
  id: string;
  name: string;
  type: string;
}

type Tab = "overview" | "drilldown" | "stations" | "notes" | "settings";

/* ─── Component ─────────────────────────────────────────────────────────────── */

export default function TeamPerformancePage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedTech, setSelectedTech] = useState<TechPerformance | null>(null);
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [newNote, setNewNote] = useState("");
  const [notePriority, setNotePriority] = useState("normal");
  const [clockedIn, setClockedIn] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [todayPoints, setTodayPoints] = useState(0);
  const [todayVessels, setTodayVessels] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/team-performance?period=${period}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/shift-notes?limit=30");
    if (res.ok) setNotes(await res.json());
  }, []);

  const fetchStations = useCallback(async () => {
    const res = await fetch("/api/stations");
    if (res.ok) setStations(await res.json());
  }, []);

  const checkActiveShift = useCallback(async () => {
    const res = await fetch("/api/tech-shifts?status=active");
    if (res.ok) {
      const shifts = await res.json();
      if (shifts.length > 0) {
        setClockedIn(true);
        setActiveShiftId(shifts[0].id);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchNotes();
    fetchStations();
    checkActiveShift();
  }, [fetchData, fetchNotes, fetchStations, checkActiveShift]);

  // Refresh today's points from the data
  useEffect(() => {
    if (data && period === "today") {
      const me = data.technicians.find((t) => t.shifts.some((s) => !s.clockOut));
      if (me) {
        setTodayPoints(me.totalPoints);
        setTodayVessels(me.vesselsProcessed);
      }
    }
  }, [data, period]);

  const handleClockIn = async () => {
    const res = await fetch("/api/tech-shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: selectedStation || null }),
    });
    if (res.ok) {
      const shift = await res.json();
      setClockedIn(true);
      setActiveShiftId(shift.id);
    }
  };

  const handleClockOut = async () => {
    if (!activeShiftId) return;
    const res = await fetch(`/api/tech-shifts/${activeShiftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) {
      setClockedIn(false);
      setActiveShiftId(null);
      fetchData();
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const res = await fetch("/api/shift-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote, priority: notePriority }),
    });
    if (res.ok) {
      setNewNote("");
      setNotePriority("normal");
      fetchNotes();
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ["Rank", "Name", "Vessels", "Points", "Hours", "Eff. Rate", "Contam %", "Bonus", "Status"];
    const rows = data.technicians.map((t, i) => [
      i + 1,
      t.user.name,
      t.vesselsProcessed,
      t.totalPoints,
      t.totalHours,
      `$${t.effectiveRate}`,
      `${t.contaminationRate}%`,
      `$${t.bonusAmount}`,
      t.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-performance-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="Team Performance" />
        <div className="text-center text-muted-foreground py-20">Loading performance data...</div>
      </div>
    );
  }

  const t = data?.team;
  const cfg = data?.config;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Team Performance" />
        <div className="flex items-center gap-2">
          {/* Clock In/Out */}
          {!clockedIn ? (
            <div className="flex items-center gap-2">
              {stations.length > 0 && (
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={handleClockIn} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-1" /> Clock In
              </Button>
            </div>
          ) : (
            <Button onClick={handleClockOut} variant="destructive">
              <Square className="h-4 w-4 mr-1" /> Clock Out
            </Button>
          )}
        </div>
      </div>

      {/* Period Selector + Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["overview", "drilldown", "stations", "notes", "settings"] as Tab[]).map((t) => (
            <Button
              key={t}
              variant={tab === t ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab(t)}
              className="capitalize"
            >
              {t === "drilldown" ? "Individual" : t}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "biweek", label: "2 Weeks" },
            { key: "month", label: "This Month" },
          ].map((p) => (
            <Button
              key={p.key}
              variant={period === p.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === "overview" && t && cfg && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FlaskConical className="h-4 w-4" /> Total Output
                </div>
                <div className="text-2xl font-bold">{t.totalVessels.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">vessels processed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" /> Team Avg Rate
                </div>
                <div className="text-2xl font-bold">${t.avgEffectiveRate}/hr</div>
                <div className="text-xs text-muted-foreground">vs ${cfg.baseHourlyRate} base</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Beaker className="h-4 w-4" /> Contamination
                </div>
                <div className={`text-2xl font-bold ${t.avgContaminationRate > cfg.contaminationThreshold ? "text-red-600" : "text-green-600"}`}>
                  {t.avgContaminationRate}%
                </div>
                <div className="text-xs text-muted-foreground">threshold: {cfg.contaminationThreshold}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" /> Bonus Pool
                </div>
                <div className="text-2xl font-bold">${t.totalBonusPool.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{t.eligibleCount}/{t.techCount} eligible</div>
              </CardContent>
            </Card>
          </div>

          {/* Flagged Media Batches Alert */}
          {data!.flaggedMediaBatches.length > 0 && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-amber-800 dark:text-amber-300">Media Batch Contamination Alert</span>
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                  {data!.flaggedMediaBatches.map((b) => (
                    <div key={b.id}>
                      Batch <span className="font-mono font-semibold">{b.batchNumber}</span> has {b.contaminationCount} contaminated vessels across multiple techs. Possible media prep issue.
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ranked Tech Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Technician Rankings
              </CardTitle>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2 w-12">#</th>
                      <th className="p-2">Technician</th>
                      <th className="p-2 text-right">Vessels</th>
                      <th className="p-2 text-right">Points</th>
                      <th className="p-2 text-right">Hours</th>
                      <th className="p-2 text-right">Eff. Rate</th>
                      <th className="p-2 text-right">Contam %</th>
                      <th className="p-2 text-right">Bonus Est.</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.technicians.map((tech, i) => (
                      <tr
                        key={tech.user.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedTech(tech);
                          setTab("drilldown");
                        }}
                      >
                        <td className="p-2 font-mono text-muted-foreground">{i + 1}</td>
                        <td className="p-2 font-medium">{tech.user.name}</td>
                        <td className="p-2 text-right font-mono">{tech.vesselsProcessed}</td>
                        <td className="p-2 text-right font-mono">{tech.totalPoints}</td>
                        <td className="p-2 text-right font-mono">{tech.totalHours}</td>
                        <td className="p-2 text-right font-mono">${tech.effectiveRate}/hr</td>
                        <td className={`p-2 text-right font-mono ${tech.contaminationRate > cfg.contaminationThreshold ? "text-red-600 font-semibold" : ""}`}>
                          {tech.contaminationRate}%
                        </td>
                        <td className="p-2 text-right font-mono">
                          {tech.bonusEligible ? `$${tech.bonusAmount}` : "--"}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant={
                            tech.status === "eligible" ? "default" :
                            tech.status === "over_contamination" ? "destructive" :
                            "secondary"
                          }>
                            {tech.status === "eligible" ? "Eligible" :
                             tech.status === "over_contamination" ? "Over Contam" :
                             "Below Min"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                    {data!.technicians.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-muted-foreground">
                          No production activity in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Team Output Chart */}
          {data!.technicians.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Output by Technician</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data!.technicians.map((t) => ({
                    name: t.user.name.split(" ")[0],
                    vessels: t.vesselsProcessed,
                    points: t.totalPoints,
                    contamination: t.contaminationCount,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="vessels" fill="#3b82f6" name="Vessels" />
                    <Bar dataKey="contamination" fill="#ef4444" name="Contamination" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ═══ INDIVIDUAL DRILLDOWN TAB ═══ */}
      {tab === "drilldown" && (
        <>
          {!selectedTech ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Select a technician from the Overview tab to see their detailed performance.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedTech(null); setTab("overview"); }}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <h2 className="text-xl font-semibold">{selectedTech.user.name}</h2>
                <Badge variant="outline">{selectedTech.user.role}</Badge>
              </div>

              {/* Tech Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Vessels</div>
                    <div className="text-2xl font-bold">{selectedTech.vesselsProcessed}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Points</div>
                    <div className="text-2xl font-bold">{selectedTech.totalPoints}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Effective Rate</div>
                    <div className="text-2xl font-bold">${selectedTech.effectiveRate}/hr</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Contamination</div>
                    <div className={`text-2xl font-bold ${selectedTech.contaminationRate > (cfg?.contaminationThreshold ?? 5) ? "text-red-600" : "text-green-600"}`}>
                      {selectedTech.contaminationRate}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Task Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-2">Stage</th>
                        <th className="p-2">Task</th>
                        <th className="p-2 text-right">Count</th>
                        <th className="p-2 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTech.taskBreakdown.map((tb) => (
                        <tr key={tb.key} className="border-b">
                          <td className="p-2 capitalize">{tb.stage}</td>
                          <td className="p-2 capitalize">{tb.key.split(":")[1]}</td>
                          <td className="p-2 text-right font-mono">{tb.count}</td>
                          <td className="p-2 text-right font-mono">{tb.points}</td>
                        </tr>
                      ))}
                      {selectedTech.taskBreakdown.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No tasks in this period.</td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Shift History */}
              <Card>
                <CardHeader>
                  <CardTitle>Shift History</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-2">Date</th>
                        <th className="p-2">Station</th>
                        <th className="p-2 text-right">Hours</th>
                        <th className="p-2 text-right">Vessels</th>
                        <th className="p-2 text-right">Points</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Bonus</th>
                        <th className="p-2">OT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTech.shifts.map((s) => (
                        <tr key={s.id} className="border-b">
                          <td className="p-2">{new Date(s.clockIn).toLocaleDateString()}</td>
                          <td className="p-2">{s.station?.name || "--"}</td>
                          <td className="p-2 text-right font-mono">{s.hoursWorked ?? "--"}</td>
                          <td className="p-2 text-right font-mono">{s.vesselsProcessed}</td>
                          <td className="p-2 text-right font-mono">{s.totalPoints}</td>
                          <td className="p-2 text-right font-mono">{s.effectiveRate != null ? `$${s.effectiveRate}` : "--"}</td>
                          <td className="p-2 text-right font-mono">{s.bonusAmount != null ? `$${s.bonusAmount}` : "--"}</td>
                          <td className="p-2">{s.isOvertime ? <Badge variant="outline">OT</Badge> : ""}</td>
                        </tr>
                      ))}
                      {selectedTech.shifts.length === 0 && (
                        <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No shifts logged.</td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Daily Target Progress (if configured) */}
              {cfg?.dailyVesselTarget && period === "today" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" /> Daily Target
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{selectedTech.vesselsProcessed} / {cfg.dailyVesselTarget} vessels</span>
                        <span>{Math.min(100, Math.round((selectedTech.vesselsProcessed / cfg.dailyVesselTarget) * 100))}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all ${
                            selectedTech.vesselsProcessed >= cfg.dailyVesselTarget
                              ? "bg-green-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (selectedTech.vesselsProcessed / cfg.dailyVesselTarget) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ STATIONS TAB ═══ */}
      {tab === "stations" && data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5" /> Station Contamination Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.stations.length > 0 ? (
                <>
                  <table className="w-full text-sm mb-6">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-2">Station</th>
                        <th className="p-2 text-right">Vessels Processed</th>
                        <th className="p-2 text-right">Contamination</th>
                        <th className="p-2 text-right">Contam Rate</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stations.map((s) => (
                        <tr key={s.id} className="border-b">
                          <td className="p-2 font-medium">{s.name}</td>
                          <td className="p-2 text-right font-mono">{s.vessels}</td>
                          <td className="p-2 text-right font-mono">{s.contamination}</td>
                          <td className={`p-2 text-right font-mono ${s.contaminationRate > (cfg?.contaminationThreshold ?? 5) ? "text-red-600 font-semibold" : ""}`}>
                            {s.contaminationRate}%
                          </td>
                          <td className="p-2">
                            {s.contaminationRate > (cfg?.contaminationThreshold ?? 5) ? (
                              <Badge variant="destructive">Check HEPA</Badge>
                            ) : (
                              <Badge variant="default">Normal</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.stations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="contaminationRate" fill="#ef4444" name="Contam %" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No station data yet. Assign stations when techs clock in.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Batch Correlation */}
          {data.flaggedMediaBatches.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" /> Flagged Media Batches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2">Batch #</th>
                      <th className="p-2 text-right">Contaminated Vessels</th>
                      <th className="p-2">Date Prepared</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.flaggedMediaBatches.map((b) => (
                      <tr key={b.id} className="border-b">
                        <td className="p-2 font-mono font-semibold">{b.batchNumber}</td>
                        <td className="p-2 text-right font-mono text-red-600">{b.contaminationCount}</td>
                        <td className="p-2">{new Date(b.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ═══ SHIFT NOTES TAB ═══ */}
      {tab === "notes" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Shift Handoff Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New Note Form */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Leave a note for the next shift..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <div className="flex flex-col gap-2">
                <Select value={notePriority} onValueChange={setNotePriority}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>Post</Button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-3 mt-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${
                    note.priority === "urgent"
                      ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                      : note.priority === "important"
                      ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{note.author.name}</span>
                      {note.priority !== "normal" && (
                        <Badge variant={note.priority === "urgent" ? "destructive" : "default"} className="text-xs">
                          {note.priority}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No shift notes yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {tab === "settings" && <IncentiveSettings config={cfg} stations={stations} onSave={() => { fetchData(); fetchStations(); }} />}
    </div>
  );
}

/* ─── Settings Sub-Component ─────────────────────────────────────────────────── */

function IncentiveSettings({
  config,
  stations,
  onSave,
}: {
  config: TeamData["config"] | undefined;
  stations: Station[];
  onSave: () => void;
}) {
  const [baseRate, setBaseRate] = useState(config?.baseHourlyRate ?? 16);
  const [pointValue, setPointValue] = useState(config?.pointDollarValue ?? 0.025);
  const [contamThreshold, setContamThreshold] = useState(config?.contaminationThreshold ?? 5);
  const [lookbackDays, setLookbackDays] = useState(14);
  const [bonusPeriod, setBonusPeriod] = useState(config?.bonusPeriod ?? "weekly");
  const [dailyTarget, setDailyTarget] = useState<string>(config?.dailyVesselTarget?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  const [newStationType, setNewStationType] = useState("laminar_flow_hood");

  const saveConfig = async () => {
    setSaving(true);
    await fetch("/api/incentive-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseHourlyRate: baseRate,
        pointDollarValue: pointValue,
        contaminationThreshold: contamThreshold,
        contaminationLookbackDays: lookbackDays,
        bonusPeriod,
        dailyVesselTarget: dailyTarget ? parseInt(dailyTarget) : null,
      }),
    });
    setSaving(false);
    onSave();
  };

  const addStation = async () => {
    if (!newStationName.trim()) return;
    await fetch("/api/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newStationName, type: newStationType }),
    });
    setNewStationName("");
    onSave();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Incentive Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Base Hourly Rate ($)</Label>
              <Input type="number" step="0.5" value={baseRate} onChange={(e) => setBaseRate(parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Point Dollar Value ($)</Label>
              <Input type="number" step="0.001" value={pointValue} onChange={(e) => setPointValue(parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Contamination Threshold (%)</Label>
              <Input type="number" step="0.5" value={contamThreshold} onChange={(e) => setContamThreshold(parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Lookback Window (days)</Label>
              <Input type="number" value={lookbackDays} onChange={(e) => setLookbackDays(parseInt(e.target.value))} />
            </div>
            <div>
              <Label>Bonus Period</Label>
              <Select value={bonusPeriod} onValueChange={setBonusPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Daily Vessel Target</Label>
              <Input type="number" placeholder="Optional" value={dailyTarget} onChange={(e) => setDailyTarget(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </CardContent>
      </Card>

      {/* Point Rules would go here - separate management */}

      <Card>
        <CardHeader>
          <CardTitle>Stations / Hoods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Station name (e.g. Hood 1)"
              value={newStationName}
              onChange={(e) => setNewStationName(e.target.value)}
            />
            <Select value={newStationType} onValueChange={setNewStationType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="laminar_flow_hood">Laminar Flow Hood</SelectItem>
                <SelectItem value="clean_bench">Clean Bench</SelectItem>
                <SelectItem value="prep_station">Prep Station</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addStation}>Add</Button>
          </div>
          <div className="space-y-2">
            {stations.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">{s.name}</span>
                <Badge variant="outline" className="capitalize">{s.type.replace(/_/g, " ")}</Badge>
              </div>
            ))}
            {stations.length === 0 && (
              <div className="text-sm text-muted-foreground">No stations configured. Add your hoods and benches above.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
