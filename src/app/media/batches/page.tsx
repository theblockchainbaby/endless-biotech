"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import type { MediaBatch, MediaRecipe } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { FlaskConical, X } from "lucide-react";

export default function MediaBatchesPage() {
  const [batches, setBatches] = useState<MediaBatch[]>([]);
  const [recipes, setRecipes] = useState<MediaRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipeFilter, setRecipeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [recipeId, setRecipeId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [volumeL, setVolumeL] = useState("");
  const [vesselCount, setVesselCount] = useState("");
  const [measuredPH, setMeasuredPH] = useState("");
  const [autoclaved, setAutoclaved] = useState(false);
  const [notes, setNotes] = useState("");

  // Pour state
  const [pourDialogOpen, setPourDialogOpen] = useState(false);
  const [pourBatch, setPourBatch] = useState<MediaBatch | null>(null);
  const [pourBarcode, setPourBarcode] = useState("");
  const [pourBarcodes, setPourBarcodes] = useState<string[]>([]);
  const [pouring, setPouring] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (recipeFilter !== "all") params.set("recipeId", recipeFilter);
    const res = await fetch(`/api/media-batches?${params}`);
    const data = await res.json();
    setBatches(data);
    setLoading(false);
  }, [recipeFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    fetch("/api/media-recipes").then((r) => r.json()).then(setRecipes);
  }, []);

  const handleCreate = async () => {
    if (!recipeId || !batchNumber || !volumeL || !vesselCount) {
      toast.error("Recipe, batch number, volume, and vessel count are required");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        recipeId,
        batchNumber,
        volumeL: parseFloat(volumeL),
        vesselCount: parseInt(vesselCount),
        autoclaved,
      };
      if (measuredPH) body.measuredPH = parseFloat(measuredPH);
      if (notes) body.notes = notes;

      const res = await fetch("/api/media-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Batch recorded");
        setDialogOpen(false);
        setRecipeId("");
        setBatchNumber("");
        setVolumeL("");
        setVesselCount("");
        setMeasuredPH("");
        setAutoclaved(false);
        setNotes("");
        fetchBatches();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create batch");
      }
    } finally {
      setCreating(false);
    }
  };

  const openPourDialog = (batch: MediaBatch) => {
    setPourBatch(batch);
    setPourBarcodes([]);
    setPourBarcode("");
    setPourDialogOpen(true);
  };

  const addPourBarcode = () => {
    const code = pourBarcode.trim();
    if (!code) return;
    if (pourBarcodes.includes(code)) {
      toast.error("Barcode already added");
      return;
    }
    setPourBarcodes([...pourBarcodes, code]);
    setPourBarcode("");
  };

  const removePourBarcode = (code: string) => {
    setPourBarcodes(pourBarcodes.filter((b) => b !== code));
  };

  const handlePour = async () => {
    if (!pourBatch || pourBarcodes.length === 0) return;
    setPouring(true);
    try {
      const res = await fetch(`/api/media-batches/${pourBatch.id}/pour`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcodes: pourBarcodes }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Poured into ${data.created + data.updated} vessels (${data.created} new, ${data.updated} updated)`);
        setPourDialogOpen(false);
        setPourBatch(null);
        setPourBarcodes([]);
      } else {
        const err = await res.json();
        toast.error(err.error || "Pour failed");
      }
    } finally {
      setPouring(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Batches"
        description="Track prepared media batches"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Log Batch</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Media Batch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Recipe</Label>
                  <Select value={recipeId} onValueChange={setRecipeId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select recipe" /></SelectTrigger>
                    <SelectContent>
                      {recipes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Batch Number</Label>
                    <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="MB-2026-001" className="mt-1" />
                  </div>
                  <div>
                    <Label>Volume (L)</Label>
                    <Input type="number" step="0.1" value={volumeL} onChange={(e) => setVolumeL(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Vessel Count</Label>
                    <Input type="number" value={vesselCount} onChange={(e) => setVesselCount(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Measured pH</Label>
                    <Input type="number" step="0.01" value={measuredPH} onChange={(e) => setMeasuredPH(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="autoclaved" checked={autoclaved} onChange={(e) => setAutoclaved(e.target.checked)} />
                  <Label htmlFor="autoclaved">Autoclaved</Label>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Saving..." : "Log Batch"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filter */}
      <Card>
        <CardContent className="pt-4">
          <Select value={recipeFilter} onValueChange={setRecipeFilter}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Filter by recipe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Recipes</SelectItem>
              {recipes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : batches.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No batches recorded yet</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead>Volume (L)</TableHead>
                <TableHead>Vessels</TableHead>
                <TableHead>pH</TableHead>
                <TableHead>Autoclaved</TableHead>
                <TableHead>Prepared By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono">{b.batchNumber}</TableCell>
                  <TableCell>{b.recipe?.name ?? "—"}</TableCell>
                  <TableCell>{b.volumeL}</TableCell>
                  <TableCell className="font-mono">{b.vesselCount}</TableCell>
                  <TableCell>{b.measuredPH ?? "—"}</TableCell>
                  <TableCell>{b.autoclaved ? <Badge>Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                  <TableCell>{b.preparedBy?.name ?? "—"}</TableCell>
                  <TableCell>{format(new Date(b.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openPourDialog(b)}>
                      <FlaskConical className="mr-1 size-3" />
                      Pour
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pour Vessels Dialog */}
      <Dialog open={pourDialogOpen} onOpenChange={setPourDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pour Vessels — {pourBatch?.batchNumber}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Scan or type vessel barcodes to assign them to batch{" "}
            <span className="font-mono font-medium">{pourBatch?.batchNumber}</span>{" "}
            ({pourBatch?.recipe?.name}).
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); addPourBarcode(); }}
            className="flex gap-2"
          >
            <Input
              value={pourBarcode}
              onChange={(e) => setPourBarcode(e.target.value)}
              placeholder="Scan or type barcode..."
              className="flex-1 text-lg h-12"
              autoFocus
            />
            <Button type="submit" size="lg" disabled={!pourBarcode.trim()}>
              Add
            </Button>
          </form>

          {pourBarcodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{pourBarcodes.length} vessel{pourBarcodes.length !== 1 ? "s" : ""}</p>
              <div className="flex flex-wrap gap-2">
                {pourBarcodes.map((code) => (
                  <Badge key={code} variant="secondary" className="font-mono text-sm py-1 px-2">
                    {code}
                    <button onClick={() => removePourBarcode(code)} className="ml-1.5 hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handlePour}
            disabled={pouring || pourBarcodes.length === 0}
            className="w-full"
          >
            {pouring ? "Pouring..." : `Pour into ${pourBarcodes.length} Vessel${pourBarcodes.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
