export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape quotes and wrap in quotes if it contains comma, quote, or newline
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function flattenVesselForExport(vessel: Record<string, unknown>) {
  return {
    barcode: vessel.barcode,
    cultivar: (vessel.cultivar as Record<string, unknown>)?.name ?? "",
    stage: vessel.stage,
    status: vessel.status,
    healthStatus: vessel.healthStatus,
    explantCount: vessel.explantCount,
    generation: vessel.generation,
    subcultureNumber: vessel.subcultureNumber,
    location: (vessel.location as Record<string, unknown>)?.name ?? "",
    mediaRecipe: (vessel.mediaRecipe as Record<string, unknown>)?.name ?? "",
    contaminationType: vessel.contaminationType ?? "",
    notes: vessel.notes ?? "",
    createdAt: vessel.createdAt,
    updatedAt: vessel.updatedAt,
  };
}

export function flattenActivityForExport(activity: Record<string, unknown>) {
  return {
    type: activity.type,
    category: activity.category,
    vessel: (activity.vessel as Record<string, unknown>)?.barcode ?? "",
    user: (activity.user as Record<string, unknown>)?.name ?? "",
    notes: activity.notes ?? "",
    createdAt: activity.createdAt,
  };
}
