"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, HealthBadge, StageBadge } from "@/components/status-badge";
import { StagePipeline } from "@/components/stage-pipeline";
import { LocationPicker } from "@/components/location-picker";
import { PhotoCapture } from "@/components/photo-capture";
import { PhotoGallery } from "@/components/photo-gallery";
import { Input } from "@/components/ui/input";
import { HEALTH_STATUSES, HEALTH_STATUS_LABELS, CONTAMINATION_TYPES, STAGES, DEFAULT_SUBCULTURE_INTERVAL_DAYS } from "@/lib/constants";
import type { Vessel, Photo, Protocol, Cultivar } from "@/lib/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export default function VesselDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  // Action states
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState("healthy");
  const [contaminationType, setContaminationType] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [updatingHealth, setUpdatingHealth] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveLocationId, setMoveLocationId] = useState("");
  const [moveNotes, setMoveNotes] = useState("");
  const [moving, setMoving] = useState(false);
  const [advanceConfirmOpen, setAdvanceConfirmOpen] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [plantDialogOpen, setPlantDialogOpen] = useState(false);
  const [plantCultivarId, setPlantCultivarId] = useState("");
  const [plantExplantCount, setPlantExplantCount] = useState("1");
  const [plantNotes, setPlantNotes] = useState("");
  const [planting, setPlanting] = useState(false);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGeneration, setEditGeneration] = useState("0");
  const [editSubcultureNumber, setEditSubcultureNumber] = useState("0");
  const [editExplantCount, setEditExplantCount] = useState("0");
  const [editLastSubcultureDate, setEditLastSubcultureDate] = useState("");
  const [editNextSubcultureDate, setEditNextSubcultureDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchVessel = () => {
    fetch(`/api/vessels/${id}`)
      .then((r) => r.json())
      .then(setVessel)
      .finally(() => setLoading(false));
  };

  const fetchPhotos = () => {
    fetch(`/api/photos?vesselId=${id}`)
      .then((r) => r.json())
      .then(setPhotos)
      .catch(() => {});
  };

  const fetchProtocols = (stage: string) => {
    fetch(`/api/protocols?stage=${stage}`)
      .then((r) => r.json())
      .then(setProtocols)
      .catch(() => {});
  };

  useEffect(() => {
    fetchVessel();
    fetchPhotos();
    fetch("/api/cultivars").then((r) => r.json()).then(setCultivars).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (vessel?.stage) fetchProtocols(vessel.stage);
  }, [vessel?.stage]);

  const handleAdvanceStage = async () => {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/vessels/${id}/advance-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: advanceNotes || undefined }),
      });
      if (res.ok) {
        toast.success("Stage advanced");
        setAdvanceNotes("");
        fetchVessel();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to advance stage");
      }
    } finally {
      setAdvancing(false);
    }
  };

  const handleHealthCheck = async () => {
    setUpdatingHealth(true);
    try {
      const body: Record<string, unknown> = { healthStatus };
      if (contaminationType) {
        body.contaminationType = contaminationType;
      }
      if (healthNotes) body.notes = healthNotes;

      const res = await fetch(`/api/vessels/${id}/health-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Health updated");
        setHealthDialogOpen(false);
        setHealthStatus("healthy");
        setContaminationType("");
        setHealthNotes("");
        fetchVessel();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } finally {
      setUpdatingHealth(false);
    }
  };

  const handleUndo = async () => {
    setUndoing(true);
    try {
      const res = await fetch(`/api/vessels/${id}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success("Last action undone");
        fetchVessel();
      } else {
        const err = await res.json();
        toast.error(err.error || "Cannot undo");
      }
    } finally {
      setUndoing(false);
    }
  };

  const handleMove = async () => {
    if (!moveLocationId) {
      toast.error("Select a location");
      return;
    }
    setMoving(true);
    try {
      const res = await fetch(`/api/vessels/${id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: moveLocationId, notes: moveNotes || undefined }),
      });
      if (res.ok) {
        toast.success("Vessel moved");
        setMoveDialogOpen(false);
        setMoveLocationId("");
        setMoveNotes("");
        fetchVessel();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } finally {
      setMoving(false);
    }
  };

  const handlePlant = async () => {
    if (!plantCultivarId) {
      toast.error("Select a cultivar");
      return;
    }
    setPlanting(true);
    try {
      const res = await fetch(`/api/vessels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cultivarId: plantCultivarId,
          explantCount: parseInt(plantExplantCount) || 1,
          status: "planted",
          notes: plantNotes || null,
        }),
      });
      if (res.ok) {
        toast.success("Vessel planted");
        setPlantDialogOpen(false);
        fetchVessel();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } finally {
      setPlanting(false);
    }
  };

  const openEditDialog = () => {
    if (!vessel) return;
    setEditGeneration(String(vessel.generation));
    setEditSubcultureNumber(String(vessel.subcultureNumber));
    setEditExplantCount(String(vessel.explantCount));
    setEditLastSubcultureDate(vessel.lastSubcultureDate ? vessel.lastSubcultureDate.slice(0, 10) : "");
    setEditNextSubcultureDate(vessel.nextSubcultureDate ? vessel.nextSubcultureDate.slice(0, 10) : "");
    setEditNotes(vessel.notes || "");
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        generation: parseInt(editGeneration) || 0,
        subcultureNumber: parseInt(editSubcultureNumber) || 0,
        explantCount: parseInt(editExplantCount) || 0,
        notes: editNotes || null,
      };
      if (editLastSubcultureDate) {
        payload.lastSubcultureDate = new Date(editLastSubcultureDate).toISOString();
      } else {
        payload.lastSubcultureDate = null;
      }
      if (editNextSubcultureDate) {
        payload.nextSubcultureDate = new Date(editNextSubcultureDate).toISOString();
      }

      const res = await fetch(`/api/vessels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Details updated");
        setEditDialogOpen(false);
        fetchVessel();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLastSubcultureDateChange = (value: string) => {
    setEditLastSubcultureDate(value);
    if (value) {
      const next = new Date(value);
      next.setDate(next.getDate() + DEFAULT_SUBCULTURE_INTERVAL_DAYS);
      setEditNextSubcultureDate(next.toISOString().slice(0, 10));
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading vessel...</div>;
  if (!vessel) return <div className="text-center py-12 text-muted-foreground">Vessel not found</div>;

  const isActive = vessel.status !== "disposed" && vessel.status !== "multiplied";
  const currentStageIndex = STAGES.indexOf(vessel.stage as typeof STAGES[number]);
  const canAdvance = isActive && currentStageIndex >= 0 && currentStageIndex < STAGES.length - 1;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={vessel.barcode}
        description={vessel.cultivar?.name || "No cultivar assigned"}
        actions={
          <div className="flex gap-2">
            <StageBadge stage={vessel.stage} />
            <StatusBadge status={vessel.status} />
            <HealthBadge status={vessel.healthStatus} />
          </div>
        }
      />

      {/* Stage Pipeline */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <StagePipeline currentStage={vessel.stage} />
        </CardContent>
      </Card>

      {/* SOP for Current Stage */}
      {protocols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SOP: {protocols[0].name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {protocols[0].safetyNotes && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-2 text-sm text-amber-700 dark:text-amber-300">
                {protocols[0].safetyNotes}
              </div>
            )}
            {protocols[0].steps.map((step: { order: number; instruction: string; duration?: string; critical?: boolean }, i: number) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.critical ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>
                  {step.order}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{step.instruction}</p>
                  {step.duration && <p className="text-xs text-muted-foreground">{step.duration}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Plant Action for media_filled vessels */}
      {vessel.status === "media_filled" && (
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-200">Media Prep Vessel</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">This vessel has media but no plant yet. Assign a cultivar to activate it.</p>
              </div>
              <Dialog open={plantDialogOpen} onOpenChange={setPlantDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Plant</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Plant Vessel</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Cultivar</Label>
                      <Select value={plantCultivarId} onValueChange={setPlantCultivarId}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select cultivar" /></SelectTrigger>
                        <SelectContent>
                          {cultivars.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Explant Count</Label>
                      <Input type="number" min="1" value={plantExplantCount} onChange={(e) => setPlantExplantCount(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={plantNotes} onChange={(e) => setPlantNotes(e.target.value)} rows={2} className="mt-1" placeholder="Optional..." />
                    </div>
                    <Button onClick={handlePlant} disabled={planting} className="w-full">
                      {planting ? "Planting..." : "Plant Vessel"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {isActive && vessel.status !== "media_filled" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/scan")}>
            Scan Another
          </Button>
          <Button size="sm" onClick={() => router.push(`/multiply/${vessel.id}`)}>
            Multiply
          </Button>
          {canAdvance && (
            <Button size="sm" variant="secondary" onClick={() => setAdvanceConfirmOpen(true)} disabled={advancing}>
              {advancing ? "Advancing..." : "Advance Stage"}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleUndo} disabled={undoing}>
            {undoing ? "Undoing..." : "Undo Last"}
          </Button>
          <Dialog open={healthDialogOpen} onOpenChange={setHealthDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Health Check</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Health Check</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Health Status</Label>
                  <Select value={healthStatus} onValueChange={setHealthStatus}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HEALTH_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{HEALTH_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(healthStatus === "critical" || healthStatus === "necrotic" || healthStatus === "dead") && (
                  <div>
                    <Label>Contamination Type</Label>
                    <Select value={contaminationType} onValueChange={setContaminationType}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {CONTAMINATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Notes</Label>
                  <Textarea value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} rows={2} className="mt-1" />
                </div>
                <Button onClick={handleHealthCheck} disabled={updatingHealth} className="w-full">
                  {updatingHealth ? "Saving..." : "Save Health Check"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" onClick={openEditDialog}>Edit Details</Button>
          <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Move</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Move Vessel</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Destination</Label>
                  <div className="mt-1">
                    <LocationPicker value={moveLocationId} onChange={setMoveLocationId} />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={moveNotes} onChange={(e) => setMoveNotes(e.target.value)} rows={2} className="mt-1" />
                </div>
                <Button onClick={handleMove} disabled={moving} className="w-full">
                  {moving ? "Moving..." : "Move Vessel"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Vessel Details</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Generation</Label>
                    <Input type="number" min="0" value={editGeneration} onChange={(e) => setEditGeneration(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Subculture #</Label>
                    <Input type="number" min="0" value={editSubcultureNumber} onChange={(e) => setEditSubcultureNumber(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Explants</Label>
                    <Input type="number" min="0" value={editExplantCount} onChange={(e) => setEditExplantCount(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Last Subculture Date</Label>
                    <Input type="date" value={editLastSubcultureDate} onChange={(e) => handleLastSubcultureDateChange(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Next Subculture Date</Label>
                    <Input type="date" value={editNextSubcultureDate} onChange={(e) => setEditNextSubcultureDate(e.target.value)} className="mt-1" />
                    {editLastSubcultureDate && !editNextSubcultureDate && (
                      <p className="text-xs text-muted-foreground mt-1">Auto-calculated from last + 14 days</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="mt-1" placeholder="Optional notes..." />
                </div>
                <Button onClick={handleEditSave} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vessel Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <span className="text-muted-foreground">Barcode</span>
            <span className="font-mono">{vessel.barcode}</span>
            <span className="text-muted-foreground">Cultivar</span>
            <span>{vessel.cultivar?.name || "—"}</span>
            <span className="text-muted-foreground">Species</span>
            <span>{vessel.cultivar?.species || "—"}</span>
            <span className="text-muted-foreground">Media Recipe</span>
            <span>{vessel.mediaRecipe?.name || "—"}</span>
            <span className="text-muted-foreground">Stage</span>
            <StageBadge stage={vessel.stage} />
            <span className="text-muted-foreground">Explant Count</span>
            <span className="font-mono">{vessel.explantCount}</span>
            <span className="text-muted-foreground">Generation</span>
            <span className="font-mono">{vessel.generation}</span>
            <span className="text-muted-foreground">Subculture #</span>
            <span className="font-mono">{vessel.subcultureNumber}</span>
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={vessel.status} />
            <span className="text-muted-foreground">Health</span>
            <HealthBadge status={vessel.healthStatus} />
            <span className="text-muted-foreground">Location</span>
            <span>
              {vessel.location ? (
                <Link href={`/locations/${vessel.location.id}`} className="hover:underline">
                  {vessel.location.name}
                </Link>
              ) : "—"}
            </span>
            <span className="text-muted-foreground">Created</span>
            <span>{format(new Date(vessel.createdAt), "MMM d, yyyy h:mm a")}</span>
            <span className="text-muted-foreground">Last Updated</span>
            <span>{formatDistanceToNow(new Date(vessel.updatedAt), { addSuffix: true })}</span>
            {vessel.lastSubcultureDate && (
              <>
                <span className="text-muted-foreground">Last Subculture</span>
                <span>{format(new Date(vessel.lastSubcultureDate), "MMM d, yyyy")}</span>
              </>
            )}
            {vessel.nextSubcultureDate && (
              <>
                <span className="text-muted-foreground">Next Subculture</span>
                <span>{format(new Date(vessel.nextSubcultureDate), "MMM d, yyyy")}</span>
              </>
            )}
            {vessel.contaminationType && (
              <>
                <span className="text-muted-foreground">Contamination</span>
                <span className="capitalize text-red-500">{vessel.contaminationType}</span>
              </>
            )}
            {vessel.notes && (
              <>
                <span className="text-muted-foreground">Notes</span>
                <span>{vessel.notes}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Batch Traceability */}
      {vessel.mediaBatch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <span className="text-muted-foreground">Batch Number</span>
              <span className="font-mono font-medium">{vessel.mediaBatch.batchNumber}</span>
              <span className="text-muted-foreground">Recipe</span>
              <span>{vessel.mediaBatch.recipe?.name ?? "—"}</span>
              <span className="text-muted-foreground">Volume</span>
              <span>{vessel.mediaBatch.volumeL}L</span>
              <span className="text-muted-foreground">Measured pH</span>
              <span>{vessel.mediaBatch.measuredPH ?? "—"}</span>
              <span className="text-muted-foreground">Autoclaved</span>
              <span>{vessel.mediaBatch.autoclaved ? "Yes" : "No"}</span>
              <span className="text-muted-foreground">Prepared By</span>
              <span>{vessel.mediaBatch.preparedBy?.name ?? "—"}</span>
              <span className="text-muted-foreground">Prepared On</span>
              <span>{format(new Date(vessel.mediaBatch.createdAt), "MMM d, yyyy h:mm a")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PhotoGallery photos={photos} />
          {isActive && (
            <>
              <Separator />
              <PhotoCapture
                vesselId={id}
                stage={vessel.stage}
                onUploaded={() => fetchPhotos()}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Lineage */}
      {(vessel.parentVessel || (vessel.childVessels && vessel.childVessels.length > 0)) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Lineage</CardTitle>
              <Link href={`/vessels/${vessel.id}/lineage`}>
                <Button variant="outline" size="sm">View Full Tree</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {vessel.parentVessel && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Parent Vessel</p>
                <Link href={`/vessels/${vessel.parentVessel.id}`} className="font-mono text-sm hover:underline">
                  {vessel.parentVessel.barcode}
                </Link>
              </div>
            )}
            {vessel.childVessels && vessel.childVessels.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Child Vessels ({vessel.childVessels.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vessel.childVessels.map((child) => (
                    <Link
                      key={child.id}
                      href={`/vessels/${child.id}`}
                      className="flex items-center justify-between p-2 rounded-md border hover:bg-accent/50 transition-colors"
                    >
                      <span className="font-mono text-sm">{child.barcode}</span>
                      <StatusBadge status={child.status} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {!vessel.activities || vessel.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded</p>
          ) : (
            <div className="space-y-3">
              {vessel.activities.map((a, i) => (
                <div key={a.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium capitalize">{a.type.replace(/_/g, " ")}</p>
                      {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                      {a.user && <p className="text-xs text-muted-foreground">by {a.user.name}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(a.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={advanceConfirmOpen}
        onOpenChange={setAdvanceConfirmOpen}
        title={`Advance to next stage?`}
        description={`This will move vessel ${vessel.barcode} from "${vessel.stage}" to the next stage. This change is logged and can be undone within 30 minutes.`}
        confirmLabel="Advance Stage"
        onConfirm={handleAdvanceStage}
      />
    </div>
  );
}
