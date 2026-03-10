"use client";

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";

type Step = "upload" | "preview" | "results";

interface ParsedRow {
  [key: string]: string;
}

interface ImportResult {
  barcode: string;
  success: boolean;
  error?: string;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const TEMPLATE_HEADERS = ["barcode", "cultivar", "stage", "status", "healthStatus", "explantCount", "notes"];
const TEMPLATE_EXAMPLE = ["TC-0001", "Spathiphyllum", "initiation", "planted", "healthy", "4", "Imported from spreadsheet"];

// Map common header variations to our standard columns
const HEADER_ALIASES: Record<string, string> = {
  barcode: "barcode", code: "barcode", id: "barcode", vessel_id: "barcode", vessel: "barcode",
  cultivar: "cultivar", strain: "cultivar", variety: "cultivar", species: "cultivar", plant: "cultivar",
  stage: "stage",
  status: "status",
  health: "healthStatus", healthstatus: "healthStatus", health_status: "healthStatus",
  explantcount: "explantCount", explant_count: "explantCount", count: "explantCount", explants: "explantCount",
  notes: "notes", note: "notes", comments: "notes",
};

function normalizeHeader(h: string): string | null {
  const clean = h.trim().toLowerCase().replace(/[^a-z_]/g, "");
  return HEADER_ALIASES[clean] || null;
}

function parseCSVText(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };

  const rawHeaders = lines[0].split(",").map((h) => h.trim());
  const mappedHeaders = rawHeaders.map((h) => normalizeHeader(h) || h);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: ParsedRow = {};
    rawHeaders.forEach((_, idx) => {
      row[mappedHeaders[idx]] = values[idx] || "";
    });
    if (row.barcode) rows.push(row);
  }

  return { headers: mappedHeaders, rows };
}

function excelToCSV(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(firstSheet);
}

export function ImportDialog({ open, onOpenChange, onComplete }: ImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    created: number;
    failed: number;
    results: ImportResult[];
  } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setCsvText("");
    setImporting(false);
    setResults(null);
    setError("");
    setDragOver(false);
  }, []);

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  }, [onOpenChange, reset]);

  const processFile = useCallback(async (file: File) => {
    setError("");
    setFileName(file.name);

    try {
      let csv: string;
      if (file.name.match(/\.xlsx?$/i)) {
        const buffer = await file.arrayBuffer();
        csv = excelToCSV(buffer);
      } else if (file.name.match(/\.csv$/i)) {
        csv = await file.text();
      } else {
        setError("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
        return;
      }

      const { headers: h, rows: r } = parseCSVText(csv);

      if (r.length === 0) {
        setError("No data rows found in file.");
        return;
      }

      if (!h.includes("barcode")) {
        setError("No 'barcode' column found. Your file needs a column with vessel barcodes (named barcode, code, or id).");
        return;
      }

      if (r.length > 2000) {
        setError(`File has ${r.length.toLocaleString()} rows. Maximum is 2,000 per import. Split your file into smaller batches.`);
        return;
      }

      setHeaders(h);
      setRows(r);
      setCsvText(csv);
      setStep("preview");
    } catch {
      setError("Failed to read file. Make sure it's a valid CSV or Excel file.");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const downloadTemplate = useCallback(() => {
    const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_EXAMPLE.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vitros-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(async () => {
    setImporting(true);
    setError("");

    try {
      const res = await fetch("/api/vessels/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        setImporting(false);
        return;
      }

      setResults(data);
      setStep("results");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  }, [csvText]);

  const handleDone = useCallback(() => {
    reset();
    onOpenChange(false);
    onComplete();
  }, [reset, onOpenChange, onComplete]);

  // Count validation issues for preview
  const missingBarcodes = rows.filter((r) => !r.barcode).length;
  const duplicateBarcodes = rows.length - new Set(rows.map((r) => r.barcode)).size;
  const validRows = rows.length - missingBarcodes - duplicateBarcodes;
  const knownColumns = headers.filter((h) => TEMPLATE_HEADERS.includes(h));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Vessels
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className={step === "upload" ? "text-primary font-medium" : ""}>Upload</span>
          <span>&rarr;</span>
          <span className={step === "preview" ? "text-primary font-medium" : ""}>Preview</span>
          <span>&rarr;</span>
          <span className={step === "results" ? "text-primary font-medium" : ""}>Results</span>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">Drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports .csv, .xlsx, and .xls files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <p className="text-xs text-muted-foreground">Max 2,000 rows per import</p>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">{rows.length.toLocaleString()} rows found</p>
              </div>
              <div className="flex gap-2">
                {validRows > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {validRows} valid
                  </Badge>
                )}
                {duplicateBarcodes > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-3 w-3 mr-1" /> {duplicateBarcodes} duplicates
                  </Badge>
                )}
              </div>
            </div>

            {/* Column mapping */}
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Detected columns:</p>
              <div className="flex flex-wrap gap-1">
                {knownColumns.map((h) => (
                  <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                ))}
                {headers.filter((h) => !TEMPLATE_HEADERS.includes(h)).map((h) => (
                  <Badge key={h} variant="outline" className="text-xs text-muted-foreground opacity-50">{h} (ignored)</Badge>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    {knownColumns.map((h) => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((row, i) => (
                    <TableRow key={i} className={!row.barcode ? "bg-destructive/5" : ""}>
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      {knownColumns.map((h) => (
                        <TableCell key={h} className="text-xs font-mono">{row[h] || "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 10 && (
              <p className="text-xs text-muted-foreground text-center">
                Showing first 10 of {rows.length.toLocaleString()} rows
              </p>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => { setStep("upload"); setError(""); }}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing || validRows === 0}>
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import {validRows.toLocaleString()} Vessels</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && results && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{results.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-700">{results.created}</div>
                <div className="text-xs text-green-600">Created</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${results.failed > 0 ? "bg-red-50" : "bg-muted"}`}>
                <div className={`text-2xl font-bold ${results.failed > 0 ? "text-red-700" : ""}`}>{results.failed}</div>
                <div className={`text-xs ${results.failed > 0 ? "text-red-600" : "text-muted-foreground"}`}>Failed</div>
              </div>
            </div>

            {results.created > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-800 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Successfully imported {results.created} vessel{results.created !== 1 ? "s" : ""}.
              </div>
            )}

            {/* Failed rows */}
            {results.failed > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Failed rows:</p>
                <div className="rounded-md border max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Barcode</TableHead>
                        <TableHead className="text-xs">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.results.filter((r) => !r.success).map((r) => (
                        <TableRow key={r.barcode}>
                          <TableCell className="text-xs font-mono">{r.barcode}</TableCell>
                          <TableCell className="text-xs text-destructive">{r.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleDone}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
