"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StageBadge } from "@/components/status-badge";
import { generateBarcodeSVG, printLabels, generateVesselZPL, printZPLViaBrowserPrint, getZebraPrinters } from "@/lib/label-generator";
import type { Vessel } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";

type LabelFormat = "barcode" | "qr" | "both";
type LabelSize = "small" | "medium" | "large";
type PrintMode = "browser" | "zebra";

export default function LabelsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [barcodeInput, setBarcodeInput] = useState("");
  const [labelFormat, setLabelFormat] = useState<LabelFormat>("barcode");
  const [labelSize, setLabelSize] = useState<LabelSize>("medium");
  const [printMode, setPrintMode] = useState<PrintMode>("browser");
  const [zebraAvailable, setZebraAvailable] = useState<boolean | null>(null);
  const [zebraPrinterName, setZebraPrinterName] = useState<string>("");
  const [printing, setPrinting] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addByBarcode = async () => {
    if (!barcodeInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vessels/barcode?barcode=${encodeURIComponent(barcodeInput.trim())}`);
      if (res.ok) {
        const vessel = await res.json();
        if (!vessels.some((v) => v.id === vessel.id)) {
          setVessels((prev) => [...prev, vessel]);
        }
        setSelected((prev) => new Set([...prev, vessel.id]));
        toast.success(`Added ${vessel.barcode}`);
      } else {
        toast.error("Vessel not found");
      }
    } finally {
      setLoading(false);
      setBarcodeInput("");
      inputRef.current?.focus();
    }
  };

  const loadRecentVessels = async () => {
    setLoading(true);
    const res = await fetch("/api/vessels?limit=20");
    const data = await res.json();
    setVessels(data.vessels || []);
    setLoading(false);
  };

  const checkZebra = async () => {
    const printers = await getZebraPrinters();
    setZebraAvailable(printers.length > 0);
    setZebraPrinterName(printers[0]?.name || "");
  };

  useEffect(() => {
    loadRecentVessels();
    checkZebra();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(vessels.map((v) => v.id)));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const sizeStyles: Record<LabelSize, { width: string; fontSize: string }> = {
    small: { width: "180px", fontSize: "8px" },
    medium: { width: "250px", fontSize: "10px" },
    large: { width: "350px", fontSize: "12px" },
  };

  const handleZebraPrint = async () => {
    const selectedVessels = vessels.filter((v) => selected.has(v.id));
    if (selectedVessels.length === 0) {
      toast.error("Select at least one vessel");
      return;
    }
    setPrinting(true);
    try {
      for (const v of selectedVessels) {
        const zpl = generateVesselZPL({
          barcode: v.barcode,
          cultivar: v.cultivar?.name,
          stage: v.stage,
          subcultureNumber: v.subcultureNumber,
          plantedAt: v.plantedAt || v.createdAt,
        });
        const result = await printZPLViaBrowserPrint(zpl);
        if (!result.success) {
          toast.error(result.error || "Print failed");
          return;
        }
      }
      toast.success(`Sent ${selectedVessels.length} label${selectedVessels.length !== 1 ? "s" : ""} to Zebra printer`);
    } finally {
      setPrinting(false);
    }
  };

  const handlePrint = () => {
    const selectedVessels = vessels.filter((v) => selected.has(v.id));
    if (selectedVessels.length === 0) {
      toast.error("Select at least one vessel");
      return;
    }

    const style = sizeStyles[labelSize];

    const labelsHTML = selectedVessels.map((v) => {
      let barcodeHTML = "";
      if (labelFormat === "barcode" || labelFormat === "both") {
        barcodeHTML = `<div class="label-barcode">${generateBarcodeSVG(v.barcode)}</div>`;
      }
      if (labelFormat === "qr" || labelFormat === "both") {
        // QR uses canvas, so for print we use the barcode text as fallback
        barcodeHTML += `<div class="label-barcode" style="font-family: monospace; font-size: 14px; font-weight: bold;">${v.barcode}</div>`;
      }

      return `
        <div class="label" style="width: ${style.width}; font-size: ${style.fontSize};">
          ${barcodeHTML}
          ${v.cultivar?.name ? `<div class="label-cultivar">${v.cultivar.name}</div>` : ""}
          ${v.stage ? `<div class="label-stage">${v.stage.toUpperCase()}</div>` : ""}
          <div class="label-date">${format(new Date(v.createdAt), "MM/dd/yyyy")}</div>
        </div>
      `;
    }).join("");

    printLabels(labelsHTML);
    toast.success(`Printing ${selectedVessels.length} labels`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Label Printing"
        description="Generate and print barcode labels for vessels"
      />

      {/* Scanner */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addByBarcode()}
              placeholder="Scan barcode to add..."
              className="font-mono"
            />
            <Button onClick={addByBarcode} disabled={loading}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Label Settings</span>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 text-sm">
              <button
                onClick={() => setPrintMode("browser")}
                className={`px-3 py-1 rounded-md transition-colors ${printMode === "browser" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                Browser Print
              </button>
              <button
                onClick={() => setPrintMode("zebra")}
                className={`px-3 py-1 rounded-md transition-colors ${printMode === "zebra" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                Zebra ZD421
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {printMode === "browser" ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Format</Label>
                <Select value={labelFormat} onValueChange={(v) => setLabelFormat(v as LabelFormat)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barcode">Barcode Only</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Size</Label>
                <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1&quot; x 0.5&quot;)</SelectItem>
                    <SelectItem value="medium">Medium (2&quot; x 1&quot;)</SelectItem>
                    <SelectItem value="large">Large (3&quot; x 1.5&quot;)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handlePrint} disabled={selected.size === 0} className="w-full">
                  Print {selected.size} Label{selected.size !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                zebraAvailable === true ? "bg-green-50 border-green-200 text-green-700" :
                zebraAvailable === false ? "bg-red-50 border-red-200 text-red-700" :
                "bg-muted border-border text-muted-foreground"
              }`}>
                <div className={`size-2 rounded-full ${zebraAvailable === true ? "bg-green-500" : zebraAvailable === false ? "bg-red-500" : "bg-gray-400"}`} />
                {zebraAvailable === true ? (
                  <span>Zebra Browser Print detected — {zebraPrinterName || "Printer ready"}</span>
                ) : zebraAvailable === false ? (
                  <span>
                    Zebra Browser Print not detected.{" "}
                    <a href="https://www.zebra.com/us/en/software/zebra-utilities/browser-print.html" target="_blank" rel="noopener noreferrer" className="underline">
                      Download here
                    </a>
                  </span>
                ) : (
                  <span>Checking for Zebra Browser Print...</span>
                )}
                <button onClick={checkZebra} className="ml-auto text-xs underline">Refresh</button>
              </div>
              <p className="text-xs text-muted-foreground">
                ZPL labels are formatted for 2.25&quot; x 1.25&quot; thermal labels (Zebra ZD421). Includes barcode, cultivar, stage, and subculture number.
              </p>
              <Button
                onClick={handleZebraPrint}
                disabled={selected.size === 0 || printing || zebraAvailable !== true}
                className="w-full"
              >
                {printing ? "Sending to printer..." : `Print ${selected.size} Label${selected.size !== 1 ? "s" : ""} via Zebra`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vessel selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Select Vessels ({selected.size} selected)</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vessels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No vessels loaded. Scan barcodes or load recent vessels.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Cultivar</TableHead>
                  <TableHead>Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer" onClick={() => toggleSelect(v.id)}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={() => toggleSelect(v.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-mono">{v.barcode}</TableCell>
                    <TableCell>{v.cultivar?.name || "—"}</TableCell>
                    <TableCell><StageBadge stage={v.stage} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
