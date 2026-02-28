"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useCurrentUser } from "@/components/user-provider";
import { toast } from "sonner";

interface Vessel {
  id: string;
  barcode: string;
  cultivar: { name: string } | null;
  mediaType: string | null;
  explantCount: number;
  status: string;
}

interface NewVessel {
  barcode: string;
  explantCount: number;
  mediaType: string;
  notes: string;
}

export default function MultiplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [parent, setParent] = useState<Vessel | null>(null);
  const { currentUser } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newVessels, setNewVessels] = useState<NewVessel[]>([]);
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/vessels/${id}`)
      .then((r) => r.json())
      .then(setParent)
      .finally(() => setLoading(false));
  }, [id]);

  const addVessel = () => {
    setNewVessels([...newVessels, { barcode: "", explantCount: 0, mediaType: parent?.mediaType || "", notes: "" }]);
  };

  const updateVessel = (index: number, field: keyof NewVessel, value: string | number) => {
    const updated = [...newVessels];
    updated[index] = { ...updated[index], [field]: value };
    setNewVessels(updated);
  };

  const removeVessel = (index: number) => {
    setNewVessels(newVessels.filter((_, i) => i !== index));
  };

  const handleBarcodeScan = (barcode: string, index: number) => {
    updateVessel(index, "barcode", barcode);
    setScanningIndex(null);
  };

  const handleSubmit = async () => {
    if (newVessels.length === 0) {
      toast.error("Add at least one child vessel");
      return;
    }
    const empty = newVessels.find((v) => !v.barcode);
    if (empty) {
      toast.error("All vessels need a barcode");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/vessels/${id}/multiply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newVessels: newVessels.map((v) => ({
            barcode: v.barcode,
            explantCount: v.explantCount,
            mediaType: v.mediaType || null,
            notes: v.notes || null,
          })),
          userId: currentUser?.id || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Multiplication failed");
        return;
      }

      toast.success(`Created ${newVessels.length} new vessels from ${parent?.barcode}`);
      router.push(`/vessels/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!parent) return <div className="text-center py-12 text-muted-foreground">Vessel not found</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Multiply Vessel</h1>
        <p className="text-muted-foreground">Split {parent.barcode} into new vessels</p>
      </div>

      {/* Parent info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parent Vessel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Barcode</span>
            <span className="font-mono">{parent.barcode}</span>
            <span className="text-muted-foreground">Cultivar</span>
            <span>{parent.cultivar?.name || "—"}</span>
            <span className="text-muted-foreground">Current Explants</span>
            <span className="font-mono">{parent.explantCount}</span>
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={parent.status} />
          </div>
        </CardContent>
      </Card>

      {/* New vessels */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">New Child Vessels ({newVessels.length})</h2>
          <Button onClick={addVessel} variant="outline" size="sm">
            + Add Vessel
          </Button>
        </div>

        {newVessels.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Click &quot;Add Vessel&quot; to start adding child vessels</p>
            </CardContent>
          </Card>
        )}

        {newVessels.map((nv, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vessel #{i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeVessel(i)} className="text-destructive">
                  Remove
                </Button>
              </div>

              {scanningIndex === i ? (
                <BarcodeScanner
                  onScan={(code) => handleBarcodeScan(code, i)}
                  placeholder="Scan child vessel barcode..."
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>Barcode</Label>
                    <div className="flex gap-2">
                      <Input
                        value={nv.barcode}
                        onChange={(e) => updateVessel(i, "barcode", e.target.value)}
                        placeholder="Vessel barcode"
                        className="font-mono flex-1"
                      />
                      <Button variant="outline" size="sm" onClick={() => setScanningIndex(i)}>
                        Scan
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Explant Count</Label>
                    <Input
                      type="number"
                      value={nv.explantCount}
                      onChange={(e) => updateVessel(i, "explantCount", parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Media Type</Label>
                    <Input
                      value={nv.mediaType}
                      onChange={(e) => updateVessel(i, "mediaType", e.target.value)}
                      placeholder="e.g., MS Basal"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={nv.notes}
                      onChange={(e) => updateVessel(i, "notes", e.target.value)}
                      placeholder="Optional..."
                      rows={1}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {newVessels.length > 0 && (
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            {submitting ? "Creating..." : `Multiply into ${newVessels.length} Vessels`}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
