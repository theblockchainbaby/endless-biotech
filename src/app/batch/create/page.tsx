"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import type { Cultivar } from "@/lib/types";
import { toast } from "sonner";

interface MediaRecipe {
  id: string;
  name: string;
  baseMedia: string;
  stage: string | null;
}

export default function BatchCreatePage() {
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shared fields for all vessels
  const [cultivarId, setCultivarId] = useState("");
  const [mediaRecipeId, setMediaRecipeId] = useState("");
  const [explantCount, setExplantCount] = useState("0");
  const [stage, setStage] = useState("initiation");
  const [status, setStatus] = useState("media_filled");

  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [mediaRecipes, setMediaRecipes] = useState<MediaRecipe[]>([]);

  useEffect(() => {
    fetch("/api/cultivars").then((r) => r.json()).then((data) => setCultivars(Array.isArray(data) ? data : []));
    fetch("/api/media-recipes").then((r) => r.json()).then((data) => setMediaRecipes(Array.isArray(data) ? data : data.recipes || []));
  }, []);

  const selectedCultivar = cultivars.find((c) => c.id === cultivarId);

  const addBarcode = useCallback(async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    if (barcodes.includes(trimmed)) {
      toast.info("Already scanned");
      setBarcodeInput("");
      inputRef.current?.focus();
      return;
    }

    // Check if barcode already exists as an active vessel
    setScanning(true);
    try {
      const res = await fetch(`/api/vessels/barcode?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.found && !data.isDisposed) {
        toast.error(`Barcode ${trimmed} belongs to an active vessel`);
        return;
      }
      setBarcodes((prev) => [...prev, trimmed]);
      toast.success(`#${barcodes.length + 1}: ${trimmed}`);
    } finally {
      setScanning(false);
      setBarcodeInput("");
      inputRef.current?.focus();
    }
  }, [barcodes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addBarcode(barcodeInput);
  };

  const removeBarcode = (index: number) => {
    setBarcodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (barcodes.length === 0) {
      toast.error("Scan at least one vessel");
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const barcode of barcodes) {
      try {
        const res = await fetch("/api/vessels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barcode,
            cultivarId: cultivarId || null,
            mediaRecipeId: mediaRecipeId || null,
            explantCount: parseInt(explantCount) || 0,
            healthStatus: "healthy",
            status,
            stage,
          }),
        });
        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json();
          toast.error(`${barcode}: ${err.error || "Failed"}`);
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSubmitting(false);

    if (successCount > 0) {
      toast.success(`Created ${successCount} vessels`);
      setBarcodes([]);
    }
    if (failCount > 0) {
      toast.error(`${failCount} vessel(s) failed`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Batch Create Vessels"
        description="Scan multiple barcodes and create vessels with the same settings"
      />

      {/* Shared settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vessel Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            These settings apply to all vessels in this batch.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cultivar</Label>
              <Select value={cultivarId} onValueChange={setCultivarId}>
                <SelectTrigger><SelectValue placeholder="Select cultivar..." /></SelectTrigger>
                <SelectContent>
                  {cultivars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code ? `${c.code} — ` : ""}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCultivar?.code && (
                <p className="text-xs text-muted-foreground">Code: <span className="font-mono">{selectedCultivar.code}</span></p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Media Recipe</Label>
              <Select value={mediaRecipeId} onValueChange={setMediaRecipeId}>
                <SelectTrigger><SelectValue placeholder="Select recipe..." /></SelectTrigger>
                <SelectContent>
                  {mediaRecipes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.baseMedia})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Explants per Vessel</Label>
              <Input
                type="number"
                value={explantCount}
                onChange={(e) => setExplantCount(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="initiation">Initiation</SelectItem>
                  <SelectItem value="multiplication">Multiplication</SelectItem>
                  <SelectItem value="rooting">Rooting</SelectItem>
                  <SelectItem value="acclimation">Acclimation</SelectItem>
                  <SelectItem value="hardening">Hardening</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="media_filled">Media Filled</SelectItem>
                  <SelectItem value="planted">Planted</SelectItem>
                  <SelectItem value="growing">Growing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Scan Barcodes</CardTitle>
            {barcodes.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                {barcodes.length} scanned
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan barcode..."
              disabled={scanning}
              autoFocus
              className="font-mono"
            />
            <Button onClick={() => addBarcode(barcodeInput)} disabled={scanning || !barcodeInput}>
              {scanning ? "..." : "Add"}
            </Button>
          </div>

          {barcodes.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {barcodes.map((barcode, i) => (
                  <span
                    key={barcode}
                    className="inline-flex items-center gap-1 text-xs font-mono bg-muted px-2 py-1 rounded"
                  >
                    {barcode}
                    <button
                      onClick={() => removeBarcode(i)}
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setBarcodes([])}>
                Clear All
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Scan each vessel barcode. Press Enter after each scan. All vessels will be created with the settings above.
          </p>
        </CardContent>
      </Card>

      {/* Submit */}
      {barcodes.length > 0 && (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
        >
          {submitting
            ? "Creating..."
            : `Create ${barcodes.length} Vessel${barcodes.length > 1 ? "s" : ""}${selectedCultivar ? ` — ${selectedCultivar.name}` : ""}`
          }
        </Button>
      )}
    </div>
  );
}
