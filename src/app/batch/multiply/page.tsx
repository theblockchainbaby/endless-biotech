"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { StageBadge, HealthBadge, StatusBadge } from "@/components/status-badge";
import type { Vessel } from "@/lib/types";
import { toast } from "sonner";

interface MultiplyGroup {
  parent: Vessel;
  childBarcodes: string[];
}

type ScanMode = "parent" | "child";

export default function BatchMultiplyPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<MultiplyGroup[]>([]);
  const [scanMode, setScanMode] = useState<ScanMode>("parent");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Currently active group (the one we're adding children to)
  const activeGroup = groups.length > 0 && scanMode === "child" ? groups[groups.length - 1] : null;

  const scanParent = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;

    // Check if this parent was already scanned
    if (groups.some((g) => g.parent.barcode === barcode.trim())) {
      toast.error("This parent was already scanned");
      return;
    }

    setScanning(true);
    try {
      const res = await fetch(`/api/vessels/barcode?code=${encodeURIComponent(barcode.trim())}`);
      const data = await res.json();

      if (!data.found || !data.vessel) {
        toast.error(`Vessel not found: ${barcode}`);
        return;
      }

      if (data.isDisposed) {
        toast.error(`Vessel ${barcode} is ${data.vessel.status} — can't multiply`);
        return;
      }

      if (data.vessel.status === "multiplied") {
        toast.error(`Vessel ${barcode} was already multiplied`);
        return;
      }

      // Add new group and switch to child scanning mode
      setGroups((prev) => [...prev, { parent: data.vessel, childBarcodes: [] }]);
      setScanMode("child");
      toast.success(`Parent: ${data.vessel.barcode} (${data.vessel.cultivar?.name || "Unknown"})`);
    } finally {
      setScanning(false);
      setBarcodeInput("");
      inputRef.current?.focus();
    }
  }, [groups]);

  const scanChild = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;

    // Check if barcode is already used as a child in any group
    const alreadyUsed = groups.some((g) =>
      g.childBarcodes.includes(barcode.trim()) || g.parent.barcode === barcode.trim()
    );
    if (alreadyUsed) {
      toast.error("This barcode is already in use in this batch");
      setBarcodeInput("");
      inputRef.current?.focus();
      return;
    }

    // Check if barcode exists as an active vessel
    setScanning(true);
    try {
      const res = await fetch(`/api/vessels/barcode?code=${encodeURIComponent(barcode.trim())}`);
      const data = await res.json();

      if (data.found && !data.isDisposed) {
        toast.error(`Barcode ${barcode} belongs to an active vessel — use a new barcode`);
        return;
      }

      // Add child barcode to current group
      setGroups((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...last,
          childBarcodes: [...last.childBarcodes, barcode.trim()],
        };
        return updated;
      });
      toast.success(`Child #${(activeGroup?.childBarcodes.length || 0) + 1}: ${barcode.trim()}`);
    } finally {
      setScanning(false);
      setBarcodeInput("");
      inputRef.current?.focus();
    }
  }, [groups, activeGroup]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (scanMode === "parent") {
        scanParent(barcodeInput);
      } else {
        scanChild(barcodeInput);
      }
    }
  };

  const finishCurrentParent = () => {
    if (activeGroup && activeGroup.childBarcodes.length === 0) {
      toast.error("Scan at least one child vessel");
      return;
    }
    setScanMode("parent");
    inputRef.current?.focus();
  };

  const removeGroup = (index: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== index));
    if (groups.length <= 1) {
      setScanMode("parent");
    }
  };

  const removeChild = (groupIndex: number, childIndex: number) => {
    setGroups((prev) => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        childBarcodes: updated[groupIndex].childBarcodes.filter((_, i) => i !== childIndex),
      };
      return updated;
    });
  };

  const submitAll = async () => {
    const incomplete = groups.filter((g) => g.childBarcodes.length === 0);
    if (incomplete.length > 0) {
      toast.error("All parents need at least one child vessel");
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const group of groups) {
      try {
        const res = await fetch(`/api/vessels/${group.parent.id}/multiply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            children: group.childBarcodes.map((barcode) => ({
              barcode,
              explantCount: 0,
            })),
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json();
          toast.error(`${group.parent.barcode}: ${err.error || "Failed"}`);
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSubmitting(false);

    if (successCount > 0) {
      const totalChildren = groups.reduce((sum, g) => sum + g.childBarcodes.length, 0);
      toast.success(`Multiplied ${successCount} parents into ${totalChildren} new vessels`);
      setGroups([]);
      setScanMode("parent");
    }
    if (failCount > 0) {
      toast.error(`${failCount} multiplication(s) failed`);
    }
  };

  const totalChildren = groups.reduce((sum, g) => sum + g.childBarcodes.length, 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Batch Multiply"
        description="Scan parents and their offspring to record multiplications in bulk"
      />

      {/* Scanner */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {scanMode === "parent" ? "Scan Parent Vessel" : `Scan Children for ${activeGroup?.parent.barcode}`}
            </CardTitle>
            {scanMode === "child" && (
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                {activeGroup?.childBarcodes.length || 0} children scanned
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {scanMode === "child" && activeGroup && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Parent:</span>
                <span className="font-mono font-medium">{activeGroup.parent.barcode}</span>
                <span className="text-muted-foreground">—</span>
                <span>{activeGroup.parent.cultivar?.name || "Unknown"}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={scanMode === "parent" ? "Scan parent barcode..." : "Scan child barcode..."}
              disabled={scanning}
              autoFocus
              className="font-mono"
            />
            <Button
              onClick={() => scanMode === "parent" ? scanParent(barcodeInput) : scanChild(barcodeInput)}
              disabled={scanning || !barcodeInput}
            >
              {scanning ? "..." : "Add"}
            </Button>
          </div>

          {scanMode === "child" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={finishCurrentParent} className="flex-1">
                Done with this parent — scan next parent
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {scanMode === "parent"
              ? "Scan a parent vessel to start. Its cultivar, location, and media recipe will carry over to children."
              : "Scan each new child vessel barcode. Press Enter after each scan. Click \"Done\" when finished with this parent."
            }
          </p>
        </CardContent>
      </Card>

      {/* Groups summary */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Multiplications ({groups.length} parents → {totalChildren} children)
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setGroups([]); setScanMode("parent"); }}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.map((group, gi) => (
              <div key={group.parent.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-sm">{group.parent.barcode}</span>
                    <span className="text-sm text-muted-foreground">{group.parent.cultivar?.name || ""}</span>
                    <StageBadge stage={group.parent.stage} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeGroup(gi)} className="text-destructive h-7 px-2">
                    Remove
                  </Button>
                </div>
                {group.childBarcodes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {group.childBarcodes.map((barcode, ci) => (
                      <span
                        key={barcode}
                        className="inline-flex items-center gap-1 text-xs font-mono bg-muted px-2 py-1 rounded"
                      >
                        → {barcode}
                        <button
                          onClick={() => removeChild(gi, ci)}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400">No children scanned yet</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {groups.length > 0 && scanMode === "parent" && (
        <div className="flex gap-2">
          <Button
            onClick={submitAll}
            disabled={submitting || groups.some((g) => g.childBarcodes.length === 0)}
            className="flex-1"
          >
            {submitting
              ? "Processing..."
              : `Multiply ${groups.length} Parent${groups.length > 1 ? "s" : ""} → ${totalChildren} Children`
            }
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
