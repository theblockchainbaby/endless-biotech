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
import { HEALTH_STATUSES, HEALTH_STATUS_LABELS, CONTAMINATION_TYPES, STAGES } from "@/lib/constants";
import type { Vessel, Photo } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export default function VesselDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);

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

  useEffect(() => {
    fetchVessel();
    fetchPhotos();
  }, [id]);

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
      if (healthStatus === "contaminated" && contaminationType) {
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

      {/* Action Buttons */}
      {isActive && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/scan")}>
            Scan Another
          </Button>
          <Button size="sm" onClick={() => router.push(`/multiply/${vessel.id}`)}>
            Multiply
          </Button>
          {canAdvance && (
            <Button size="sm" variant="secondary" onClick={handleAdvanceStage} disabled={advancing}>
              {advancing ? "Advancing..." : "Advance Stage"}
            </Button>
          )}
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
                {healthStatus === "contaminated" && (
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
            <CardTitle className="text-base">Lineage</CardTitle>
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
    </div>
  );
}
