"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { ALERT_TYPES } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  subculture_due: "Subculture Due",
  low_inventory: "Low Inventory",
  environment_out_of_range: "Environment Alert",
  contamination_spike: "Contamination Spike",
};

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchAlerts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    fetch(`/api/alerts?${params}`)
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [typeFilter]);

  const markAsRead = async (ids: string[]) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertIds: ids, action: "read" }),
    });
    fetchAlerts();
  };

  const dismiss = async (ids: string[]) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertIds: ids, action: "dismiss" }),
    });
    fetchAlerts();
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const severityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "warning": return <Badge className="bg-amber-500 hover:bg-amber-600">Warning</Badge>;
      default: return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread`}
        actions={
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsRead(alerts.filter((a) => !a.isRead).map((a) => a.id))}
              >
                Mark All Read
              </Button>
            )}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ALERT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{ALERT_TYPE_LABELS[t] || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No notifications
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-0">
              {alerts.map((alert, i) => (
                <div key={alert.id}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className={`flex items-start gap-3 ${!alert.isRead ? "bg-accent/30 -mx-2 px-2 py-1 rounded-md" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {severityBadge(alert.severity)}
                        <span className="text-xs text-muted-foreground">
                          {ALERT_TYPE_LABELS[alert.type] || alert.type}
                        </span>
                        {!alert.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!alert.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead([alert.id])}>
                          Read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => dismiss([alert.id])}>
                        Dismiss
                      </Button>
                    </div>
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
