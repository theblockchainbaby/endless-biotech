"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, HealthBadge, StageBadge } from "@/components/status-badge";
import { VESSEL_STATUS_LABELS, HEALTH_STATUS_LABELS, STAGE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import type { Cultivar, Vessel } from "@/lib/types";

export default function ScanPage() {
  const router = useRouter();
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [existingVessel, setExistingVessel] = useState<Vessel | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isReuse, setIsReuse] = useState(false);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [cultivarId, setCultivarId] = useState("");
  const [explantCount, setExplantCount] = useState("0");
  const [healthStatus, setHealthStatus] = useState("healthy");
  const [status, setStatus] = useState("media_filled");
  const [stage, setStage] = useState("initiation");
  const [notes, setNotes] = useState("");

  const [recentScans, setRecentScans] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/cultivars").then((r) => r.json()).then(setCultivars);
    try {
      const saved = localStorage.getItem("vitros_recent_scans");
      if (saved) setRecentScans(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const addToRecent = (barcode: string) => {
    setRecentScans((prev) => {
      const updated = [barcode, ...prev.filter((b) => b !== barcode)].slice(0, 8);
      localStorage.setItem("vitros_recent_scans", JSON.stringify(updated));
      return updated;
    });
  };

  const handleScan = useCallback(async (barcode: string) => {
    setScannedBarcode(barcode);
    addToRecent(barcode);
    setLoading(true);
    try {
      const res = await fetch(`/api/vessels/barcode?code=${encodeURIComponent(barcode)}`);
      const data = await res.json();
      if (data.found && !data.isDisposed) {
        // Active vessel — show edit form
        setExistingVessel(data.vessel);
        setIsNew(false);
        setIsReuse(false);
        setCultivarId(data.vessel.cultivarId || "");
        setExplantCount(String(data.vessel.explantCount));
        setHealthStatus(data.vessel.healthStatus);
        setStatus(data.vessel.status);
        setStage(data.vessel.stage || "initiation");
        setNotes(data.vessel.notes || "");
      } else if (data.found && data.isDisposed) {
        // Disposed/multiplied vessel — show reuse prompt
        setExistingVessel(data.vessel);
        setIsNew(false);
        setIsReuse(true);
      } else {
        // Brand new barcode
        setExistingVessel(null);
        setIsNew(true);
        setIsReuse(false);
        setCultivarId("");
        setExplantCount("0");
        setHealthStatus("healthy");
        setStatus("media_filled");
        setStage("initiation");
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
            explantCount: parseInt(explantCount) || 0,
            healthStatus,
            status,
            stage,
            notes: notes || null,
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
            explantCount: parseInt(explantCount) || 0,
            healthStatus,
            status,
            stage,
            notes: notes || null,
          }),
        });
        if (!res.ok) {
          toast.error("Failed to update vessel");
          return;
        }
        toast.success(`Vessel ${scannedBarcode} updated`);
      }
      setScannedBarcode(null);
      setExistingVessel(null);
      setIsNew(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewRun = () => {
    // Switch from reuse prompt to new vessel creation form
    setIsReuse(false);
    setIsNew(true);
    setExistingVessel(null);
    setCultivarId("");
    setExplantCount("0");
    setHealthStatus("healthy");
    setStatus("media_filled");
    setStage("initiation");
    setNotes("");
  };

  const handleReset = () => {
    setScannedBarcode(null);
    setExistingVessel(null);
    setIsNew(false);
    setIsReuse(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader title="Scan Vessel" description="Scan or type a barcode to create or update a vessel" />

      {!scannedBarcode ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <BarcodeScanner onScan={handleScan} />
            </CardContent>
          </Card>
          {recentScans.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5" /> Recent Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recentScans.map((barcode) => (
                    <Button
                      key={barcode}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() => handleScan(barcode)}
                    >
                      {barcode}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Looking up barcode...</p>
          </CardContent>
        </Card>
      ) : isReuse && existingVessel ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-lg">{scannedBarcode}</CardTitle>
              <StatusBadge status={existingVessel.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Previous Run</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Cultivar</span>
                <span>{existingVessel.cultivar?.name || "—"}</span>
                <span className="text-muted-foreground">Stage</span>
                <span>{existingVessel.stage ? <StageBadge stage={existingVessel.stage} /> : "—"}</span>
                <span className="text-muted-foreground">Health</span>
                <HealthBadge status={existingVessel.healthStatus} />
                <span className="text-muted-foreground">Explants</span>
                <span>{existingVessel.explantCount}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This vessel was previously <strong>{existingVessel.status}</strong>. You can reuse the barcode to start a fresh run. The previous history will be preserved.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleStartNewRun} className="flex-1">
                Start New Run
              </Button>
              <Button variant="outline" onClick={() => router.push(`/vessels/${existingVessel.id}`)}>
                View Old Record
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Scan Another
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-lg">{scannedBarcode}</CardTitle>
              <div className="flex gap-2">
                {isNew ? (
                  <span className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">New Vessel</span>
                ) : (
                  <>
                    <StatusBadge status={existingVessel?.status || ""} />
                    {existingVessel?.stage && <StageBadge stage={existingVessel.stage} />}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingVessel && (
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => router.push(`/vessels/${existingVessel.id}`)}>
                  View Details
                </Button>
                {existingVessel.status !== "multiplied" && existingVessel.status !== "disposed" && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/multiply/${existingVessel.id}`)}>
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
                <Label>Explant Count</Label>
                <Input type="number" value={explantCount} onChange={(e) => setExplantCount(e.target.value)} min="0" />
              </div>

              <div className="space-y-2">
                <Label>Health Status</Label>
                <Select value={healthStatus} onValueChange={setHealthStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(HEALTH_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VESSEL_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
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
              <span className="text-muted-foreground">Stage</span>
              <span>{existingVessel.stage ? <StageBadge stage={existingVessel.stage} /> : "—"}</span>
              <span className="text-muted-foreground">Explants</span>
              <span>{existingVessel.explantCount}</span>
              <span className="text-muted-foreground">Health</span>
              <HealthBadge status={existingVessel.healthStatus} />
              <span className="text-muted-foreground">Generation</span>
              <span>{existingVessel.generation || 0}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
