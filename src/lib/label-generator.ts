import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

/**
 * ZPL label generation for Zebra ZD421 thermal printer.
 * Label size: 2.25" x 1.25" @ 203 DPI = 457 x 254 dots
 * Communicates via Zebra Browser Print (localhost:9100)
 */
export interface ZPLVesselData {
  barcode: string;
  cultivar?: string;
  stage?: string;
  cloneLine?: string;
  subcultureNumber?: number;
  plantedAt?: string;
  organizationName?: string;
}

/**
 * Generate ZPL string for a single vessel label (2.25" x 1.25", 203 DPI).
 * Compatible with Zebra ZD421 and most Zebra thermal printers.
 */
export function generateVesselZPL(data: ZPLVesselData): string {
  const stageAbbrev: Record<string, string> = {
    initiation: "INIT",
    multiplication: "MULT",
    rooting: "ROOT",
    acclimation: "ACCL",
    hardening: "HARD",
  };
  const stageLabel = data.stage ? (stageAbbrev[data.stage] || data.stage.toUpperCase()) : "";
  const subcultureLabel = data.subcultureNumber !== undefined ? `P${data.subcultureNumber}` : "";
  const dateLabel = data.plantedAt ? new Date(data.plantedAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }) : "";

  const lines: string[] = [
    "^XA",
    "^MMT",                    // print mode: tear-off
    "^PW457",                  // label width in dots (2.25" @ 203dpi)
    "^LL254",                  // label length in dots (1.25" @ 203dpi)
    "^LS0",                    // label shift: none
    // Cultivar name (top-left, bold)
    `^FO10,8^A0N,22,22^FD${(data.cultivar || "").substring(0, 20)}^FS`,
    // Stage + subculture number (top-right)
    `^FO300,8^A0N,18,18^FD${stageLabel} ${subcultureLabel}^FS`,
    // Clone line (if provided)
    ...(data.cloneLine ? [`^FO10,34^A0N,16,16^FDLine: ${data.cloneLine.substring(0, 22)}^FS`] : []),
    // Date planted (below cultivar)
    ...(dateLabel ? [`^FO10,${data.cloneLine ? 56 : 34}^A0N,14,14^FDPlanted: ${dateLabel}^FS`] : []),
    // Barcode (Code128, centered)
    `^FO30,82^BY2,3,50^BCN,50,Y,N,N^FD${data.barcode}^FS`,
    // Organization name (footer, small)
    ...(data.organizationName ? [`^FO10,230^A0N,12,12^FD${data.organizationName.substring(0, 30)}^FS`] : []),
    "^PQ1,0,1,Y",              // print quantity: 1
    "^XZ",
  ];

  return lines.join("\n");
}

/**
 * Generate ZPL for a batch of vessels (same cultivar/stage).
 */
export function generateBatchZPL(vessels: ZPLVesselData[]): string {
  return vessels.map(generateVesselZPL).join("\n");
}

/**
 * Send ZPL to Zebra printer via Zebra Browser Print SDK (localhost:9100).
 * Zebra Browser Print must be installed and running on the client machine.
 * Returns true on success, false if unavailable.
 */
export async function printZPLViaBrowserPrint(zpl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get list of available Zebra devices
    const devicesRes = await fetch("http://localhost:9100/available", {
      method: "GET",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
    });

    if (!devicesRes.ok) {
      return { success: false, error: "Zebra Browser Print not detected. Make sure it is installed and running." };
    }

    const devicesData = await devicesRes.json();
    const printers: { name: string; uid: string; connection: string }[] = devicesData?.printer || [];

    if (printers.length === 0) {
      return { success: false, error: "No Zebra printers found. Ensure your ZD421 is connected and powered on." };
    }

    // Use the first available printer (or default device)
    const printer = printers[0];

    // Send ZPL to printer
    const writeRes = await fetch("http://localhost:9100/write", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ device: printer, data: zpl }),
    });

    if (writeRes.ok) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to send label to printer." };
    }
  } catch {
    return {
      success: false,
      error: "Could not connect to Zebra Browser Print. Download it from zebra.com/browserprint.",
    };
  }
}

/**
 * Get available Zebra printers via Browser Print SDK.
 */
export async function getZebraPrinters(): Promise<{ name: string; uid: string; connection: string }[]> {
  try {
    const res = await fetch("http://localhost:9100/available");
    if (!res.ok) return [];
    const data = await res.json();
    return data?.printer || [];
  } catch {
    return [];
  }
}

export interface LabelData {
  barcode: string;
  cultivar?: string;
  stage?: string;
  date?: string;
}

export function generateBarcodeSVG(text: string): string {
  const doc = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(doc, text, {
    format: "CODE128",
    width: 2,
    height: 40,
    displayValue: true,
    fontSize: 12,
    margin: 5,
  });
  return doc.outerHTML;
}

export async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 120,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export function printLabels(labelHTML: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Labels</title>
      <style>
        @media print {
          @page { margin: 5mm; }
          body { margin: 0; }
        }
        body { font-family: Arial, sans-serif; }
        .label {
          display: inline-block;
          border: 1px dashed #ccc;
          padding: 8px;
          margin: 4px;
          text-align: center;
          page-break-inside: avoid;
        }
        .label-barcode svg { max-width: 100%; }
        .label-text { font-size: 10px; margin-top: 4px; }
        .label-cultivar { font-weight: bold; font-size: 11px; }
        .label-stage { font-size: 9px; color: #666; }
        .label-date { font-size: 9px; color: #999; }
      </style>
    </head>
    <body>${labelHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}
