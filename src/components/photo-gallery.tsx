"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Photo } from "@/lib/types";
import { format } from "date-fns";

interface PhotoGalleryProps {
  photos: Photo[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">No photos yet</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo)}
            className="aspect-square rounded-md overflow-hidden border hover:ring-2 ring-primary transition-all"
          >
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.caption || "Vessel photo"}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {selected && (
            <div>
              <img
                src={selected.url}
                alt={selected.caption || "Vessel photo"}
                className="w-full"
              />
              <div className="p-4 space-y-1">
                {selected.caption && <p className="font-medium">{selected.caption}</p>}
                {selected.stage && (
                  <p className="text-sm text-muted-foreground capitalize">Stage: {selected.stage}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selected.createdAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
