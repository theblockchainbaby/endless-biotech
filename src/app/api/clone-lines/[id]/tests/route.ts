import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createTestSchema = z.object({
  testDate: z.string().min(1, "Test date is required"),
  result: z.enum(["clean", "dirty", "inconclusive"]),
  pathogen: z.string().nullable().optional(),
  testingId: z.string().nullable().optional(),
  labName: z.string().min(1, "Lab name is required"),
  assayType: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const cloneLine = await prisma.cloneLine.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!cloneLine) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const tests = await prisma.pathogenTest.findMany({
      where: { cloneLineId: id },
      include: { loggedBy: { select: { id: true, name: true } } },
      orderBy: { testDate: "desc" },
    });

    return NextResponse.json(tests);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = createTestSchema.parse(await req.json());

    const cloneLine = await prisma.cloneLine.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!cloneLine) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const test = await prisma.pathogenTest.create({
      data: {
        cloneLineId: id,
        testDate: new Date(body.testDate),
        result: body.result,
        pathogen: body.pathogen ?? null,
        testingId: body.testingId ?? null,
        labName: body.labName,
        assayType: body.assayType ?? null,
        notes: body.notes ?? null,
        loggedById: user.id,
        organizationId: user.organizationId,
      },
      include: { loggedBy: { select: { id: true, name: true } } },
    });

    // Denormalize: update lastTestedAt and lastTestResult on the clone line
    // Also auto-quarantine if dirty
    await prisma.cloneLine.update({
      where: { id },
      data: {
        lastTestedAt: test.testDate,
        lastTestResult: body.result,
        ...(body.result === "dirty" ? { status: "quarantined" } : {}),
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
