"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, AlertTriangle, CheckCircle, Clock, TrendingDown } from "lucide-react";
import {
  generateDemandProjections,
  generateLongRangeProjection,
  getDefaultStages,
  type DemandOrder,
  type DemandSummary,
} from "@/lib/demand-forecast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  cultivarId: string;
  cultivar: { id: string; name: string; code: string | null };
  quantity: number;
  unitType: string;
  dueDate: string;
  status: string;
  priority: string;
  notes: string | null;
}

interface Cultivar {
  id: string;
  name: string;
  code: string | null;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  on_track: <CheckCircle className="size-4 text-green-500" />,
  at_risk: <Clock className="size-4 text-amber-500" />,
  behind: <AlertTriangle className="size-4 text-red-500" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-600",
  normal: "bg-blue-500/10 text-blue-600",
  high: "bg-amber-500/10 text-amber-600",
  urgent: "bg-red-500/10 text-red-600",
};

export default function DemandPlanningPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [cultivars, setCultivars] = useState<Cultivar[]>([]);
  const [summary, setSummary] = useState<DemandSummary | null>(null);
  const [longRange, setLongRange] = useState<{ week: number; date: string; cumulativeOutput: number; byStage: Record<string, number> }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    orderNumber: "",
    customerName: "",
    cultivarId: "",
    quantity: "",
    unitType: "plugs",
    dueDate: "",
    priority: "normal",
    notes: "",
  });

  const loadData = useCallback(async () => {
    const [ordersRes, cultivarRes, statsRes] = await Promise.all([
      fetch("/api/sales-orders").then((r) => r.json()),
      fetch("/api/cultivars").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ]);

    const orderList: SalesOrder[] = ordersRes;
    const cultivarList: Cultivar[] = Array.isArray(cultivarRes) ? cultivarRes : cultivarRes.cultivars || [];
    setOrders(orderList);
    setCultivars(cultivarList);

    // Build pipeline counts by cultivar from stats
    const pipelineByCultivar: Record<string, number> = {};
    if (statsRes?.vesselsByCultivar) {
      statsRes.vesselsByCultivar.forEach((v: { cultivarId: string; count: number }) => {
        pipelineByCultivar[v.cultivarId] = (pipelineByCultivar[v.cultivarId] || 0) + v.count;
      });
    }

    // Generate demand projections
    const demandOrders: DemandOrder[] = orderList
      .filter((o) => o.status !== "fulfilled" && o.status !== "cancelled")
      .map((o) => ({
        id: o.id,
        customerName: o.customerName,
        cultivarName: o.cultivar.name,
        cultivarId: o.cultivarId,
        quantity: o.quantity,
        unitType: o.unitType,
        dueDate: o.dueDate,
        priority: o.priority,
      }));

    if (demandOrders.length > 0) {
      const projections = generateDemandProjections(demandOrders, pipelineByCultivar);
      setSummary(projections);
    }

    // Generate 10-month long-range projection
    const totalVessels = Object.values(pipelineByCultivar).reduce((sum, c) => sum + c, 0);
    if (totalVessels > 0) {
      const projection = generateLongRangeProjection(totalVessels, getDefaultStages(), 44);
      setLongRange(projection);
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate() {
    const res = await fetch("/api/sales-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: parseInt(form.quantity),
        notes: form.notes || null,
      }),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ orderNumber: "", customerName: "", cultivarId: "", quantity: "", unitType: "plugs", dueDate: "", priority: "normal", notes: "" });
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demand Planning"
        description="Top-down projections from sales orders to vessel requirements"
      />

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Ordered</p>
              <p className="text-2xl font-bold">{summary.totalOrdered.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">In Pipeline</p>
              <p className="text-2xl font-bold">{summary.totalInPipeline.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Production Gap <TrendingDown className="size-3" />
              </p>
              <p className={`text-2xl font-bold ${summary.totalGap > 0 ? "text-red-500" : "text-green-500"}`}>
                {summary.totalGap > 0 ? `${summary.totalGap.toLocaleString()}` : "None"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <p className="text-2xl font-bold">{summary.projections.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 10-Month Projection Chart */}
      {longRange.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">10-Month Production Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={longRange.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => [Number(value).toLocaleString(), "Cumulative Output"]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeOutput"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                  name="Cumulative Output"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weekly Initiation Schedule */}
      {summary && summary.weeklyInitiations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required Initiations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summary.weeklyInitiations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(label) => `Week of ${label}`}
                  formatter={(value, name) => [Number(value).toLocaleString(), name]}
                />
                <Legend />
                <Bar dataKey="vesselsToInitiate" fill="#3b82f6" name="Vessels to Initiate" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Orders + New Order */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sales Orders</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" /> New Order</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sales Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Order #</Label>
                  <Input value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Customer</Label>
                  <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="mt-1" />
                </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Unit Type</Label>
                  <Select value={form.unitType} onValueChange={(v) => setForm({ ...form, unitType: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plugs">Plugs</SelectItem>
                      <SelectItem value="liners">Liners</SelectItem>
                      <SelectItem value="rooted_cuttings">Rooted Cuttings</SelectItem>
                      <SelectItem value="tissue_culture_jars">TC Jars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={!form.orderNumber || !form.customerName || !form.cultivarId || !form.quantity || !form.dueDate}
              >
                Create Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Order projections */}
      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : summary && summary.projections.length > 0 ? (
        <div className="space-y-3">
          {summary.projections.map((p) => (
            <Card key={p.order.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {STATUS_ICONS[p.status]}
                    <div>
                      <h3 className="font-semibold">
                        {p.order.customerName} - {p.order.cultivarName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {p.order.quantity.toLocaleString()} {p.order.unitType} due {new Date(p.order.dueDate).toLocaleDateString()}
                        {" "}({p.weeksUntilDue} weeks)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={PRIORITY_COLORS[p.order.priority]}>{p.order.priority}</Badge>
                    <Badge variant={p.gap > 0 ? "destructive" : "secondary"}>
                      {p.gap > 0 ? `Gap: ${p.gap}` : "On Track"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="bg-muted rounded px-2 py-1">
                    <span className="text-muted-foreground">In Pipeline:</span>{" "}
                    <span className="font-mono">{p.currentInPipeline}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1">
                    <span className="text-muted-foreground">Need to Initiate:</span>{" "}
                    <span className="font-mono">{p.requiredByStage["initiation"] || 0}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1">
                    <span className="text-muted-foreground">Initiation Deadline:</span>{" "}
                    <span className="font-mono">{p.initiationDeadline}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1">
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className={`font-medium ${p.status === "behind" ? "text-red-500" : p.status === "at_risk" ? "text-amber-500" : "text-green-500"}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingDown className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Sales Orders</h3>
            <p className="text-muted-foreground mt-1">Create a sales order to see demand projections and production requirements.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
