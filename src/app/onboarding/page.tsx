"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCATION_TYPES, LOCATION_TYPE_LABELS } from "@/lib/constants";
import { toast } from "sonner";

type Step = "welcome" | "site" | "locations" | "cultivar" | "done";

interface SiteData {
  name: string;
  address: string;
}

interface LocationData {
  name: string;
  type: string;
  capacity: string;
}

interface CultivarData {
  name: string;
  species: string;
  strain: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [saving, setSaving] = useState(false);

  // Site
  const [site, setSite] = useState<SiteData>({ name: "", address: "" });
  const [siteId, setSiteId] = useState<string | null>(null);

  // Locations
  const [locations, setLocations] = useState<LocationData[]>([
    { name: "", type: "growth_chamber", capacity: "" },
  ]);

  // Cultivar
  const [cultivar, setCultivar] = useState<CultivarData>({ name: "", species: "", strain: "" });

  const handleCreateSite = async () => {
    if (!site.name) {
      toast.error("Site name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(site),
      });
      if (res.ok) {
        const data = await res.json();
        setSiteId(data.id);
        toast.success("Site created");
        setStep("locations");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create site");
      }
    } finally {
      setSaving(false);
    }
  };

  const addLocation = () => {
    setLocations([...locations, { name: "", type: "bench", capacity: "" }]);
  };

  const updateLocation = (index: number, field: keyof LocationData, value: string) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleCreateLocations = async () => {
    const valid = locations.filter((l) => l.name.trim());
    if (valid.length === 0) {
      toast.error("Add at least one location");
      return;
    }
    if (!siteId) {
      toast.error("Create a site first");
      return;
    }
    setSaving(true);
    try {
      let created = 0;
      for (const loc of valid) {
        const res = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: loc.name,
            type: loc.type,
            siteId,
            capacity: loc.capacity ? parseInt(loc.capacity) : null,
          }),
        });
        if (res.ok) created++;
      }
      toast.success(`Created ${created} location${created > 1 ? "s" : ""}`);
      setStep("cultivar");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCultivar = async () => {
    if (!cultivar.name) {
      toast.error("Cultivar name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cultivars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cultivar.name,
          species: cultivar.species,
          strain: cultivar.strain || null,
        }),
      });
      if (res.ok) {
        toast.success("Cultivar created");
        setStep("done");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create cultivar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2 justify-center">
          {["welcome", "site", "locations", "cultivar", "done"].map((s, i) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                ["welcome", "site", "locations", "cultivar", "done"].indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
                  <path d="M7 20h10" />
                  <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                  <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
                  <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Welcome to VitrOS</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Let&apos;s set up your lab in a few quick steps. You&apos;ll create your first site, add growth locations, and register your first cultivar.
              </p>
              <Button onClick={() => setStep("site")} className="w-full" size="lg">
                Get Started
              </Button>
              <Button variant="ghost" onClick={() => router.push("/")} className="w-full">
                Skip — I&apos;ll set up later
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Site */}
        {step === "site" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Your Facility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Name your primary lab site. You can add more sites later.</p>
              <div>
                <Label>Facility Name</Label>
                <Input
                  value={site.name}
                  onChange={(e) => setSite({ ...site, name: e.target.value })}
                  placeholder="e.g., Main Lab, Building A"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label>Address (optional)</Label>
                <Input
                  value={site.address}
                  onChange={(e) => setSite({ ...site, address: e.target.value })}
                  placeholder="123 Lab Street"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreateSite} disabled={saving} className="w-full">
                {saving ? "Creating..." : "Create Site & Continue"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Locations */}
        {step === "locations" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Step 2: Growth Locations</CardTitle>
                <Button variant="outline" size="sm" onClick={addLocation}>+ Add</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Add your growth chambers, benches, and shelves. These are where vessels will be stored.</p>
              {locations.map((loc, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {i === 0 && <Label className="text-xs">Name</Label>}
                    <Input
                      value={loc.name}
                      onChange={(e) => updateLocation(i, "name", e.target.value)}
                      placeholder="e.g., Chamber 1"
                    />
                  </div>
                  <div className="w-36">
                    {i === 0 && <Label className="text-xs">Type</Label>}
                    <Select value={loc.type} onValueChange={(v) => updateLocation(i, "type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    {i === 0 && <Label className="text-xs">Capacity</Label>}
                    <Input
                      type="number"
                      value={loc.capacity}
                      onChange={(e) => updateLocation(i, "capacity", e.target.value)}
                      placeholder="—"
                    />
                  </div>
                  {locations.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeLocation(i)} className="text-destructive shrink-0">
                      X
                    </Button>
                  )}
                </div>
              ))}
              <Button onClick={handleCreateLocations} disabled={saving} className="w-full">
                {saving ? "Creating..." : "Save Locations & Continue"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Cultivar */}
        {step === "cultivar" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: First Cultivar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Register your first cultivar. You can add more from the Cultivars page anytime.</p>
              <div>
                <Label>Cultivar Name</Label>
                <Input
                  value={cultivar.name}
                  onChange={(e) => setCultivar({ ...cultivar, name: e.target.value })}
                  placeholder="e.g., Spathiphyllum, Monstera"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label>Species</Label>
                <Input
                  value={cultivar.species}
                  onChange={(e) => setCultivar({ ...cultivar, species: e.target.value })}
                  placeholder="e.g., Spathiphyllum wallisii"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Variety / Cultivar (optional)</Label>
                <Input
                  value={cultivar.strain}
                  onChange={(e) => setCultivar({ ...cultivar, strain: e.target.value })}
                  placeholder="e.g., Domino, Thai Constellation"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateCultivar} disabled={saving} className="flex-1">
                  {saving ? "Creating..." : "Create Cultivar"}
                </Button>
                <Button variant="outline" onClick={() => setStep("done")}>
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-600 dark:text-green-400">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <CardTitle className="text-2xl">You&apos;re All Set!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your lab is configured. Start by scanning your first vessel or importing your existing inventory via CSV.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/scan")} className="flex-1">
                  Scan First Vessel
                </Button>
                <Button variant="outline" onClick={() => router.push("/import")} className="flex-1">
                  CSV Import
                </Button>
              </div>
              <Button variant="ghost" onClick={() => router.push("/")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
