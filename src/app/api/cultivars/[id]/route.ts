import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const cultivar = await prisma.cultivar.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(cultivar);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.cultivar.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
