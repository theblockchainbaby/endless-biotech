import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const cultivars = await prisma.cultivar.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { vessels: true } },
    },
  });
  return NextResponse.json(cultivars);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, species, description } = body;

  const cultivar = await prisma.cultivar.create({
    data: { name, species: species || "Cannabis", description: description || null },
  });

  return NextResponse.json(cultivar, { status: 201 });
}
