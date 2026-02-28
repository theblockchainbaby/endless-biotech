"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import type { InventoryItem } from "@/lib/types";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  chemical: "Chemical",
  consumable: "Consumable",
  container: "Container",
  equipment: "Equipment",
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [unit, setUnit] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [supplier, setSupplier] = useState("");
  const [sku, setSku] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [storageLocation, setStorageLocation] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (showLowStock) params.set("lowStock", "true");
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, [categoryFilter, showLowStock]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setName("");
    setCategory("");
    setUnit("");
    setCurrentStock("");
    setReorderLevel("");
    setSupplier("");
    setSku("");
    setCostPerUnit("");
    setStorageLocation("");
  };

  const handleCreate = async () => {
    if (!name || !category || !unit) {
      toast.error("Name, category, and unit are required");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name,
        category,
        unit,
        currentStock: currentStock ? parseFloat(currentStock) : 0,
      };
      if (reorderLevel) body.reorderLevel = parseFloat(reorderLevel);
      if (supplier) body.supplier = supplier;
      if (sku) body.sku = sku;
      if (costPerUnit) body.costPerUnit = parseFloat(costPerUnit);
      if (storageLocation) body.storageLocation = storageLocation;

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Item added");
        setDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } finally {
      setCreating(false);
    }
  };

  const lowStockCount = items.filter((i) =>
    i.reorderLevel != null && i.currentStock <= i.reorderLevel
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${items.length} items tracked`}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {INVENTORY_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] || c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Unit</Label>
                    <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mL, g, ea" className="mt-1" />
                  </div>
                  <div>
                    <Label>Current Stock</Label>
                    <Input type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Reorder Level</Label>
                    <Input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Supplier</Label>
                    <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input value={sku} onChange={(e) => setSku(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cost per Unit ($)</Label>
                    <Input type="number" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Storage Location</Label>
                    <Input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Low stock alert */}
      {lowStockCount > 0 && !showLowStock && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">{lowStockCount} item{lowStockCount > 1 ? "s" : ""} below reorder level</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLowStock(true)}>
              Show Low Stock
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {INVENTORY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showLowStock ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLowStock(!showLowStock)}
            >
              Low Stock Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No inventory items. Add one to get started.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Reorder At</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isLow = item.reorderLevel != null && item.currentStock <= item.reorderLevel;
                return (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/inventory/${item.id}`)}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{CATEGORY_LABELS[item.category] || item.category}</Badge></TableCell>
                    <TableCell className={`text-right font-mono ${isLow ? "text-red-500 font-bold" : ""}`}>
                      {item.currentStock}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{item.reorderLevel ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.supplier ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.storageLocation ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
