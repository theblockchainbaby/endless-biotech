"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, HealthBadge } from "@/components/status-badge";
import { useCurrentUser } from "@/components/user-provider";
import { toast } from "sonner";

interface Cultivar {
  id: string;
  name: string;
  species: string;
}

interface Vessel {
  id: string;
  barcode: string;
  cultivarId: string | null;
  cultivar: Cultivar | null;
  mediaType: string | null;
  explantCount: number;
  healthStatus: string;
  status: string;
  notes: string | null;
  parentVessel: { id: string; barcode: string } | null;
  childVessels: { id: string; barcode: string; status: string }[];
}

export default function ScanPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [existingVessel, setExistingVessel] = useState<Vessel | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for new/edit
  const [cultivarId, setCultivarId] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [explantCount, setExplantCount] = useState("0");
  const [healthStatus, setHealthStatus] = useState("healthy");
  const [status, setStatus] = useState("media_filled");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/cultivars").then((r) => r.json()).then(setCultivars);
  }, []);

  const handleScan = useCallback(async (barcode: string) => {
    setScannedBarcode(barcode);
    setLoading(true);
    try {
      const res = await fetch(`/api/vessels/barcode?code=${encodeURIComponent(barcode)}`);
      const data = await res.json();
      if (data.found) {
        setExistingVessel(data.vessel);
        setIsNew(false);
        setCultivarId(data.vessel.cultivarId || "");
        setMediaType(data.vessel.mediaType || "");
        setExplantCount(String(data.vessel.explantCount));
        setHealthStatus(data.vessel.healthStatus);
        setStatus(data.vessel.status);
        setNotes(data.vessel.notes || "");
      } else {
        setExistingVessel(null);
        setIsNew(true);
        setCultivarId("");
        setMediaType("");
        setExplantCount("0");
        setHealthStatus("healthy");
        setStatus("media_filled");
        setNotes("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    if (!scannedBarcode) return;
    setLoading(true);
    try {
      if (isNew) {
        const res = await fetch("/api/vessels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode: scannedBarcode,
            cultivarId: cultivarId || null,
            mediaType: mediaType || null,
            explantCount: parseInt(explantCount) || 0,
            healthStatus,
            status,
            notes: notes || null,
            userId: currentUser?.id || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to create vessel");
          return;
        }
        toast.success(`Vessel ${scannedBarcode} created`);
      } else if (existingVessel) {
        const res = await fetch(`/api/vessels/${existingVessel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cultivarId: cultivarId || null,
            mediaType: mediaType || null,
            explantCount: parseInt(explantCount) || 0,
            healthStatus,
            status,
            notes: notes || null,
            userId: currentUser?.id || null,
          }),
        });
        if (!res.ok) {
          toast.error("Failed to update vessel");
          return;
        }
        toast.success(`Vessel ${scannedBarcode} updated`);
      }
      // Reset for next scan
      setScannedBarcode(null);
      setExistingVessel(null);
      setIsNew(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScannedBarcode(null);
    setExistingVessel(null);
    setIsNew(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan Vessel</h1>
        <p className="text-muted-foreground">Scan a barcode to create or update a vessel</p>
      </div>

      {!scannedBarcode ? (
        <Card>
          <CardContent className="pt-6">
            <BarcodeScanner onScan={handleScan} />
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Looking up barcode...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-lg">{scannedBarcode}</CardTitle>
              {isNew ? (
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">New Vessel</span>
              ) : (
                <StatusBadge status={existingVessel?.status || ""} />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingVessel && (
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/vessels/${existingVessel.id}`)}
                >
                  View Details
                </Button>
                {existingVessel.status !== "multiplied" && existingVessel.status !== "disposed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/multiply/${existingVessel.id}`)}
                  >
                    Multiply
                  </Button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cultivar</Label>
                <Select value={cultivarId} onValueChange={setCultivarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cultivar" />
                  </SelectTrigger>
                  <SelectContent>
                    {cultivars.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Media Type</Label>
                <Input value={mediaType} onChange={(e) => setMediaType(e.target.value)} placeholder="e.g., MS Basal" />
              </div>

              <div className="space-y-2">
                <Label>Explant Count</Label>
                <Input type="number" value={explantCount} onChange={(e) => setExplantCount(e.target.value)} min="0" />
              </div>

              <div className="space-y-2">
                <Label>Health Status</Label>
                <Select value={healthStatus} onValueChange={setHealthStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="contaminated">Contaminated</SelectItem>
                    <SelectItem value="slow_growth">Slow Growth</SelectItem>
                    <SelectItem value="dead">Dead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="media_filled">Media Filled</SelectItem>
                    <SelectItem value="planted">Planted</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="ready_to_multiply">Ready to Multiply</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
              </div>
            </div>

            {existingVessel?.parentVessel && (
              <p className="text-sm text-muted-foreground">
                Parent: <span className="font-mono">{existingVessel.parentVessel.barcode}</span>
              </p>
            )}
            {existingVessel?.childVessels && existingVessel.childVessels.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Children: {existingVessel.childVessels.length} vessels
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {isNew ? "Create Vessel" : "Update Vessel"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {existingVessel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Cultivar</span>
              <span>{existingVessel.cultivar?.name || "—"}</span>
              <span className="text-muted-foreground">Media</span>
              <span>{existingVessel.mediaType || "—"}</span>
              <span className="text-muted-foreground">Explants</span>
              <span>{existingVessel.explantCount}</span>
              <span className="text-muted-foreground">Health</span>
              <HealthBadge status={existingVessel.healthStatus} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
