import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, role, pin } = body;

  const user = await prisma.user.create({
    data: { name, role: role || "tech", pin: pin || null },
  });

  return NextResponse.json(user, { status: 201 });
}
