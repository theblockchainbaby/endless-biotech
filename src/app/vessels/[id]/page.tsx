"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, HealthBadge } from "@/components/status-badge";
import { formatDistanceToNow, format } from "date-fns";

interface Vessel {
  id: string;
  barcode: string;
  cultivar: { id: string; name: string; species: string } | null;
  mediaType: string | null;
  explantCount: number;
  healthStatus: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  parentVessel: { id: string; barcode: string } | null;
  childVessels: { id: string; barcode: string; status: string; explantCount: number; cultivar: { name: string } | null }[];
  activities: {
    id: string;
    type: string;
    notes: string | null;
    createdAt: string;
    user: { name: string } | null;
  }[];
}

export default function VesselDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vessels/${id}`)
      .then((r) => r.json())
      .then(setVessel)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading vessel...</div>;
  if (!vessel) return <div className="text-center py-12 text-muted-foreground">Vessel not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">{vessel.barcode}</h1>
          <p className="text-muted-foreground">{vessel.cultivar?.name || "No cultivar assigned"}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={vessel.status} />
          <HealthBadge status={vessel.healthStatus} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/scan")}>
          Scan Another
        </Button>
        {vessel.status !== "multiplied" && vessel.status !== "disposed" && (
          <Button size="sm" onClick={() => router.push(`/multiply/${vessel.id}`)}>
            Multiply This Vessel
          </Button>
        )}
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vessel Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <span className="text-muted-foreground">Barcode</span>
            <span className="font-mono">{vessel.barcode}</span>
            <span className="text-muted-foreground">Cultivar</span>
            <span>{vessel.cultivar?.name || "—"}</span>
            <span className="text-muted-foreground">Species</span>
            <span>{vessel.cultivar?.species || "—"}</span>
            <span className="text-muted-foreground">Media Type</span>
            <span>{vessel.mediaType || "—"}</span>
            <span className="text-muted-foreground">Explant Count</span>
            <span className="font-mono">{vessel.explantCount}</span>
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={vessel.status} />
            <span className="text-muted-foreground">Health</span>
            <HealthBadge status={vessel.healthStatus} />
            <span className="text-muted-foreground">Created</span>
            <span>{format(new Date(vessel.createdAt), "MMM d, yyyy h:mm a")}</span>
            <span className="text-muted-foreground">Last Updated</span>
            <span>{formatDistanceToNow(new Date(vessel.updatedAt), { addSuffix: true })}</span>
            {vessel.notes && (
              <>
                <span className="text-muted-foreground">Notes</span>
                <span>{vessel.notes}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lineage */}
      {(vessel.parentVessel || vessel.childVessels.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lineage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vessel.parentVessel && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Parent Vessel</p>
                <Link href={`/vessels/${vessel.parentVessel.id}`} className="font-mono text-sm hover:underline">
                  {vessel.parentVessel.barcode}
                </Link>
              </div>
            )}
            {vessel.childVessels.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Child Vessels ({vessel.childVessels.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vessel.childVessels.map((child) => (
                    <Link
                      key={child.id}
                      href={`/vessels/${child.id}`}
                      className="flex items-center justify-between p-2 rounded-md border hover:bg-accent/50 transition-colors"
                    >
                      <span className="font-mono text-sm">{child.barcode}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{child.explantCount} explants</span>
                        <StatusBadge status={child.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {vessel.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded</p>
          ) : (
            <div className="space-y-3">
              {vessel.activities.map((a, i) => (
                <div key={a.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium capitalize">{a.type.replace(/_/g, " ")}</p>
                      {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                      {a.user && <p className="text-xs text-muted-foreground">by {a.user.name}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(a.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
