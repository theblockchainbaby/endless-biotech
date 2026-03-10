import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendSubcultureReminderEmail, sendLowInventoryAlert, sendContaminationSpikeAlert } from "@/lib/email";

// This endpoint is called by Vercel Cron daily
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/daily-alerts", "schedule": "0 8 * * *" }] }

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  const results: { org: string; subculture: boolean; inventory: boolean; contaminationSpike: boolean }[] = [];

  for (const org of orgs) {
    // 1. Subculture reminders
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [overdueCount, dueTodayCount] = await Promise.all([
      prisma.vessel.count({
        where: {
          organizationId: org.id,
          status: { notIn: ["disposed", "multiplied"] },
          nextSubcultureDate: { lt: now },
        },
      }),
      prisma.vessel.count({
        where: {
          organizationId: org.id,
          status: { notIn: ["disposed", "multiplied"] },
          nextSubcultureDate: { gte: now, lte: endOfToday },
        },
      }),
    ]);

    let subcultureSent = false;
    if (overdueCount > 0 || dueTodayCount > 0) {
      // Persist alert to database
      await prisma.alert.create({
        data: {
          type: "subculture_due",
          severity: overdueCount > 10 ? "critical" : "warning",
          title: `${overdueCount} overdue, ${dueTodayCount} due today`,
          message: `${overdueCount} vessel${overdueCount !== 1 ? "s" : ""} overdue for subculture and ${dueTodayCount} due today. Review and process these vessels to stay on schedule.`,
          organizationId: org.id,
        },
      });

      const managers = await prisma.user.findMany({
        where: {
          organizationId: org.id,
          role: { in: ["admin", "manager", "lead_tech"] },
          isActive: true,
        },
        select: { email: true },
      });

      if (managers.length > 0) {
        await sendSubcultureReminderEmail({
          overdueCount,
          dueTodayCount,
          recipientEmails: managers.map((m) => m.email),
        });
        subcultureSent = true;
      }
    }

    // 2. Low inventory alerts
    let inventorySent = false;
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        organizationId: org.id,
        reorderLevel: { not: null },
      },
    });

    const alertItems = lowStockItems.filter(
      (item) => item.reorderLevel !== null && item.currentStock <= item.reorderLevel
    );

    if (alertItems.length > 0) {
      // Persist alerts to database
      for (const item of alertItems) {
        await prisma.alert.create({
          data: {
            type: "low_inventory",
            severity: item.currentStock === 0 ? "critical" : "warning",
            title: `Low stock: ${item.name}`,
            message: `${item.name} is at ${item.currentStock} ${item.unit} (reorder level: ${item.reorderLevel} ${item.unit}). Restock soon to avoid disruptions.`,
            entityType: "inventory_item",
            entityId: item.id,
            organizationId: org.id,
          },
        });
      }

      const managers = await prisma.user.findMany({
        where: {
          organizationId: org.id,
          role: { in: ["admin", "manager"] },
          isActive: true,
        },
        select: { email: true },
      });

      if (managers.length > 0) {
        for (const item of alertItems) {
          await sendLowInventoryAlert({
            itemName: item.name,
            currentStock: item.currentStock,
            reorderLevel: item.reorderLevel!,
            unit: item.unit,
            recipientEmails: managers.map((m) => m.email),
          });
        }
        inventorySent = true;
      }
    }

    // 3. Contamination spike detection
    let contaminationSpikeSent = false;
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [currentWeekCount, previousWeekCount] = await Promise.all([
      prisma.vessel.count({
        where: {
          organizationId: org.id,
          contaminationDate: { gte: weekAgo },
        },
      }),
      prisma.vessel.count({
        where: {
          organizationId: org.id,
          contaminationDate: { gte: twoWeeksAgo, lt: weekAgo },
        },
      }),
    ]);

    const isSpike = currentWeekCount >= 3 && (previousWeekCount === 0 || currentWeekCount >= previousWeekCount * 2);

    if (isSpike) {
      await prisma.alert.create({
        data: {
          type: "contamination_spike",
          severity: "critical",
          title: `Contamination spike: ${currentWeekCount} cases this week`,
          message: `${currentWeekCount} contamination cases detected this week vs ${previousWeekCount} last week. Investigate environmental conditions, media batches, and procedural compliance immediately.`,
          organizationId: org.id,
        },
      });

      const managers = await prisma.user.findMany({
        where: {
          organizationId: org.id,
          role: { in: ["admin", "manager", "lead_tech"] },
          isActive: true,
        },
        select: { email: true },
      });

      if (managers.length > 0) {
        await sendContaminationSpikeAlert({
          currentWeekCount,
          previousWeekCount,
          orgName: org.name,
          recipientEmails: managers.map((m) => m.email),
        });
        contaminationSpikeSent = true;
      }
    }

    results.push({ org: org.name, subculture: subcultureSent, inventory: inventorySent, contaminationSpike: contaminationSpikeSent });
  }

  return NextResponse.json({ success: true, results });
}
