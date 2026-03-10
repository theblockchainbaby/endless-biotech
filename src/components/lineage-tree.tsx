"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STAGE_LABELS } from "@/lib/constants";
import type { LineageNode, LineageTree as LineageTreeType } from "@/lib/types";
import { ChevronRight, ChevronDown, TreePine, AlertTriangle } from "lucide-react";

const HEALTH_COLORS: Record<string, { border: string; bg: string; dot: string }> = {
  healthy:     { border: "border-l-green-500",  bg: "bg-green-50 dark:bg-green-950/20",    dot: "bg-green-500" },
  stable:      { border: "border-l-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/20",    dot: "bg-amber-500" },
  critical:    { border: "border-l-red-500",     bg: "bg-red-50 dark:bg-red-950/20",        dot: "bg-red-500" },
  slow_growth: { border: "border-l-yellow-500",  bg: "bg-yellow-50 dark:bg-yellow-950/20",  dot: "bg-yellow-500" },
  necrotic:    { border: "border-l-red-700",     bg: "bg-red-100 dark:bg-red-950/30",       dot: "bg-red-700" },
  vitrified:   { border: "border-l-purple-500",  bg: "bg-purple-50 dark:bg-purple-950/20",  dot: "bg-purple-500" },
  dead:        { border: "border-l-gray-400",    bg: "bg-gray-100 dark:bg-gray-800/50",     dot: "bg-gray-400" },
};

const DEFAULT_HEALTH = { border: "border-l-gray-300", bg: "bg-card", dot: "bg-gray-300" };
const AUTO_COLLAPSE_THRESHOLD = 15;

function getPathToNode(root: LineageNode, targetId: string): Set<string> {
  const path = new Set<string>();

  function walk(node: LineageNode): boolean {
    if (node.id === targetId) {
      path.add(node.id);
      return true;
    }
    for (const child of node.children) {
      if (walk(child)) {
        path.add(node.id);
        return true;
      }
    }
    return false;
  }

  walk(root);
  return path;
}

function getInitialCollapsed(root: LineageNode, currentVesselId: string): Set<string> {
  const pathToTarget = getPathToNode(root, currentVesselId);
  const collapsed = new Set<string>();

  function walk(node: LineageNode) {
    if (
      node.children.length > AUTO_COLLAPSE_THRESHOLD &&
      !pathToTarget.has(node.id)
    ) {
      collapsed.add(node.id);
    }
    for (const child of node.children) walk(child);
  }

  walk(root);
  return collapsed;
}

function countStats(root: LineageNode) {
  let healthy = 0, critical = 0, disposed = 0, total = 0;

  function walk(node: LineageNode) {
    total++;
    if (node.status === "disposed") disposed++;
    else if (["critical", "necrotic", "dead"].includes(node.healthStatus)) critical++;
    else if (node.healthStatus === "healthy") healthy++;
    for (const child of node.children) walk(child);
  }

  walk(root);
  return { healthy, critical, disposed, total };
}

interface TreeNodeProps {
  node: LineageNode;
  isCurrentVessel: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate: (id: string) => void;
}

function TreeNode({ node, isCurrentVessel, isCollapsed, onToggle, onNavigate }: TreeNodeProps) {
  const colors = HEALTH_COLORS[node.healthStatus] || DEFAULT_HEALTH;
  const isDisposed = node.status === "disposed" || node.status === "multiplied";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "relative flex items-center gap-2 rounded-lg border-l-4 border px-3 py-2 cursor-pointer transition-shadow select-none min-w-[180px] max-w-[220px]",
        colors.border,
        colors.bg,
        isCurrentVessel && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDisposed && "opacity-60",
      )}
      onClick={() => onNavigate(node.id)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold truncate">{node.barcode}</span>
          <span className={cn("w-2 h-2 rounded-full shrink-0", colors.dot)} />
        </div>
        {node.cultivarName && (
          <p className="text-[10px] text-muted-foreground truncate">{node.cultivarName}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          {STAGE_LABELS[node.stage] || node.stage} · Gen {node.generation}
          {node.explantCount > 0 && ` · ${node.explantCount} exp`}
        </p>
      </div>
      {node.children.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          {isCollapsed ? (
            <span className="flex items-center text-[10px] text-muted-foreground gap-0.5">
              <ChevronRight className="w-3 h-3" />
              <span>{node.children.length}</span>
            </span>
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      )}
    </motion.div>
  );
}

interface SubtreeProps {
  node: LineageNode;
  currentVesselId: string;
  collapsedNodes: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  depth: number;
}

function Subtree({ node, currentVesselId, collapsedNodes, onToggle, onNavigate, depth }: SubtreeProps) {
  const isCollapsed = collapsedNodes.has(node.id);
  const isCurrent = node.id === currentVesselId;

  return (
    <div className="flex items-start gap-6">
      <TreeNode
        node={node}
        isCurrentVessel={isCurrent}
        isCollapsed={isCollapsed}
        onToggle={() => onToggle(node.id)}
        onNavigate={onNavigate}
      />

      <AnimatePresence>
        {!isCollapsed && node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="flex flex-col gap-2 relative"
          >
            {/* Vertical connector line */}
            {node.children.length > 1 && (
              <div
                className="absolute left-0 top-4 bottom-4 w-px bg-border -translate-x-3"
              />
            )}
            {node.children.map((child, i) => (
              <div key={child.id} className="relative">
                {/* Horizontal connector line */}
                <div className="absolute left-0 top-4 w-3 h-px bg-border -translate-x-3" />
                <Subtree
                  node={child}
                  currentVesselId={currentVesselId}
                  collapsedNodes={collapsedNodes}
                  onToggle={onToggle}
                  onNavigate={onNavigate}
                  depth={depth + 1}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LineageTreeView({ tree }: { tree: LineageTreeType }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() =>
    getInitialCollapsed(tree.root, tree.currentVesselId)
  );

  const stats = useMemo(() => countStats(tree.root), [tree.root]);

  const handleToggle = useCallback((id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    (id: string) => router.push(`/vessels/${id}`),
    [router]
  );

  // Scroll to current vessel on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const currentNode = el.querySelector("[class*='ring-primary']");
    if (currentNode) {
      currentNode.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <TreePine className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{stats.total} vessels</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">{stats.healthy} healthy</span>
        </div>
        {stats.critical > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">{stats.critical} critical</span>
          </div>
        )}
        {stats.disposed > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">{stats.disposed} disposed</span>
          </div>
        )}
        <span className="text-muted-foreground">
          {tree.maxGeneration + 1} generation{tree.maxGeneration > 0 ? "s" : ""}
        </span>
        {tree.truncated && (
          <div className="flex items-center gap-1.5 text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs">Tree truncated (too many vessels)</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Healthy</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Stable</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Disposed</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-primary" /> Current
        </span>
      </div>

      {/* Tree */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-lg border bg-card/50 p-6"
      >
        <Subtree
          node={tree.root}
          currentVesselId={tree.currentVesselId}
          collapsedNodes={collapsedNodes}
          onToggle={handleToggle}
          onNavigate={handleNavigate}
          depth={0}
        />
      </div>
    </div>
  );
}
