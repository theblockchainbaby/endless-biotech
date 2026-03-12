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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CULTIVAR_TYPE_LABELS } from "@/lib/constants";
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
  const [code, setCode] = useState("");
  const [cultivarType, setCultivarType] = useState("in_house");
  const [species, setSpecies] = useState("");
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
      (c.code || "").toLowerCase().includes(q) ||
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
      body: JSON.stringify({
        name: name.trim(),
        code: code.trim() || null,
        cultivarType,
        species,
        description: description || null,
      }),
    });
    if (res.ok) {
      toast.success(`Cultivar "${name}" created`);
      setName("");
      setCode("");
      setCultivarType("in_house");
      setSpecies("");
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Runtz" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g., AA01" className="font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={cultivarType} onValueChange={setCultivarType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_house">In-House</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Species</Label>
                    <Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="e.g., Spathiphyllum wallisii" />
                  </div>
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
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-lg font-medium">{search ? "No cultivars match your search" : "No cultivars yet"}</p>
            {!search && (
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Cultivars define your plant varieties — each with its own stage pipeline, multiplication rates, and health tracking. Add your first cultivar to start building your library.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell className="font-mono text-muted-foreground">{c.code || "—"}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded ${c.cultivarType === "client" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}>
                        {CULTIVAR_TYPE_LABELS[c.cultivarType] || c.cultivarType}
                      </span>
                    </TableCell>
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
                    <div className="flex items-center gap-2">
                      {c.code && <span className="font-mono text-xs text-muted-foreground">{c.code}</span>}
                      <CardTitle className="text-base">{c.name}</CardTitle>
                    </div>
                    <CultivarHealthBadge status={c.cultivarHealth} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${c.cultivarType === "client" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}>
                        {CULTIVAR_TYPE_LABELS[c.cultivarType] || c.cultivarType}
                      </span>
                    </div>
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
