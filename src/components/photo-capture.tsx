"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PhotoCaptureProps {
  vesselId?: string;
  cultivarId?: string;
  stage?: string;
  onUploaded?: (photo: { id: string; url: string }) => void;
}

export function PhotoCapture({ vesselId, cultivarId, stage, onUploaded }: PhotoCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // Upload file to blob storage
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/photos/upload", { method: "POST", body: formData });

      let url: string;
      if (uploadRes.ok) {
        const blob = await uploadRes.json();
        url = blob.url;
      } else {
        // Fallback to base64 if blob storage not configured
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, vesselId, cultivarId, caption, stage }),
      });

      if (res.ok) {
        const photo = await res.json();
        setFile(null);
        setPreview(null);
        setCaption("");
        if (inputRef.current) inputRef.current.value = "";
        onUploaded?.(photo);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="photo-input">Photo</Label>
        <Input
          ref={inputRef}
          id="photo-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="mt-1"
        />
      </div>

      {preview && (
        <div className="relative">
          <img src={preview} alt="Preview" className="rounded-md max-h-48 object-cover" />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1"
            onClick={() => {
              setFile(null);
              setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove
          </Button>
        </div>
      )}

      <div>
        <Label htmlFor="caption">Caption (optional)</Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={2}
          placeholder="Describe what you see..."
          className="mt-1"
        />
      </div>

      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
        {uploading ? "Uploading..." : "Save Photo"}
      </Button>
    </div>
  );
}
