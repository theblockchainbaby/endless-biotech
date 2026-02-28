"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StageBadge } from "@/components/status-badge";
import { BASE_MEDIA_TYPES, STAGE_LABELS, PGR_CATEGORIES } from "@/lib/constants";
import type { MediaRecipe, MediaComponent } from "@/lib/types";
import { toast } from "sonner";

const PGR_CATEGORY_LABELS: Record<string, string> = {
  pgr_cytokinin: "Cytokinin",
  pgr_auxin: "Auxin",
  pgr_gibberellin: "Gibberellin",
  vitamin: "Vitamin",
  mineral: "Mineral",
  amino_acid: "Amino Acid",
  other: "Other",
};

export default function MediaRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<(MediaRecipe & { _count?: { vessels: number; batches: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [baseMediaFilter, setBaseMediaFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New recipe form
  const [name, setName] = useState("");
  const [baseMedia, setBaseMedia] = useState<string>("");
  const [targetPH, setTargetPH] = useState("");
  const [agarConc, setAgarConc] = useState("");
  const [sucroseConc, setSucroseConc] = useState("");
  const [stage, setStage] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [components, setComponents] = useState<{ name: string; category: string; concentration: string; unit: string }[]>([]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (stageFilter !== "all") params.set("stage", stageFilter);
    if (baseMediaFilter !== "all") params.set("baseMedia", baseMediaFilter);
    const res = await fetch(`/api/media-recipes?${params}`);
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  }, [stageFilter, baseMediaFilter]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const addComponent = () => {
    setComponents([...components, { name: "", category: "pgr_cytokinin", concentration: "", unit: "mg/L" }]);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: string, value: string) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const resetForm = () => {
    setName("");
    setBaseMedia("");
    setTargetPH("");
    setAgarConc("");
    setSucroseConc("");
    setStage("");
    setNotes("");
    setComponents([]);
  };

  const handleCreate = async () => {
    if (!name || !baseMedia) {
      toast.error("Name and base media are required");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name,
        baseMedia,
      };
      if (targetPH) body.targetPH = parseFloat(targetPH);
      if (agarConc) body.agarConcentration = parseFloat(agarConc);
      if (sucroseConc) body.sucroseConcentration = parseFloat(sucroseConc);
      if (stage) body.stage = stage;
      if (notes) body.notes = notes;
      if (components.length > 0) {
        body.components = components
          .filter((c) => c.name && c.concentration)
          .map((c) => ({
            name: c.name,
            category: c.category,
            concentration: parseFloat(c.concentration),
            unit: c.unit,
          }));
      }

      const res = await fetch("/api/media-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Recipe created");
        setDialogOpen(false);
        resetForm();
        fetchRecipes();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create recipe");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Recipes"
        description="Manage culture media formulations"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>New Recipe</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Media Recipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Recipe Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MS + BAP 1.0" className="mt-1" />
                  </div>
                  <div>
                    <Label>Base Media</Label>
                    <Select value={baseMedia} onValueChange={setBaseMedia}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BASE_MEDIA_TYPES.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Target pH</Label>
                    <Input type="number" step="0.1" value={targetPH} onChange={(e) => setTargetPH(e.target.value)} placeholder="5.8" className="mt-1" />
                  </div>
                  <div>
                    <Label>Agar (g/L)</Label>
                    <Input type="number" step="0.1" value={agarConc} onChange={(e) => setAgarConc(e.target.value)} placeholder="7.0" className="mt-1" />
                  </div>
                  <div>
                    <Label>Sucrose (g/L)</Label>
                    <Input type="number" step="0.1" value={sucroseConc} onChange={(e) => setSucroseConc(e.target.value)} placeholder="30" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Target Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Any stage" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STAGE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* PGR Components */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Components (PGRs, vitamins, etc.)</Label>
                    <Button variant="outline" size="sm" onClick={addComponent}>Add Component</Button>
                  </div>
                  {components.map((comp, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                      <Input className="col-span-3" placeholder="Name" value={comp.name} onChange={(e) => updateComponent(i, "name", e.target.value)} />
                      <Select value={comp.category} onValueChange={(v) => updateComponent(i, "category", v)}>
                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PGR_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{PGR_CATEGORY_LABELS[c] || c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input className="col-span-2" type="number" step="0.01" placeholder="Conc." value={comp.concentration} onChange={(e) => updateComponent(i, "concentration", e.target.value)} />
                      <Input className="col-span-2" placeholder="Unit" value={comp.unit} onChange={(e) => updateComponent(i, "unit", e.target.value)} />
                      <Button variant="ghost" size="sm" className="col-span-2" onClick={() => removeComponent(i)}>Remove</Button>
                    </div>
                  ))}
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
                </div>

                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Create Recipe"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {Object.entries(STAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={baseMediaFilter} onValueChange={setBaseMediaFilter}>
              <SelectTrigger><SelectValue placeholder="Base Media" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Base Media</SelectItem>
                {BASE_MEDIA_TYPES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recipes */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No media recipes found. Create one to get started.</p>
      ) : (
        <>
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>pH</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead className="text-right">Vessels</TableHead>
                  <TableHead className="text-right">Batches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => router.push(`/media/${r.id}`)}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><Badge variant="outline">{r.baseMedia}</Badge></TableCell>
                    <TableCell>{r.targetPH ?? "—"}</TableCell>
                    <TableCell>{r.stage ? <StageBadge stage={r.stage} /> : "Any"}</TableCell>
                    <TableCell>{r.components?.length || 0}</TableCell>
                    <TableCell className="text-right font-mono">{r._count?.vessels ?? 0}</TableCell>
                    <TableCell className="text-right font-mono">{r._count?.batches ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {recipes.map((r) => (
              <Link key={r.id} href={`/media/${r.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-sm text-muted-foreground">{r.baseMedia} {r.targetPH ? `• pH ${r.targetPH}` : ""}</p>
                      </div>
                      {r.stage && <StageBadge stage={r.stage} />}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{r.components?.length || 0} components</span>
                      <span>{r._count?.vessels ?? 0} vessels</span>
                      <span>{r._count?.batches ?? 0} batches</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
