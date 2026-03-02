"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["s"], label: "Open Scanner", path: "/scan" },
  { keys: ["v"], label: "Vessels List", path: "/vessels" },
  { keys: ["b"], label: "Batch Operations", path: "/batch" },
  { keys: ["c"], label: "Cultivars", path: "/cultivars" },
  { keys: ["d"], label: "Dashboard", path: "/" },
  { keys: ["m"], label: "Media Recipes", path: "/media" },
  { keys: ["l"], label: "Locations", path: "/locations" },
  { keys: ["i"], label: "Inventory", path: "/inventory" },
  { keys: ["r"], label: "Reports", path: "/reports" },
  { keys: ["a"], label: "Activity Log", path: "/activity" },
  { keys: ["?"], label: "Show Shortcuts", path: null },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger with modifier keys (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      if (e.shiftKey) return;

      const shortcut = SHORTCUTS.find((s) => s.keys.includes(key) && s.path);
      if (shortcut && shortcut.path) {
        e.preventDefault();
        router.push(shortcut.path);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.label} className="flex items-center justify-between py-1">
              <span className="text-sm">{shortcut.label}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-0.5 text-xs font-mono bg-muted border rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Shortcuts are disabled when typing in input fields.
        </p>
      </DialogContent>
    </Dialog>
  );
}
