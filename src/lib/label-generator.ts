import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

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
