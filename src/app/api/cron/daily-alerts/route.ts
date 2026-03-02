import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendSubcultureReminderEmail, sendLowInventoryAlert } from "@/lib/email";

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

  const results: { org: string; subculture: boolean; inventory: boolean }[] = [];

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

    results.push({ org: org.name, subculture: subcultureSent, inventory: inventorySent });
  }

  return NextResponse.json({ success: true, results });
}
