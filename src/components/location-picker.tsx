"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Location } from "@/lib/types";
import { LOCATION_TYPE_LABELS } from "@/lib/constants";

interface LocationPickerProps {
  value: string;
  onChange: (locationId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function LocationPicker({ value, onChange, placeholder = "Select location", disabled }: LocationPickerProps) {
  const [locations, setLocations] = useState<(Location & { _count?: { vessels: number } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data) => {
        setLocations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading locations..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id}>
            <span className="flex items-center gap-2">
              <span>{loc.name}</span>
              <span className="text-xs text-muted-foreground">
                {LOCATION_TYPE_LABELS[loc.type] || loc.type}
                {loc.capacity && ` (${loc._count?.vessels ?? 0}/${loc.capacity})`}
              </span>
            </span>
          </SelectItem>
        ))}
        {locations.length === 0 && (
          <div className="py-2 px-3 text-sm text-muted-foreground">No locations configured</div>
        )}
      </SelectContent>
    </Select>
  );
}
