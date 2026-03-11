"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/constants";
import type { UserProfile } from "@/lib/types";
import { toast } from "sonner";

interface OrgSettings {
  defaultSubcultureDays?: number;
  defaultMultiplicationRate?: number;
  alertOnContamination?: boolean;
  alertOnLowInventory?: boolean;
  alertOnSubcultureDue?: boolean;
  alertOnEnvironmentOutOfRange?: boolean;
  emailFrom?: string;
  timezone?: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Org settings
  const [orgName, setOrgName] = useState("");
  const [orgPlan, setOrgPlan] = useState("");
  const [settings, setSettings] = useState<OrgSettings>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // New user form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("tech");
  const [pin, setPin] = useState("");

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const fetchUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  const fetchOrgSettings = () => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setOrgName(data.name || "");
        setOrgPlan(data.plan || "pro");
        setSettings((data.settings as OrgSettings) || {});
      })
      .catch(() => {});
  };

  const saveOrgSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, settings }),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save settings");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrgSettings();
  }, []);

  const handleCreate = async () => {
    if (!name || !email || !password) {
      toast.error("Name, email, and password are required");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = { name, email, password, role };
      if (pin) body.pin = pin;

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("User created");
        setDialogOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("tech");
        setPin("");
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create user");
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      toast.success(isActive ? "User deactivated" : "User activated");
      fetchUsers();
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      toast.error("Fill in current and new password");
      return;
    }
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        toast.success("Password changed");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to change password");
      }
    } finally {
      setChangingPw(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success("Role updated");
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Manage users and organization settings"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Invite User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{USER_ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>PIN (4 digits, optional)</Label>
                    <Input value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} placeholder="1234" className="mt-1 font-mono" />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Users table */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Members ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                        <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{USER_ROLE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "default" : "secondary"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(u.id, u.isActive)}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Separator />

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Organization Name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Plan</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={orgPlan} disabled className="bg-muted flex-1" />
                <a href="/admin/billing">
                  <Button variant="outline" size="sm" type="button">
                    Manage Billing
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Culture Defaults</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Default Subculture Interval (days)</Label>
                <Input
                  type="number"
                  value={settings.defaultSubcultureDays ?? 14}
                  onChange={(e) => setSettings({ ...settings, defaultSubcultureDays: parseInt(e.target.value) || 14 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Default Multiplication Rate</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.defaultMultiplicationRate ?? 3.0}
                  onChange={(e) => setSettings({ ...settings, defaultMultiplicationRate: parseFloat(e.target.value) || 3.0 })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Email Alert Preferences</p>
            <div className="space-y-3">
              <ToggleSetting
                label="Contamination alerts"
                description="Email admins/managers when a vessel is marked contaminated"
                checked={settings.alertOnContamination !== false}
                onChange={(v) => setSettings({ ...settings, alertOnContamination: v })}
              />
              <ToggleSetting
                label="Low inventory alerts"
                description="Daily email when stock falls below reorder level"
                checked={settings.alertOnLowInventory !== false}
                onChange={(v) => setSettings({ ...settings, alertOnLowInventory: v })}
              />
              <ToggleSetting
                label="Subculture reminders"
                description="Daily email for overdue and due-today subcultures"
                checked={settings.alertOnSubcultureDue !== false}
                onChange={(v) => setSettings({ ...settings, alertOnSubcultureDue: v })}
              />
              <ToggleSetting
                label="Environment out-of-range"
                description="Alert when temperature/humidity/CO2 exceed thresholds"
                checked={settings.alertOnEnvironmentOutOfRange !== false}
                onChange={(v) => setSettings({ ...settings, alertOnEnvironmentOutOfRange: v })}
              />
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Timezone</p>
            <Select
              value={settings.timezone || "America/New_York"}
              onValueChange={(v) => setSettings({ ...settings, timezone: v })}
            >
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={saveOrgSettings} disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-w-sm">
          <div>
            <Label>Current Password</Label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1" placeholder="Min 8 characters" />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPw}>
            {changingPw ? "Changing..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300"
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
