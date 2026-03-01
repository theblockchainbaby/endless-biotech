"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Keyboard } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
}

export function BarcodeScanner({ onScan, placeholder = "Scan or type barcode..." }: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);

      // Use BarcodeDetector API if available (Safari/iOS 16.4+, Chrome)
      const win = window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } };
      if (win.BarcodeDetector) {
        const detector = new win.BarcodeDetector({
          formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "data_matrix"],
        });

        const scan = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code) {
                onScan(code);
                stopCamera();
                return;
              }
            }
          } catch {
            // frame not ready yet
          }
          animFrameRef.current = requestAnimationFrame(scan);
        };
        animFrameRef.current = requestAnimationFrame(scan);
      } else {
        // Fallback: use html5-qrcode for devices without BarcodeDetector
        try {
          const { Html5Qrcode } = await import("html5-qrcode");
          const qrScanner = new Html5Qrcode("barcode-fallback-reader", false);

          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }

          const scanFrame = async () => {
            if (!videoRef.current || !streamRef.current) return;
            const video = videoRef.current;
            const canvas = canvasRef.current!;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              try {
                const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8));
                const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
                const result = await qrScanner.scanFileV2(file, false);
                if (result?.decodedText) {
                  onScan(result.decodedText);
                  stopCamera();
                  return;
                }
              } catch {
                // no barcode in this frame
              }
            }
            // Scan every 500ms to save CPU
            setTimeout(() => {
              animFrameRef.current = requestAnimationFrame(scanFrame);
            }, 500);
          };
          animFrameRef.current = requestAnimationFrame(scanFrame);
        } catch {
          setError("Barcode scanning library failed to load. Use manual entry below.");
        }
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please allow camera permissions in your browser settings, then try again.");
    }
  }, [onScan, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => { setMode("camera"); if (!scanning) startCamera(); }}
          className="flex-1"
        >
          <Camera className="mr-2 size-4" />
          Camera
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => { setMode("manual"); stopCamera(); }}
          className="flex-1"
        >
          <Keyboard className="mr-2 size-4" />
          Manual Entry
        </Button>
      </div>

      {/* Camera view */}
      {mode === "camera" && (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-24 border-2 border-primary rounded-lg" />
              </div>
            )}
            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button onClick={startCamera}>
                  <Camera className="mr-2 size-4" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>
          {scanning && (
            <p className="text-sm text-muted-foreground text-center">
              Point your camera at a barcode
            </p>
          )}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Hidden element for html5-qrcode fallback */}
      <div id="barcode-fallback-reader" className="hidden" />

      {/* Manual entry — always available */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-lg h-12"
          autoFocus={mode === "manual"}
        />
        <Button type="submit" size="lg" disabled={!manualCode.trim()}>
          Go
        </Button>
      </form>
    </div>
  );
}
