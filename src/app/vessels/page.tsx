"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, HealthBadge, StageBadge } from "@/components/status-badge";
import { VESSEL_STATUS_LABELS, HEALTH_STATUS_LABELS, STAGE_LABELS } from "@/lib/constants";
import { exportToCSV, flattenVesselForExport } from "@/lib/csv-export";
import { ImportDialog } from "@/components/import-dialog";
import type { Vessel, Cultivar } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

type Tab = "active" | "media_prep" | "all";

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

  const totalPages = Math.ceil(total / 50);

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

      {/* Table */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : vessels.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No vessels found</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={v.id}>
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
              <Link key={v.id} href={`/vessels/${v.id}`}>
                <Card className="hover:bg-accent/50 transition-colors">
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
