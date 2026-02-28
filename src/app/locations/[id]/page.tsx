"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, HealthBadge, StageBadge } from "@/components/status-badge";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";
import type { Location, Vessel } from "@/lib/types";
import { toast } from "sonner";

interface LocationDetail extends Location {
  vessels?: Vessel[];
  children?: Location[];
  _count?: { vessels: number };
}

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/locations/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setLocation)
      .catch(() => setLocation(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Deactivate this location?")) return;
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Location deactivated");
      router.push("/locations");
    } else {
      toast.error("Failed to deactivate");
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!location) return <div className="text-center py-12 text-muted-foreground">Location not found</div>;

  const vesselCount = location._count?.vessels ?? location.vessels?.length ?? 0;
  const capacityPct = location.capacity ? Math.round((vesselCount / location.capacity) * 100) : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={location.name}
        description={LOCATION_TYPE_LABELS[location.type] || location.type}
        actions={
          <div className="flex gap-2">
            <Badge variant="outline">{vesselCount} vessels</Badge>
            <Button variant="outline" size="sm" onClick={handleDelete}>Deactivate</Button>
          </div>
        }
      />

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="outline">{LOCATION_TYPE_LABELS[location.type] || location.type}</Badge>
            <span className="text-muted-foreground">Site</span>
            <span>{location.site?.name ?? "—"}</span>
            <span className="text-muted-foreground">Parent</span>
            <span>{location.parent?.name ?? "Top level"}</span>
            <span className="text-muted-foreground">Vessel Count</span>
            <span className="font-mono">{vesselCount}</span>
            {location.capacity && (
              <>
                <span className="text-muted-foreground">Capacity</span>
                <div>
                  <span className={`font-mono ${capacityPct && capacityPct > 90 ? "text-red-500" : ""}`}>
                    {vesselCount}/{location.capacity} ({capacityPct}%)
                  </span>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${capacityPct && capacityPct > 90 ? "bg-red-500" : capacityPct && capacityPct > 70 ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${Math.min(capacityPct || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Conditions */}
          {location.conditions && Object.keys(location.conditions).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Target Conditions</p>
              <div className="grid grid-cols-3 gap-3">
                {location.conditions.temperature !== undefined && (
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="text-lg font-mono">{location.conditions.temperature}°C</p>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                  </div>
                )}
                {location.conditions.humidity !== undefined && (
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="text-lg font-mono">{location.conditions.humidity}%</p>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                )}
                {location.conditions.lightHours !== undefined && (
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="text-lg font-mono">{location.conditions.lightHours}h</p>
                    <p className="text-xs text-muted-foreground">Photoperiod</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sub-locations */}
      {location.children && location.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sub-locations ({location.children.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {location.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/locations/${child.id}`}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{child.name}</p>
                    <p className="text-xs text-muted-foreground">{LOCATION_TYPE_LABELS[child.type] || child.type}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vessels at this location */}
      {location.vessels && location.vessels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vessels Here ({location.vessels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Cultivar</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {location.vessels.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link href={`/vessels/${v.id}`} className="font-mono text-sm hover:underline">
                        {v.barcode}
                      </Link>
                    </TableCell>
                    <TableCell>{v.cultivar?.name || "—"}</TableCell>
                    <TableCell><StageBadge stage={v.stage} /></TableCell>
                    <TableCell><HealthBadge status={v.healthStatus} /></TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
