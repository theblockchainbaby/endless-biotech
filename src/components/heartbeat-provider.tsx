"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function HeartbeatProvider() {
  const { data: session } = useSession();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const ping = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
      }
    };

    // Fire immediately
    ping();

    // Then every 5 minutes
    intervalRef.current = setInterval(ping, HEARTBEAT_INTERVAL);

    // Also ping when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session?.user]);

  return null;
}
