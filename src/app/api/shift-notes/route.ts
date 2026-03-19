import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createNoteSchema = z.object({
  content: z.string().min(1),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const notes = await prisma.shiftNote.findMany({
      where: { organizationId: user.organizationId },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(notes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = createNoteSchema.parse(await req.json());

    const note = await prisma.shiftNote.create({
      data: {
        authorId: user.id,
        organizationId: user.organizationId,
        content: body.content,
        priority: body.priority,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
