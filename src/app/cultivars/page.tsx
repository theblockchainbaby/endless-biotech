"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import type { Cultivar } from "@/lib/types";
import { toast } from "sonner";

export default function CultivarsPage() {
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Cannabis");
  const [description, setDescription] = useState("");

  const fetchCultivars = () => {
    fetch("/api/cultivars")
      .then((r) => r.json())
      .then(setCultivars)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCultivars();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const res = await fetch("/api/cultivars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), species, description: description || null }),
    });
    if (res.ok) {
      toast.success(`Cultivar "${name}" created`);
      setName("");
      setSpecies("Cannabis");
      setDescription("");
      setOpen(false);
      fetchCultivars();
    } else {
      toast.error("Failed to create cultivar");
    }
  };

  const handleDelete = async (id: string, cultivarName: string) => {
    if (!confirm(`Delete cultivar "${cultivarName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/cultivars/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Deleted "${cultivarName}"`);
      fetchCultivars();
    } else {
      toast.error("Failed to delete. Make sure no vessels are using this cultivar.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cultivars"
        description="Manage plant species and cultivar library"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Cultivar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Cultivar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Blue Dream" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>Species</Label>
                  <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="e.g., Cannabis, Date Palm" />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes about this cultivar" />
                </div>
                <Button onClick={handleCreate} className="w-full">Create Cultivar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : cultivars.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No cultivars yet. Add your first cultivar to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Vessels</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cultivars.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.species}</TableCell>
                    <TableCell className="text-muted-foreground">{c.description || "—"}</TableCell>
                    <TableCell className="text-right font-mono">{c._count?.vessels ?? 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id, c.name)}
                        className="text-destructive"
                        disabled={(c._count?.vessels ?? 0) > 0}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {cultivars.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <span className="text-sm text-muted-foreground font-mono">{c._count?.vessels ?? 0} vessels</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.species}</p>
                  {c.description && <p className="text-sm mt-1">{c.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
