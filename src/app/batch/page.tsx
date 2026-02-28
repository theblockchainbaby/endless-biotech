"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StageBadge, HealthBadge } from "@/components/status-badge";
import { LocationPicker } from "@/components/location-picker";
import { HEALTH_STATUSES, HEALTH_STATUS_LABELS } from "@/lib/constants";
import type { Vessel } from "@/lib/types";
import { toast } from "sonner";

type BatchAction = "advance_stage" | "move" | "health_check" | "dispose";

export default function BatchOperationsPage() {
  const [scannedVessels, setScannedVessels] = useState<Vessel[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [action, setAction] = useState<BatchAction>("advance_stage");
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Action params
  const [moveLocationId, setMoveLocationId] = useState("");
  const [healthStatus, setHealthStatus] = useState("healthy");
  const [disposeReason, setDisposeReason] = useState("");

  const scanBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    // Check if already scanned
    if (scannedVessels.some((v) => v.barcode === barcode.trim())) {
      toast.info("Already scanned");
      return;
    }

    setScanning(true);
    try {
      const res = await fetch(`/api/vessels/barcode?barcode=${encodeURIComponent(barcode.trim())}`);
      if (res.ok) {
        const vessel = await res.json();
        setScannedVessels((prev) => [...prev, vessel]);
        toast.success(`Added ${vessel.barcode}`);
      } else {
        toast.error(`Vessel not found: ${barcode}`);
      }
    } finally {
      setScanning(false);
      setBarcodeInput("");
      inputRef.current?.focus();
    }
  }, [scannedVessels]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      scanBarcode(barcodeInput);
    }
  };

  const removeVessel = (id: string) => {
    setScannedVessels((prev) => prev.filter((v) => v.id !== id));
  };

  const clearAll = () => {
    setScannedVessels([]);
  };

  const executeBatch = async () => {
    if (scannedVessels.length === 0) {
      toast.error("No vessels selected");
      return;
    }

    const params: Record<string, unknown> = {};
    if (action === "move") {
      if (!moveLocationId) {
        toast.error("Select a location first");
        return;
      }
      params.locationId = moveLocationId;
    }
    if (action === "health_check") {
      params.healthStatus = healthStatus;
    }
    if (action === "dispose") {
      params.reason = disposeReason || "Batch disposal";
    }

    setExecuting(true);
    try {
      const res = await fetch("/api/vessels/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselIds: scannedVessels.map((v) => v.id),
          action,
          params,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(`Completed: ${result.success}/${result.total} vessels updated`);
        if (result.failed > 0) {
          const failures = result.results.filter((r: { success: boolean }) => !r.success);
          failures.forEach((f: { barcode: string; error: string }) => {
            toast.error(`${f.barcode}: ${f.error}`);
          });
        }
        setScannedVessels([]);
      } else {
        toast.error("Batch operation failed");
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Operations"
        description="Scan multiple vessels and apply operations in bulk"
      />

      {/* Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan Vessels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan or type barcode..."
              disabled={scanning}
              autoFocus
              className="font-mono"
            />
            <Button onClick={() => scanBarcode(barcodeInput)} disabled={scanning || !barcodeInput}>
              {scanning ? "..." : "Add"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Scan barcodes one at a time. Press Enter or click Add after each scan.
          </p>
        </CardContent>
      </Card>

      {/* Scanned vessels */}
      {scannedVessels.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Selected Vessels ({scannedVessels.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearAll}>Clear All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Cultivar</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scannedVessels.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono">{v.barcode}</TableCell>
                    <TableCell>{v.cultivar?.name || "—"}</TableCell>
                    <TableCell><StageBadge stage={v.stage} /></TableCell>
                    <TableCell><HealthBadge status={v.healthStatus} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeVessel(v.id)}>Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Action */}
      {scannedVessels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apply Operation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={action} onValueChange={(v) => setAction(v as BatchAction)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance_stage">Advance Stage</SelectItem>
                  <SelectItem value="move">Move to Location</SelectItem>
                  <SelectItem value="health_check">Health Check</SelectItem>
                  <SelectItem value="dispose">Dispose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === "move" && (
              <div>
                <Label>Destination</Label>
                <div className="mt-1">
                  <LocationPicker value={moveLocationId} onChange={setMoveLocationId} />
                </div>
              </div>
            )}

            {action === "health_check" && (
              <div>
                <Label>Health Status</Label>
                <Select value={healthStatus} onValueChange={setHealthStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HEALTH_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{HEALTH_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === "dispose" && (
              <div>
                <Label>Reason</Label>
                <Input
                  value={disposeReason}
                  onChange={(e) => setDisposeReason(e.target.value)}
                  placeholder="Disposal reason..."
                  className="mt-1"
                />
              </div>
            )}

            <Button onClick={executeBatch} disabled={executing} className="w-full" variant={action === "dispose" ? "destructive" : "default"}>
              {executing ? "Processing..." : `Apply to ${scannedVessels.length} Vessel${scannedVessels.length > 1 ? "s" : ""}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
