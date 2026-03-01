"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StageBadge } from "@/components/status-badge";
import { PROTOCOL_STAGES, PROTOCOL_STAGE_LABELS } from "@/lib/constants";
import type { Protocol, ProtocolStep } from "@/lib/types";
import { toast } from "sonner";

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewProtocol, setViewProtocol] = useState<Protocol | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [stage, setStage] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [steps, setSteps] = useState<ProtocolStep[]>([
    { order: 1, instruction: "", duration: "", critical: false },
  ]);
  const [saving, setSaving] = useState(false);

  const fetchProtocols = () => {
    fetch("/api/protocols")
      .then((r) => r.json())
      .then(setProtocols)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProtocols(); }, []);

  const addStep = () => {
    setSteps((prev) => [...prev, { order: prev.length + 1, instruction: "", duration: "", critical: false }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const updateStep = (index: number, field: keyof ProtocolStep, value: string | boolean) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleCreate = async () => {
    if (!name || !stage || steps.some((s) => !s.instruction.trim())) {
      toast.error("Fill in name, stage, and all step instructions");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          stage,
          steps: steps.map((s) => ({
            order: s.order,
            instruction: s.instruction.trim(),
            duration: s.duration || undefined,
            critical: s.critical || undefined,
          })),
          safetyNotes: safetyNotes || null,
        }),
      });
      if (res.ok) {
        toast.success("Protocol created");
        setCreateOpen(false);
        resetForm();
        fetchProtocols();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create protocol");
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setStage("");
    setSafetyNotes("");
    setSteps([{ order: 1, instruction: "", duration: "", critical: false }]);
  };

  const grouped = PROTOCOL_STAGES.reduce((acc, s) => {
    const matching = protocols.filter((p) => p.stage === s);
    if (matching.length > 0) acc[s] = matching;
    return acc;
  }, {} as Record<string, Protocol[]>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SOPs & Protocols"
        description="Standard operating procedures for each stage"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>New Protocol</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Protocol</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Protocol Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Multiplication Transfer SOP" className="mt-1" />
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>
                      {PROTOCOL_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{PROTOCOL_STAGE_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Steps</Label>
                  <div className="space-y-3 mt-2">
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-sm text-muted-foreground mt-2 w-6 shrink-0">{step.order}.</span>
                        <div className="flex-1 space-y-1">
                          <Input
                            value={step.instruction}
                            onChange={(e) => updateStep(i, "instruction", e.target.value)}
                            placeholder="Step instruction..."
                          />
                          <div className="flex gap-2">
                            <Input
                              value={step.duration || ""}
                              onChange={(e) => updateStep(i, "duration", e.target.value)}
                              placeholder="Duration (e.g. 5 min)"
                              className="w-32 text-xs"
                            />
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={step.critical || false}
                                onChange={(e) => updateStep(i, "critical", e.target.checked)}
                              />
                              Critical
                            </label>
                          </div>
                        </div>
                        {steps.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeStep(i)} className="mt-1 text-xs">X</Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addStep} className="mt-2">+ Add Step</Button>
                </div>

                <div>
                  <Label>Safety Notes (optional)</Label>
                  <Textarea value={safetyNotes} onChange={(e) => setSafetyNotes(e.target.value)} rows={2} className="mt-1" placeholder="PPE requirements, hazards..." />
                </div>

                <Button onClick={handleCreate} disabled={saving} className="w-full">
                  {saving ? "Creating..." : "Create Protocol"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading protocols...</p>
      ) : protocols.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No protocols yet. Create your first SOP to get started.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([stageKey, prots]) => (
          <Card key={stageKey}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StageBadge stage={stageKey} />
                <span>{PROTOCOL_STAGE_LABELS[stageKey] || stageKey}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocol Name</TableHead>
                    <TableHead className="w-20">Steps</TableHead>
                    <TableHead className="w-20">Version</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prots.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.steps.length}</TableCell>
                      <TableCell>v{p.version}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setViewProtocol(p)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* View Protocol Dialog */}
      <Dialog open={!!viewProtocol} onOpenChange={() => setViewProtocol(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {viewProtocol && (
            <>
              <DialogHeader>
                <DialogTitle>{viewProtocol.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <StageBadge stage={viewProtocol.stage} />
                  <span className="text-sm text-muted-foreground">v{viewProtocol.version}</span>
                </div>

                {viewProtocol.safetyNotes && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Safety Notes</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{viewProtocol.safetyNotes}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {viewProtocol.steps.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.critical ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{step.instruction}</p>
                        {step.duration && (
                          <p className="text-xs text-muted-foreground mt-0.5">{step.duration}</p>
                        )}
                        {step.critical && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">CRITICAL STEP</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
