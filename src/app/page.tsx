"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, HealthBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  totalVessels: number;
  activeVessels: number;
  totalExplants: number;
  vesselsByStatus: { status: string; count: number }[];
  vesselsByCultivar: { cultivarId: string; cultivarName: string; vesselCount: number; explantCount: number }[];
  recentActivities: {
    id: string;
    type: string;
    notes: string | null;
    createdAt: string;
    vessel: { id: string; barcode: string };
    user: { id: string; name: string } | null;
  }[];
  healthBreakdown: { status: string; count: number }[];
  readyToMultiply: { id: string; barcode: string; cultivarName: string; explantCount: number; updatedAt: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>;
  if (!stats) return <div className="text-center py-12 text-muted-foreground">Failed to load stats</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vessel tracking overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Vessels</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeVessels.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Explants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalExplants.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vessels (All Time)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalVessels.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cultivars</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.vesselsByCultivar.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ready to pull from growth chamber */}
      {stats.readyToMultiply.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">
              Ready to Pull ({stats.readyToMultiply.length} vessels in growth 2+ weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.readyToMultiply.map((v) => (
                <Link
                  key={v.id}
                  href={`/vessels/${v.id}`}
                  className="flex items-center justify-between p-2 rounded-md bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <div>
                    <span className="font-mono text-sm font-medium">{v.barcode}</span>
                    <span className="text-sm text-muted-foreground ml-2">{v.cultivarName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vessels by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vessels by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.vesselsByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vessels yet</p>
            ) : (
              <div className="space-y-3">
                {stats.vesselsByStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <StatusBadge status={s.status} />
                    <span className="font-mono text-sm font-medium">{s.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health Status</CardTitle>
          </CardHeader>
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

        {/* Vessels by cultivar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vessels by Cultivar</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.vesselsByCultivar.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cultivars yet. <Link href="/cultivars" className="underline">Add one</Link></p>
            ) : (
              <div className="space-y-3">
                {stats.vesselsByCultivar.map((c) => (
                  <div key={c.cultivarId} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.cultivarName}</span>
                    <div className="text-right">
                      <span className="font-mono text-sm">{c.vesselCount} vessels</span>
                      <span className="text-muted-foreground text-xs ml-2">({c.explantCount} explants)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Link href="/activity" className="text-sm text-muted-foreground hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet. <Link href="/scan" className="underline">Scan a vessel</Link></p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivities.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/vessels/${a.vessel.id}`} className="font-mono text-sm hover:underline">
                        {a.vessel.barcode}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{a.notes}</p>
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
