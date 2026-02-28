"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SubcultureDue {
  overdue: number;
  today: number;
  thisWeek: number;
}

export function SubcultureAlertBanner() {
  const [data, setData] = useState<SubcultureDue | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((stats) => {
        if (stats.subcultureDue) setData(stats.subcultureDue);
      })
      .catch(() => {});
  }, []);

  if (!data || (data.overdue === 0 && data.today === 0)) return null;

  return (
    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="py-3 flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          {data.overdue > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {data.overdue} overdue
            </span>
          )}
          {data.today > 0 && (
            <span className="text-amber-700 dark:text-amber-300 font-medium">
              {data.today} due today
            </span>
          )}
          {data.thisWeek > 0 && (
            <span className="text-muted-foreground">
              {data.thisWeek} this week
            </span>
          )}
        </div>
        <Link href="/vessels?stage=multiplication">
          <Button variant="outline" size="sm">View</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
