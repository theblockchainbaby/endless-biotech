import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
      isDismissed: false,
    };
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const unreadCount = await prisma.alert.count({
      where: {
        organizationId: user.organizationId,
        isRead: false,
        isDismissed: false,
      },
    });

    return NextResponse.json({ alerts, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { alertIds, action } = body as { alertIds: string[]; action: "read" | "dismiss" };

    if (!alertIds?.length || !action) {
      return NextResponse.json({ error: "alertIds and action required" }, { status: 400 });
    }

    const data = action === "read" ? { isRead: true } : { isDismissed: true };

    await prisma.alert.updateMany({
      where: {
        id: { in: alertIds },
        organizationId: user.organizationId,
      },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
