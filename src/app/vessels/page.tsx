"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge, HealthBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";

interface Cultivar {
  id: string;
  name: string;
}

interface Vessel {
  id: string;
  barcode: string;
  cultivar: Cultivar | null;
  mediaType: string | null;
  explantCount: number;
  healthStatus: string;
  status: string;
  updatedAt: string;
  parentVessel: { id: string; barcode: string } | null;
}

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cultivarFilter, setCultivarFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchVessels = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (cultivarFilter !== "all") params.set("cultivarId", cultivarFilter);
    if (healthFilter !== "all") params.set("healthStatus", healthFilter);

    const res = await fetch(`/api/vessels?${params}`);
    const data = await res.json();
    setVessels(data.vessels);
    setTotal(data.total);
    setLoading(false);
  }, [page, search, statusFilter, cultivarFilter, healthFilter]);

  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

  useEffect(() => {
    fetch("/api/cultivars").then((r) => r.json()).then(setCultivars);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, cultivarFilter, healthFilter]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vessels</h1>
          <p className="text-muted-foreground">{total.toLocaleString()} vessels total</p>
        </div>
        <Link href="/scan">
          <Button>Scan New</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              placeholder="Search barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="media_filled">Media Filled</SelectItem>
                <SelectItem value="planted">Planted</SelectItem>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="ready_to_multiply">Ready to Multiply</SelectItem>
                <SelectItem value="multiplied">Multiplied</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
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
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="contaminated">Contaminated</SelectItem>
                <SelectItem value="slow_growth">Slow Growth</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
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
                  <TableHead>Media</TableHead>
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
                    <TableCell>{v.mediaType || "—"}</TableCell>
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
    </div>
  );
}
