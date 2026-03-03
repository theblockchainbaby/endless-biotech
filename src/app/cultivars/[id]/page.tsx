"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { CultivarHealthBadge, StageBadge, HealthBadge } from "@/components/status-badge";
import { STAGE_LABELS, HEALTH_STATUS_LABELS, VESSEL_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface CultivarMetrics {
  totalVessels: number;
  activeVessels: number;
  disposedVessels: number;
  totalExplants: number;
  contaminationRate: number;
  healthyRate: number;
  cultivarHealth: string;
  vesselsByStage: { stage: string; count: number }[];
  vesselsByHealthStatus: { status: string; count: number }[];
  vesselsByStatus: { status: string; count: number }[];
}

interface CultivarDetail {
  id: string;
  name: string;
  code: string | null;
  cultivarType: string;
  species: string;
  strain: string | null;
  geneticLineage: string | null;
  description: string | null;
  notes: string | null;
  targetMultiplicationRate: number | null;
  defaultMediaRecipe: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  metrics: CultivarMetrics;
}

export default function CultivarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cultivar, setCultivar] = useState<CultivarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchCultivar = () => {
    fetch(`/api/cultivars/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setCultivar(data);
        setNotes(data.notes || "");
      })
      .catch(() => setCultivar(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCultivar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/cultivars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      });
      if (res.ok) {
        toast.success("Notes saved");
      } else {
        toast.error("Failed to save notes");
      }
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!cultivar) return <div className="text-center py-12 text-muted-foreground">Cultivar not found</div>;

  const m = cultivar.metrics;

  // Build full stage list with counts (even 0)
  const stageEntries = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    key,
    label,
    count: m.vesselsByStage.find((s) => s.stage === key)?.count ?? 0,
  }));

  // Build full health status list
  const healthEntries = Object.entries(HEALTH_STATUS_LABELS).map(([key, label]) => ({
    key,
    label,
    count: m.vesselsByHealthStatus.find((s) => s.status === key)?.count ?? 0,
  }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cultivars">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader
            title={cultivar.name}
            description={cultivar.species + (cultivar.strain ? ` — ${cultivar.strain}` : "")}
            actions={<CultivarHealthBadge status={m.cultivarHealth} />}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-mono font-bold">{m.activeVessels}</p>
          <p className="text-xs text-muted-foreground">Active Vessels</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-mono font-bold">{m.totalExplants.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Explants</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className={`text-2xl font-mono font-bold ${m.contaminationRate > 10 ? "text-red-600" : ""}`}>
            {m.contaminationRate}%
          </p>
          <p className="text-xs text-muted-foreground">Contamination Rate</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-mono font-bold">{m.healthyRate}%</p>
          <p className="text-xs text-muted-foreground">Healthy Rate</p>
        </div>
      </div>

      {/* Vessels by Stage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vessels by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {stageEntries.map((s) => (
              <div key={s.key} className="text-center space-y-1">
                <StageBadge stage={s.key} />
                <p className="text-xl font-mono font-bold">{s.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vessels by Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vessels by Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {healthEntries.map((h) => (
              <div key={h.key} className="text-center space-y-1">
                <HealthBadge status={h.key} />
                <p className="text-xl font-mono font-bold">{h.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cultivar Details */}
      {(cultivar.description || cultivar.geneticLineage || cultivar.targetMultiplicationRate || cultivar.defaultMediaRecipe) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {cultivar.description && (
                <>
                  <span className="text-muted-foreground">Description</span>
                  <span>{cultivar.description}</span>
                </>
              )}
              {cultivar.geneticLineage && (
                <>
                  <span className="text-muted-foreground">Genetic Lineage</span>
                  <span>{cultivar.geneticLineage}</span>
                </>
              )}
              {cultivar.targetMultiplicationRate && (
                <>
                  <span className="text-muted-foreground">Target Multiplication Rate</span>
                  <span>{cultivar.targetMultiplicationRate}x</span>
                </>
              )}
              {cultivar.defaultMediaRecipe && (
                <>
                  <span className="text-muted-foreground">Default Media Recipe</span>
                  <Link href={`/media/${cultivar.defaultMediaRecipe.id}`} className="text-primary hover:underline">
                    {cultivar.defaultMediaRecipe.name}
                  </Link>
                </>
              )}
              <span className="text-muted-foreground">Total Vessels (all time)</span>
              <span className="font-mono">{m.totalVessels}</span>
              <span className="text-muted-foreground">Disposed</span>
              <span className="font-mono">{m.disposedVessels}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes & Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes & Observations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add observations, growing notes, or any remarks about this cultivar..."
            rows={4}
          />
          <Button onClick={handleSaveNotes} disabled={savingNotes} size="sm">
            {savingNotes ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
