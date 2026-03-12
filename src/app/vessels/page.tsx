"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, HealthBadge, StageBadge } from "@/components/status-badge";
import { VESSEL_STATUS_LABELS, HEALTH_STATUS_LABELS, STAGE_LABELS } from "@/lib/constants";
import { exportToCSV, flattenVesselForExport } from "@/lib/csv-export";
import { ImportDialog } from "@/components/import-dialog";
import type { Vessel, Cultivar } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ArrowUp, Trash2, Heart, X } from "lucide-react";

type Tab = "active" | "media_prep" | "all";
type BatchAction = "advance_stage" | "health_check" | "dispose";

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("active");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cultivarFilter, setCultivarFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mediaPrepCount, setMediaPrepCount] = useState(0);
  const [importOpen, setImportOpen] = useState(false);

  // Multi-select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchVessels = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (cultivarFilter !== "all") params.set("cultivarId", cultivarFilter);
    if (healthFilter !== "all") params.set("healthStatus", healthFilter);
    if (stageFilter !== "all") params.set("stage", stageFilter);

    // Tab-based status filtering
    if (tab === "media_prep") {
      params.set("status", "media_filled");
    } else if (tab === "active") {
      params.set("excludeStatuses", "media_filled,multiplied,disposed");
    } else if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    const res = await fetch(`/api/vessels?${params}`);
    const data = await res.json();
    setVessels(data.vessels);
    setTotal(data.total);
    if (data.mediaPrepCount !== undefined) setMediaPrepCount(data.mediaPrepCount);
    setLoading(false);
  }, [page, search, tab, statusFilter, cultivarFilter, healthFilter, stageFilter]);

  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

  useEffect(() => {
    fetch("/api/cultivars").then((r) => r.json()).then(setCultivars);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, tab, statusFilter, cultivarFilter, healthFilter, stageFilter]);

  // Clear selection when filters/page change
  useEffect(() => {
    setSelected(new Set());
  }, [page, tab, statusFilter, cultivarFilter, healthFilter, stageFilter]);

  const totalPages = Math.ceil(total / 50);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === vessels.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(vessels.map((v) => v.id)));
    }
  };

  const handleBatchAction = async (action: BatchAction, params?: Record<string, unknown>) => {
    if (selected.size === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/vessels/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselIds: Array.from(selected),
          action,
          params,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.success} of ${data.total} vessels updated`);
        setSelected(new Set());
        fetchVessels();
      } else {
        toast.error(data.error || "Batch operation failed");
      }
    } catch {
      toast.error("Batch operation failed");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessels"
        description={tab === "media_prep" ? `${total} media-filled vessels` : `${total.toLocaleString()} vessels`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = vessels.map((v) => flattenVesselForExport(v as unknown as Record<string, unknown>));
                exportToCSV(rows, "vessels-export");
              }}
            >
              Export CSV
            </Button>
            <Link href="/scan">
              <Button>Scan New</Button>
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex rounded-lg bg-muted p-1 w-fit">
        {([
          { key: "active" as Tab, label: "Active" },
          { key: "media_prep" as Tab, label: `Media Prep${mediaPrepCount > 0 ? ` (${mediaPrepCount})` : ""}` },
          { key: "all" as Tab, label: "All" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className={`grid grid-cols-2 ${tab === "all" ? "md:grid-cols-5" : "md:grid-cols-4"} gap-3`}>
            <Input
              placeholder="Search barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {tab === "all" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(VESSEL_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {Object.entries(STAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cultivarFilter} onValueChange={setCultivarFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Cultivar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cultivars</SelectItem>
                {cultivars.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health</SelectItem>
                {Object.entries(HEALTH_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Batch Action Bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 shadow-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="secondary"
            disabled={batchLoading}
            onClick={() => handleBatchAction("advance_stage")}
          >
            <ArrowUp className="size-3.5 mr-1.5" /> Advance Stage
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={batchLoading}
            onClick={() => handleBatchAction("health_check", { healthStatus: "healthy" })}
          >
            <Heart className="size-3.5 mr-1.5" /> Mark Healthy
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="text-red-600"
            disabled={batchLoading}
            onClick={() => {
              if (confirm(`Dispose ${selected.size} vessels? This cannot be undone.`)) {
                handleBatchAction("dispose", { reason: "Batch disposal from vessel list" });
              }
            }}
          >
            <Trash2 className="size-3.5 mr-1.5" /> Dispose
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setSelected(new Set())}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : vessels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-lg font-medium">No vessels found</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Vessels are the core of your lab — each one tracks a jar from initiation through hardening.
              Scan a barcode or import a CSV to get started.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button asChild size="sm">
                <Link href="/scan">Scan First Vessel</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/import">Import CSV</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={vessels.length > 0 && selected.size === vessels.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Cultivar</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Explants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.map((v) => (
                  <TableRow
                    key={v.id}
                    className={selected.has(v.id) ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(v.id)}
                        onCheckedChange={() => toggleSelect(v.id)}
                        aria-label={`Select ${v.barcode}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link href={`/vessels/${v.id}`} className="font-mono hover:underline">
                        {v.barcode}
                      </Link>
                    </TableCell>
                    <TableCell>{v.cultivar?.name || "—"}</TableCell>
                    <TableCell><StageBadge stage={v.stage} /></TableCell>
                    <TableCell className="text-right font-mono">{v.explantCount}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell><HealthBadge status={v.healthStatus} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {vessels.map((v) => (
              <div key={v.id} className="flex items-start gap-2">
                <Checkbox
                  checked={selected.has(v.id)}
                  onCheckedChange={() => toggleSelect(v.id)}
                  className="mt-4"
                  aria-label={`Select ${v.barcode}`}
                />
                <Link href={`/vessels/${v.id}`} className="flex-1">
                  <Card className={`hover:bg-accent/50 transition-colors ${selected.has(v.id) ? "bg-primary/5" : ""}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono font-medium">{v.barcode}</p>
                          <p className="text-sm text-muted-foreground">{v.cultivar?.name || "No cultivar"}</p>
                        </div>
                        <div className="flex gap-1">
                          <StageBadge stage={v.stage} />
                          <StatusBadge status={v.status} />
                          <HealthBadge status={v.healthStatus} />
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>{v.explantCount} explants</span>
                        <span>{formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onComplete={fetchVessels}
      />
    </div>
  );
}
