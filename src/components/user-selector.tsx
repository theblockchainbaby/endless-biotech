"use client";

import { useState } from "react";
import { useCurrentUser } from "@/components/user-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export function UserSelector() {
  const { currentUser, users, setCurrentUser, refreshUsers } = useCurrentUser();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("tech");

  const handleSelect = (userId: string) => {
    if (userId === "__none") {
      setCurrentUser(null);
      return;
    }
    const user = users.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const handleAddUser = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), role: newRole }),
    });
    if (res.ok) {
      const user = await res.json();
      await refreshUsers();
      setCurrentUser(user);
      setNewName("");
      setNewRole("tech");
      setAddOpen(false);
      toast.success(`${user.name} added`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentUser?.id || "__none"} onValueChange={handleSelect}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Select tech" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">No user</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            +
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Valin" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="media_maker">Media Maker</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddUser} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
