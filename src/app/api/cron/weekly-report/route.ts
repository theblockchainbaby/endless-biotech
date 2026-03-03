import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// Weekly production summary sent every Monday at 8 AM
// Configure in vercel.json: { "path": "/api/cron/weekly-report", "schedule": "0 8 * * 1" }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  const results: { org: string; sent: boolean }[] = [];

  for (const org of orgs) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      activeVessels,
      createdThisWeek,
      disposedThisWeek,
      multipliedThisWeek,
      contaminatedThisWeek,
      totalExplants,
      vesselsByStage,
    ] = await Promise.all([
      prisma.vessel.count({
        where: { organizationId: org.id, status: { notIn: ["disposed", "multiplied"] } },
      }),
      prisma.vessel.count({
        where: { organizationId: org.id, createdAt: { gte: weekAgo } },
      }),
      prisma.vessel.count({
        where: { organizationId: org.id, status: "disposed", updatedAt: { gte: weekAgo } },
      }),
      prisma.vessel.count({
        where: { organizationId: org.id, status: "multiplied", updatedAt: { gte: weekAgo } },
      }),
      prisma.vessel.count({
        where: { organizationId: org.id, contaminationType: { not: null }, contaminationDate: { gte: weekAgo } },
      }),
      prisma.vessel.aggregate({
        where: { organizationId: org.id, status: { notIn: ["disposed"] } },
        _sum: { explantCount: true },
      }),
      prisma.vessel.groupBy({
        by: ["stage"],
        where: { organizationId: org.id, status: { notIn: ["disposed", "multiplied"] } },
        _count: true,
      }),
    ]);

    const managers = await prisma.user.findMany({
      where: {
        organizationId: org.id,
        role: { in: ["admin", "manager", "lead_tech"] },
        isActive: true,
      },
      select: { email: true },
    });

    if (managers.length === 0) {
      results.push({ org: org.name, sent: false });
      continue;
    }

    const stageRows = vesselsByStage
      .sort((a, b) => {
        const order = ["initiation", "multiplication", "rooting", "acclimation", "hardening"];
        return order.indexOf(a.stage) - order.indexOf(b.stage);
      })
      .map(
        (s) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize">${s.stage}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace">${s._count}</td></tr>`
      )
      .join("");

    await sendEmail({
      to: managers.map((m) => m.email),
      subject: `[VitrOS] Weekly Report — ${org.name}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:550px">
          <div style="background:#16a34a;color:white;padding:16px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:16px">Weekly Production Report</h2>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.9">${org.name} — Week of ${weekAgo.toLocaleDateString()}</p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
            <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
              <div style="flex:1;min-width:100px;text-align:center;padding:12px;border:1px solid #e5e7eb;border-radius:6px">
                <div style="font-size:24px;font-weight:bold">${activeVessels}</div>
                <div style="font-size:11px;color:#6b7280">Active Vessels</div>
              </div>
              <div style="flex:1;min-width:100px;text-align:center;padding:12px;border:1px solid #e5e7eb;border-radius:6px">
                <div style="font-size:24px;font-weight:bold">${(totalExplants._sum.explantCount || 0).toLocaleString()}</div>
                <div style="font-size:11px;color:#6b7280">Total Explants</div>
              </div>
            </div>
            <h3 style="font-size:13px;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:6px">This Week</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr><td style="padding:4px 0;color:#6b7280">New Vessels</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#22c55e">+${createdThisWeek}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280">Multiplied</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#3b82f6">${multipliedThisWeek}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280">Disposed</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:#f59e0b">${disposedThisWeek}</td></tr>
              <tr><td style="padding:4px 0;color:#6b7280">Contaminated</td><td style="padding:4px 0;text-align:right;font-weight:bold;color:${contaminatedThisWeek > 0 ? '#dc2626' : '#22c55e'}">${contaminatedThisWeek}</td></tr>
            </table>
            <h3 style="font-size:13px;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:6px">Pipeline</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              ${stageRows}
            </table>
            <p style="margin-top:20px;font-size:12px;color:#6b7280;text-align:center">Log in to VitrOS for full analytics and reports.</p>
          </div>
        </div>
      `,
    });

    results.push({ org: org.name, sent: true });
  }

  return NextResponse.json({ success: true, results });
}
