"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { CultivarHealthBadge } from "@/components/status-badge";
import type { Cultivar } from "@/lib/types";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface CultivarWithHealth extends Cultivar {
  cultivarHealth: string;
}

export default function CultivarsPage() {
  const router = useRouter();
  const [cultivars, setCultivars] = useState<CultivarWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filtered = cultivars.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.species.toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    );
  });

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

  const handleDelete = async (e: React.MouseEvent, id: string, cultivarName: string) => {
    e.stopPropagation();
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search cultivars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>{search ? "No cultivars match your search." : "No cultivars yet. Add your first cultivar to get started."}</p>
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
                  <TableHead>Health</TableHead>
                  <TableHead className="text-right">Vessels</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/cultivars/${c.id}`)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.species}</TableCell>
                    <TableCell>
                      <CultivarHealthBadge status={c.cultivarHealth} />
                    </TableCell>
                    <TableCell className="text-right font-mono">{c._count?.vessels ?? 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, c.id, c.name)}
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
            {filtered.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/cultivars/${c.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <CultivarHealthBadge status={c.cultivarHealth} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{c.species}</p>
                    <span className="text-sm text-muted-foreground font-mono">{c._count?.vessels ?? 0} vessels</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
