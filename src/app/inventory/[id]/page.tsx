"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { format } from "date-fns";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  chemical: "Chemical",
  consumable: "Consumable",
  container: "Container",
  equipment: "Equipment",
};

interface UsageRecord {
  id: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

interface InventoryDetail {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  supplier: string | null;
  currentStock: number;
  unit: string;
  reorderLevel: number | null;
  costPerUnit: number | null;
  storageLocation: string | null;
  expirationDate: string | null;
  usage: UsageRecord[];
}

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<InventoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchItem = () => {
    fetch(`/api/inventory/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  const recordUsage = async (isRestock: boolean) => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/${id}/usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: isRestock ? qty : -qty,
          reason: reason || (isRestock ? "Restock" : "Consumed"),
        }),
      });

      if (res.ok) {
        toast.success(isRestock ? "Restocked" : "Usage recorded");
        setUseDialogOpen(false);
        setRestockDialogOpen(false);
        setQuantity("");
        setReason("");
        fetchItem();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this inventory item?")) return;
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Item deleted");
      router.push("/inventory");
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!item) return <div className="text-center py-12 text-muted-foreground">Item not found</div>;

  const isLow = item.reorderLevel != null && item.currentStock <= item.reorderLevel;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={item.name}
        description={CATEGORY_LABELS[item.category] || item.category}
        actions={
          <div className="flex gap-2">
            {isLow && <Badge variant="destructive">Low Stock</Badge>}
            <Button variant="outline" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        }
      />

      {/* Quick actions */}
      <div className="flex gap-2">
        <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Record Usage</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Usage</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quantity Used ({item.unit})</Label>
                <Input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Media prep, experiment, etc." className="mt-1" />
              </div>
              <Button onClick={() => recordUsage(false)} disabled={submitting} className="w-full">
                {submitting ? "Saving..." : "Record Usage"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Restock</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Restock</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quantity to Add ({item.unit})</Label>
                <Input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="PO number, vendor, etc." className="mt-1" />
              </div>
              <Button onClick={() => recordUsage(true)} disabled={submitting} className="w-full">
                {submitting ? "Saving..." : "Add Stock"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Item Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">Category</span>
            <Badge variant="outline">{CATEGORY_LABELS[item.category] || item.category}</Badge>
            <span className="text-muted-foreground">Current Stock</span>
            <span className={`font-mono text-lg ${isLow ? "text-red-500 font-bold" : ""}`}>
              {item.currentStock} {item.unit}
            </span>
            <span className="text-muted-foreground">Reorder Level</span>
            <span className="font-mono">{item.reorderLevel != null ? `${item.reorderLevel} ${item.unit}` : "—"}</span>
            {item.sku && (
              <>
                <span className="text-muted-foreground">SKU</span>
                <span className="font-mono">{item.sku}</span>
              </>
            )}
            {item.supplier && (
              <>
                <span className="text-muted-foreground">Supplier</span>
                <span>{item.supplier}</span>
              </>
            )}
            {item.costPerUnit != null && (
              <>
                <span className="text-muted-foreground">Cost per Unit</span>
                <span className="font-mono">${item.costPerUnit.toFixed(2)}</span>
              </>
            )}
            {item.storageLocation && (
              <>
                <span className="text-muted-foreground">Storage</span>
                <span>{item.storageLocation}</span>
              </>
            )}
            {item.expirationDate && (
              <>
                <span className="text-muted-foreground">Expires</span>
                <span>{format(new Date(item.expirationDate), "MMM d, yyyy")}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage history */}
      <Card>
        <CardHeader><CardTitle className="text-base">Usage History ({item.usage.length})</CardTitle></CardHeader>
        <CardContent>
          {item.usage.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.usage.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-sm">{format(new Date(u.createdAt), "MMM d, HH:mm")}</TableCell>
                    <TableCell className={`text-right font-mono ${u.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                      {u.quantity > 0 ? "+" : ""}{u.quantity}
                    </TableCell>
                    <TableCell className="text-sm">{u.reason || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.user?.name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
