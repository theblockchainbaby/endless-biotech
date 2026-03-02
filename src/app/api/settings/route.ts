import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/api-helpers";

// GET org settings
export async function GET() {
  try {
    const user = await requireAuth();

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, name: true, slug: true, plan: true, settings: true },
    });

    if (!org) throw new ApiError("Organization not found", 404);

    return NextResponse.json(org);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH org settings (admin/manager only)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (!["admin", "manager"].includes(user.role)) {
      throw new ApiError("Only admins and managers can update settings", 403);
    }

    const body = await req.json();

    // If updating org name
    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;

    // Merge settings (don't overwrite, merge with existing)
    if (body.settings) {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { settings: true },
      });
      const existingSettings = (org?.settings as Record<string, unknown>) || {};
      updateData.settings = { ...existingSettings, ...body.settings };
    }

    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
      select: { id: true, name: true, slug: true, plan: true, settings: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
