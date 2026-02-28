"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { LocationPicker } from "@/components/location-picker";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";
import type { EnvironmentReading } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function EnvironmentPage() {
  const [readings, setReadings] = useState<EnvironmentReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState("");
  const [hoursFilter, setHoursFilter] = useState("168");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  // Form state
  const [formLocationId, setFormLocationId] = useState("");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [co2Level, setCo2Level] = useState("");
  const [lightLevel, setLightLevel] = useState("");

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ hours: hoursFilter });
    if (locationFilter) params.set("locationId", locationFilter);
    const res = await fetch(`/api/environment?${params}`);
    const data = await res.json();
    setReadings(data);
    setLoading(false);
  }, [locationFilter, hoursFilter]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const handleRecord = async () => {
    if (!formLocationId) {
      toast.error("Select a location");
      return;
    }
    setRecording(true);
    try {
      const body: Record<string, unknown> = { locationId: formLocationId };
      if (temperature) body.temperature = parseFloat(temperature);
      if (humidity) body.humidity = parseFloat(humidity);
      if (co2Level) body.co2Level = parseFloat(co2Level);
      if (lightLevel) body.lightLevel = parseFloat(lightLevel);

      const res = await fetch("/api/environment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Reading recorded");
        setDialogOpen(false);
        setTemperature("");
        setHumidity("");
        setCo2Level("");
        setLightLevel("");
        fetchReadings();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } finally {
      setRecording(false);
    }
  };

  // Build chart data grouped by time
  const chartData = readings
    .slice()
    .reverse()
    .map((r) => ({
      time: format(new Date(r.recordedAt), "MMM d HH:mm"),
      temp: r.temperature,
      humidity: r.humidity,
      location: r.location?.name,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environment"
        description="Track growth chamber conditions"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Record Reading</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Environment Reading</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Location</Label>
                  <div className="mt-1">
                    <LocationPicker value={formLocationId} onChange={setFormLocationId} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Temperature (°C)</Label>
                    <Input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Humidity (%)</Label>
                    <Input type="number" step="1" value={humidity} onChange={(e) => setHumidity(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CO2 (ppm)</Label>
                    <Input type="number" value={co2Level} onChange={(e) => setCo2Level(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Light (µmol/m²/s)</Label>
                    <Input type="number" value={lightLevel} onChange={(e) => setLightLevel(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <Button onClick={handleRecord} disabled={recording} className="w-full">
                  {recording ? "Saving..." : "Record Reading"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3">
            <LocationPicker value={locationFilter} onChange={setLocationFilter} placeholder="All locations" />
            <Select value={hoursFilter} onValueChange={setHoursFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24">Last 24 hours</SelectItem>
                <SelectItem value="72">Last 3 days</SelectItem>
                <SelectItem value="168">Last 7 days</SelectItem>
                <SelectItem value="720">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Temperature & Humidity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="temp" orientation="left" tick={{ fontSize: 11 }} label={{ value: "°C", position: "insideLeft" }} />
                <YAxis yAxisId="hum" orientation="right" tick={{ fontSize: 11 }} label={{ value: "%", position: "insideRight" }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} name="Temp (°C)" dot={false} />
                <Line yAxisId="hum" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Readings table */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : readings.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No readings recorded yet</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Readings ({readings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Temp (°C)</TableHead>
                  <TableHead>Humidity (%)</TableHead>
                  <TableHead>CO2 (ppm)</TableHead>
                  <TableHead>Light</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.slice(0, 50).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.location?.name ?? "—"}</TableCell>
                    <TableCell className="font-mono">{r.temperature ?? "—"}</TableCell>
                    <TableCell className="font-mono">{r.humidity ?? "—"}</TableCell>
                    <TableCell className="font-mono">{r.co2Level ?? "—"}</TableCell>
                    <TableCell className="font-mono">{r.lightLevel ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.recordedBy?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(r.recordedAt), "MMM d, HH:mm")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
