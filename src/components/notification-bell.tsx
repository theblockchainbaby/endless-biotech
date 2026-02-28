"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = () => {
    fetch("/api/alerts?unread=true")
      .then((r) => r.json())
      .then((data) => {
        setAlerts(data.alerts?.slice(0, 5) || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (ids: string[]) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertIds: ids, action: "read" }),
    });
    fetchAlerts();
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500";
      case "warning": return "text-amber-500";
      default: return "text-blue-500";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => markAsRead(alerts.map((a) => a.id))}
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No new notifications
          </div>
        ) : (
          alerts.map((alert) => (
            <DropdownMenuItem
              key={alert.id}
              className="flex flex-col items-start gap-1 px-3 py-2 cursor-pointer"
              onClick={() => markAsRead([alert.id])}
            >
              <div className="flex items-center gap-2 w-full">
                <span className={`text-xs font-medium ${severityColor(alert.severity)}`}>
                  {alert.severity.toUpperCase()}
                </span>
                {!alert.isRead && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
              </div>
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{alert.message}</p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="text-center text-sm text-muted-foreground w-full justify-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
