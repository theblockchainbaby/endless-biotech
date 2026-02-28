"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
}

export function BarcodeScanner({ onScan, placeholder = "Scan or type barcode..." }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const scanner = html5QrCodeRef.current as { stop: () => Promise<void>; clear: () => void };
        await scanner.stop();
        scanner.clear();
      } catch {
        // ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("barcode-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 150 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // ignore scan failures (frames without barcodes)
        }
      );
      setScanning(true);
    } catch (err) {
      setError("Camera access denied or unavailable. Use manual entry.");
      console.error(err);
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-lg h-12"
          autoFocus
        />
        <Button type="submit" size="lg" disabled={!manualCode.trim()}>
          Go
        </Button>
      </form>

      <div className="flex gap-2">
        {!scanning ? (
          <Button variant="outline" onClick={startScanner} className="w-full">
            Open Camera Scanner
          </Button>
        ) : (
          <Button variant="destructive" onClick={stopScanner} className="w-full">
            Close Camera
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div
        id="barcode-reader"
        ref={scannerRef}
        className={scanning ? "rounded-lg overflow-hidden" : "hidden"}
      />
    </div>
  );
}
