"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GitBranch, FlaskConical } from "lucide-react";
import { STAGE_LABELS } from "@/lib/constants";

interface CloneLine {
  id: string;
  name: string;
  code: string | null;
  cultivar: { id: string; name: string; code: string | null };
  sourceType: string;
  status: string;
  notes: string | null;
  vesselCount: number;
  byStage: Record<string, number>;
  byHealth: Record<string, number>;
  createdAt: string;
}

interface Cultivar {
  id: string;
  name: string;
  code: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600",
  retired: "bg-gray-500/10 text-gray-600",
  quarantined: "bg-red-500/10 text-red-600",
};

export default function CloneLinesPage() {
  const [cloneLines, setCloneLines] = useState<CloneLine[]>([]);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    cultivarId: "",
    sourceType: "mother_plant",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/clone-lines").then((r) => r.json()),
      fetch("/api/cultivars").then((r) => r.json()),
    ]).then(([lines, cultivarData]) => {
      setCloneLines(lines);
      setCultivars(Array.isArray(cultivarData) ? cultivarData : cultivarData.cultivars || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    const res = await fetch("/api/clone-lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        code: form.code || null,
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ name: "", code: "", cultivarId: "", sourceType: "mother_plant", notes: "" });
      const updated = await fetch("/api/clone-lines").then((r) => r.json());
      setCloneLines(updated);
    }
  }

  const totalVessels = cloneLines.reduce((sum, cl) => sum + cl.vesselCount, 0);
  const activeLines = cloneLines.filter((cl) => cl.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clone Lines"
        description="Track genetic lineages from mother plant through production"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active Lines</p>
            <p className="text-2xl font-bold">{activeLines}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Lines</p>
            <p className="text-2xl font-bold">{cloneLines.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Vessels Tracked</p>
            <p className="text-2xl font-bold">{totalVessels.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cultivars</p>
            <p className="text-2xl font-bold">{new Set(cloneLines.map((cl) => cl.cultivar.id)).size}</p>
          </CardContent>
        </Card>
      </div>

      {/* New clone line button */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" /> New Clone Line</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Clone Line</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Spathiphyllum-CL001"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Code (optional)</Label>
                <Input
                  placeholder="e.g. SP-001"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cultivar</Label>
                <Select value={form.cultivarId} onValueChange={(v) => setForm({ ...form, cultivarId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select cultivar" /></SelectTrigger>
                  <SelectContent>
                    {cultivars.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source Type</Label>
                <Select value={form.sourceType} onValueChange={(v) => setForm({ ...form, sourceType: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mother_plant">Mother Plant</SelectItem>
                    <SelectItem value="meristem">Meristem</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!form.name || !form.cultivarId}>
                Create Clone Line
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clone lines list */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : cloneLines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Clone Lines Yet</h3>
            <p className="text-muted-foreground mt-1">Create your first clone line to start tracking genetic lineages.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cloneLines.map((cl) => (
            <Card key={cl.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GitBranch className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{cl.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cl.cultivar.name} {cl.code && `(${cl.code})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[cl.status]}>{cl.status}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <FlaskConical className="size-3" /> {cl.vesselCount}
                    </Badge>
                  </div>
                </div>

                {/* Stage breakdown */}
                {cl.vesselCount > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(cl.byStage).map(([stage, count]) => (
                      <div key={stage} className="text-xs px-2 py-1 rounded bg-muted">
                        {STAGE_LABELS[stage] || stage}: <span className="font-mono font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {cl.notes && (
                  <p className="mt-3 text-sm text-muted-foreground">{cl.notes}</p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  Source: {cl.sourceType.replace("_", " ")} | Created {new Date(cl.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
