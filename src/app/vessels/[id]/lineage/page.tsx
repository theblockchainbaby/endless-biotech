"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { LineageTreeView } from "@/components/lineage-tree";
import { TreePine, ArrowLeft } from "lucide-react";
import type { LineageTree } from "@/lib/types";

export default function LineagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tree, setTree] = useState<LineageTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/vessels/${id}/lineage`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load lineage");
        return r.json();
      })
      .then(setTree)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessel Lineage"
        description="Full genealogy tree from mother plant to descendants"
        actions={
          <Link href={`/vessels/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Vessel
            </Button>
          </Link>
        }
      />

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading lineage tree...
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && tree && tree.totalNodes <= 1 && (
        <div className="text-center py-16 space-y-3">
          <TreePine className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">
            This vessel has no lineage yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Multiply this vessel to start building its family tree.
          </p>
        </div>
      )}

      {!loading && !error && tree && tree.totalNodes > 1 && (
        <LineageTreeView tree={tree} />
      )}
    </div>
  );
}
