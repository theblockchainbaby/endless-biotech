"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { ArrowLeft, Plus, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";

interface PathogenTest {
  id: string;
  testDate: string;
  result: "clean" | "dirty" | "inconclusive";
  pathogen: string | null;
  testingId: string | null;
  labName: string;
  assayType: string | null;
  notes: string | null;
  loggedBy: { id: string; name: string } | null;
  createdAt: string;
}

interface CloneLineDetail {
  id: string;
  name: string;
  code: string | null;
  lineNumber: number | null;
  status: string;
  sourceType: string;
  lastTestResult: string | null;
  lastTestedAt: string | null;
  startDate: string;
  notes: string | null;
  vesselCount: number;
  byStage: Record<string, number>;
  cultivar: { id: string; name: string; code: string | null; species: string };
  pathogenTests: PathogenTest[];
}

function ResultBadge({ result }: { result: string }) {
  if (result === "clean") return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
      <CheckCircle2 className="size-3" /> Clean
    </span>
  );
  if (result === "dirty") return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
      <AlertTriangle className="size-3" /> Dirty
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
      <HelpCircle className="size-3" /> Inconclusive
    </span>
  );
}

export default function CloneLineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [line, setLine] = useState<CloneLineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [logTestOpen, setLogTestOpen] = useState(false);
  const [testForm, setTestForm] = useState({
    testDate: new Date().toISOString().split("T")[0],
    result: "clean" as "clean" | "dirty" | "inconclusive",
    pathogen: "",
    testingId: "",
    labName: "",
    assayType: "",
    notes: "",
  });
  const [savingTest, setSavingTest] = useState(false);

  const fetchLine = () => {
    fetch(`/api/clone-lines/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setLine)
      .catch(() => setLine(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLogTest = async () => {
    if (!testForm.labName.trim()) {
      toast.error("Lab name is required");
      return;
    }
    setSavingTest(true);
    try {
      const res = await fetch(`/api/clone-lines/${id}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testDate: testForm.testDate,
          result: testForm.result,
          pathogen: testForm.pathogen.trim() || null,
          testingId: testForm.testingId.trim() || null,
          labName: testForm.labName.trim(),
          assayType: testForm.assayType.trim() || null,
          notes: testForm.notes.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success(
          testForm.result === "dirty"
            ? "Test logged — line automatically quarantined"
            : "Test logged"
        );
        setLogTestOpen(false);
        setTestForm({ testDate: new Date().toISOString().split("T")[0], result: "clean", pathogen: "", testingId: "", labName: "", assayType: "", notes: "" });
        fetchLine();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to log test");
      }
    } finally {
      setSavingTest(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/clone-lines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success("Status updated");
      fetchLine();
    } else {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!line) return <div className="text-center py-12 text-muted-foreground">Clone line not found</div>;

  const statusColor = line.status === "active" ? "bg-green-100 text-green-700" :
    line.status === "quarantined" ? "bg-red-100 text-red-700" :
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/cultivars/${line.cultivar.id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader
            title={`${line.lineNumber ? `Line #${line.lineNumber} — ` : ""}${line.name}`}
            description={`${line.cultivar.name}${line.cultivar.code ? ` (${line.cultivar.code})` : ""} · ${line.cultivar.species}`}
            actions={
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                  {line.status}
                </span>
                <Select value={line.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="quarantined">Quarantined</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-mono font-bold">{line.vesselCount}</p>
          <p className="text-xs text-muted-foreground">Total Vessels</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-mono font-bold">{line.pathogenTests.length}</p>
          <p className="text-xs text-muted-foreground">Tests Logged</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mt-1">
            {line.lastTestResult ? <ResultBadge result={line.lastTestResult} /> : <span className="text-muted-foreground text-xs">No tests yet</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Last Result</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium mt-1 text-muted-foreground">
            {line.lastTestedAt ? new Date(line.lastTestedAt).toLocaleDateString() : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Last Tested</p>
        </div>
      </div>

      {/* Pathogen Test History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Pathogen Test History</span>
            <Dialog open={logTestOpen} onOpenChange={setLogTestOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="size-3.5 mr-1.5" /> Log Test
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Pathogen Test</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Test Date</Label>
                      <Input
                        type="date"
                        value={testForm.testDate}
                        onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Result</Label>
                      <Select
                        value={testForm.result}
                        onValueChange={(v) => setTestForm({ ...testForm, result: v as "clean" | "dirty" | "inconclusive" })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clean">Clean</SelectItem>
                          <SelectItem value="dirty">Dirty (will quarantine line)</SelectItem>
                          <SelectItem value="inconclusive">Inconclusive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Lab Name</Label>
                      <Input
                        value={testForm.labName}
                        onChange={(e) => setTestForm({ ...testForm, labName: e.target.value })}
                        placeholder="e.g., Confident Cannabis"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Accession / Testing ID</Label>
                      <Input
                        value={testForm.testingId}
                        onChange={(e) => setTestForm({ ...testForm, testingId: e.target.value })}
                        placeholder="Lab sample ID"
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Pathogen Detected (if dirty)</Label>
                      <Input
                        value={testForm.pathogen}
                        onChange={(e) => setTestForm({ ...testForm, pathogen: e.target.value })}
                        placeholder="e.g., Hop Latent Viroid"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Assay Type</Label>
                      <Input
                        value={testForm.assayType}
                        onChange={(e) => setTestForm({ ...testForm, assayType: e.target.value })}
                        placeholder="e.g., RT-PCR, qPCR"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={testForm.notes}
                      onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                      rows={2}
                      placeholder="Any observations or follow-up actions..."
                    />
                  </div>
                  {testForm.result === "dirty" && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="size-4 text-red-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-700">
                        Logging a dirty result will automatically set this line to <strong>Quarantined</strong> status.
                      </p>
                    </div>
                  )}
                  <Button onClick={handleLogTest} disabled={savingTest} className="w-full">
                    {savingTest ? "Saving..." : "Log Test"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {line.pathogenTests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tests logged yet. Log your first pathogen test to start tracking health status.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3">Date</th>
                    <th className="text-left py-2 px-2">Result</th>
                    <th className="text-left py-2 px-2">Lab</th>
                    <th className="text-left py-2 px-2">Accession ID</th>
                    <th className="text-left py-2 px-2">Pathogen</th>
                    <th className="text-left py-2 pl-2">Logged By</th>
                  </tr>
                </thead>
                <tbody>
                  {line.pathogenTests.map((test) => (
                    <tr key={test.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3 font-mono text-xs">
                        {new Date(test.testDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-2">
                        <ResultBadge result={test.result} />
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{test.labName}</td>
                      <td className="py-2 px-2 font-mono text-xs text-muted-foreground">
                        {test.testingId || "—"}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {test.pathogen || "—"}
                      </td>
                      <td className="py-2 pl-2 text-muted-foreground">
                        {test.loggedBy?.name || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Cultivar</span>
            <Link href={`/cultivars/${line.cultivar.id}`} className="text-primary hover:underline">
              {line.cultivar.name}
            </Link>
            <span className="text-muted-foreground">Source Type</span>
            <span className="capitalize">{line.sourceType.replace("_", " ")}</span>
            {line.code && (
              <>
                <span className="text-muted-foreground">Code</span>
                <span className="font-mono">{line.code}</span>
              </>
            )}
            {line.lineNumber && (
              <>
                <span className="text-muted-foreground">Line Number</span>
                <span className="font-mono">#{line.lineNumber}</span>
              </>
            )}
            <span className="text-muted-foreground">Start Date</span>
            <span>{new Date(line.startDate).toLocaleDateString()}</span>
            {line.notes && (
              <>
                <span className="text-muted-foreground">Notes</span>
                <span>{line.notes}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
