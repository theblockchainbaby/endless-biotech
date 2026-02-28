"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StageBadge } from "@/components/status-badge";
import type { MediaRecipe } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";

const PGR_CATEGORY_LABELS: Record<string, string> = {
  pgr_cytokinin: "Cytokinin",
  pgr_auxin: "Auxin",
  pgr_gibberellin: "Gibberellin",
  vitamin: "Vitamin",
  mineral: "Mineral",
  amino_acid: "Amino Acid",
  other: "Other",
};

export default function MediaRecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<MediaRecipe & { _count?: { vessels: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/media-recipes/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setRecipe)
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Deactivate this recipe? It will no longer appear in recipe lists.")) return;
    const res = await fetch(`/api/media-recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Recipe deactivated");
      router.push("/media");
    } else {
      toast.error("Failed to deactivate recipe");
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!recipe) return <div className="text-center py-12 text-muted-foreground">Recipe not found</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={recipe.name}
        description={`${recipe.baseMedia} base media`}
        actions={
          <div className="flex gap-2">
            {recipe.stage && <StageBadge stage={recipe.stage} />}
            <Button variant="outline" size="sm" onClick={handleDelete}>Deactivate</Button>
          </div>
        }
      />

      {/* Recipe Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formulation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <span className="text-muted-foreground">Base Media</span>
            <Badge variant="outline">{recipe.baseMedia}</Badge>
            <span className="text-muted-foreground">Target pH</span>
            <span>{recipe.targetPH ?? "—"}</span>
            <span className="text-muted-foreground">Agar (g/L)</span>
            <span>{recipe.agarConcentration ?? "—"}</span>
            <span className="text-muted-foreground">Sucrose (g/L)</span>
            <span>{recipe.sucroseConcentration ?? "—"}</span>
            <span className="text-muted-foreground">Target Stage</span>
            <span>{recipe.stage ? <StageBadge stage={recipe.stage} /> : "Any"}</span>
            <span className="text-muted-foreground">Active Vessels</span>
            <span className="font-mono">{recipe._count?.vessels ?? 0}</span>
            <span className="text-muted-foreground">Created</span>
            <span>{format(new Date(recipe.createdAt), "MMM d, yyyy")}</span>
            {recipe.notes && (
              <>
                <span className="text-muted-foreground">Notes</span>
                <span>{recipe.notes}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Components ({recipe.components?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!recipe.components || recipe.components.length === 0 ? (
            <p className="text-sm text-muted-foreground">No components defined</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Concentration</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipe.components.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PGR_CATEGORY_LABELS[c.category] || c.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{c.concentration}</TableCell>
                    <TableCell>{c.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Batches */}
      {recipe.batches && recipe.batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Batches ({recipe.batches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Volume (L)</TableHead>
                  <TableHead>Vessels</TableHead>
                  <TableHead>pH</TableHead>
                  <TableHead>Autoclaved</TableHead>
                  <TableHead>Prepared</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipe.batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.batchNumber}</TableCell>
                    <TableCell>{b.volumeL}</TableCell>
                    <TableCell className="font-mono">{b.vesselCount}</TableCell>
                    <TableCell>{b.measuredPH ?? "—"}</TableCell>
                    <TableCell>{b.autoclaved ? "Yes" : "No"}</TableCell>
                    <TableCell>{format(new Date(b.createdAt), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
