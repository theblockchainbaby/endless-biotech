"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { exportToCSV, flattenActivityForExport } from "@/lib/csv-export";
import type { Activity } from "@/lib/types";
import { format } from "date-fns";

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (typeFilter !== "all") params.set("type", typeFilter);

    fetch(`/api/activities?${params}`)
      .then((r) => r.json())
      .then(setActivities)
      .finally(() => setLoading(false));
  }, [typeFilter]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Activity Log"
        description="All vessel operations"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = activities.map((a) => flattenActivityForExport(a as unknown as Record<string, unknown>));
                exportToCSV(rows, "activity-export");
              }}
            >
              Export CSV
            </Button>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No activity recorded yet
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-0">
              {activities.map((a, i) => (
                <div key={a.id}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{a.type.replace(/_/g, " ")}</span>
                        {a.vessel && (
                          <Link href={`/vessels/${a.vessel.id}`} className="font-mono text-sm text-muted-foreground hover:underline">
                            {a.vessel.barcode}
                          </Link>
                        )}
                      </div>
                      {a.notes && <p className="text-sm text-muted-foreground mt-0.5">{a.notes}</p>}
                      {a.user && <p className="text-xs text-muted-foreground">by {a.user.name}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(a.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
