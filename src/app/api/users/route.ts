import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError, parseBody } from "@/lib/api-helpers";
import { createUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await requireAuth();

    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth();
    requireRole(currentUser, "admin", "manager");
    const body = await parseBody(req, createUserSchema);

    const passwordHash = await bcrypt.hash(body.password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        pin: body.pin || null,
        organizationId: currentUser.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
