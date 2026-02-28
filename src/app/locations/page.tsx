"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { LOCATION_TYPES, LOCATION_TYPE_LABELS } from "@/lib/constants";
import type { Location } from "@/lib/types";
import { toast } from "sonner";

export default function LocationsPage() {
  const [locations, setLocations] = useState<(Location & { _count?: { vessels: number; children: number } })[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [siteId, setSiteId] = useState("");
  const [parentId, setParentId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [lightHours, setLightHours] = useState("");

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/locations");
    const data = await res.json();
    setLocations(data);

    // Extract unique sites from locations
    const siteMap = new Map<string, string>();
    data.forEach((loc: Location & { site?: { id: string; name: string } }) => {
      if (loc.site) siteMap.set(loc.site.id, loc.site.name);
    });
    setSites(Array.from(siteMap, ([id, name]) => ({ id, name })));

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleCreate = async () => {
    if (!name || !type || !siteId) {
      toast.error("Name, type, and site are required");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = { name, type, siteId };
      if (parentId) body.parentId = parentId;
      if (capacity) body.capacity = parseInt(capacity);

      const conditions: Record<string, number> = {};
      if (temperature) conditions.temperature = parseFloat(temperature);
      if (humidity) conditions.humidity = parseFloat(humidity);
      if (lightHours) conditions.lightHours = parseFloat(lightHours);
      if (Object.keys(conditions).length > 0) body.conditions = conditions;

      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Location created");
        setDialogOpen(false);
        setName("");
        setType("");
        setParentId("");
        setCapacity("");
        setTemperature("");
        setHumidity("");
        setLightHours("");
        fetchLocations();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create location");
      }
    } finally {
      setCreating(false);
    }
  };

  // Build a capacity utilization percentage
  const getCapacityPct = (loc: Location & { _count?: { vessels: number } }) => {
    if (!loc.capacity) return null;
    return Math.round(((loc._count?.vessels ?? 0) / loc.capacity) * 100);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage growth chambers, benches, and shelves"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Location</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chamber A" className="mt-1" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Site</Label>
                    <Select value={siteId} onValueChange={setSiteId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Parent Location</Label>
                    <Select value={parentId} onValueChange={setParentId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="None (top level)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Capacity (vessels)</Label>
                  <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Optional" className="mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Temp (C)</Label>
                    <Input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Humidity (%)</Label>
                    <Input type="number" value={humidity} onChange={(e) => setHumidity(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Light (hrs)</Label>
                    <Input type="number" value={lightHours} onChange={(e) => setLightHours(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Create Location"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : locations.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No locations configured. Add one to get started.</p>
      ) : (
        <>
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Vessels</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead>Conditions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => {
                  const pct = getCapacityPct(loc);
                  return (
                    <TableRow key={loc.id} className="cursor-pointer" onClick={() => window.location.href = `/locations/${loc.id}`}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell><Badge variant="outline">{LOCATION_TYPE_LABELS[loc.type] || loc.type}</Badge></TableCell>
                      <TableCell>{loc.site?.name ?? "—"}</TableCell>
                      <TableCell>{loc.parent?.name ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">{loc._count?.vessels ?? 0}</TableCell>
                      <TableCell className="text-right">
                        {loc.capacity ? (
                          <span className={pct && pct > 90 ? "text-red-500 font-medium" : ""}>
                            {pct}%
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {loc.conditions
                          ? Object.entries(loc.conditions).map(([k, v]) => `${k}: ${v}`).join(", ")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {locations.map((loc) => {
              const pct = getCapacityPct(loc);
              return (
                <Link key={loc.id} href={`/locations/${loc.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{loc.name}</p>
                          <p className="text-sm text-muted-foreground">{LOCATION_TYPE_LABELS[loc.type] || loc.type}</p>
                        </div>
                        <Badge variant="outline">{loc._count?.vessels ?? 0} vessels</Badge>
                      </div>
                      {loc.capacity && (
                        <div className="mt-2">
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct && pct > 90 ? "bg-red-500" : pct && pct > 70 ? "bg-amber-500" : "bg-primary"}`}
                              style={{ width: `${Math.min(pct || 0, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{pct}% capacity ({loc._count?.vessels ?? 0}/{loc.capacity})</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
