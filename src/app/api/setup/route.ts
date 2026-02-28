import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// One-time setup endpoint to create the first organization and admin user.
// Only works when no organizations exist yet.
export async function POST(req: NextRequest) {
  try {
    const existingOrgs = await prisma.organization.count();
    if (existingOrgs > 0) {
      return NextResponse.json(
        { error: "Setup already completed. Organizations exist." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { orgName, userName, email, password } = body;

    if (!orgName || !userName || !email || !password) {
      return NextResponse.json(
        { error: "orgName, userName, email, and password are required" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        plan: "pro",
        users: {
          create: {
            name: userName,
            email,
            passwordHash,
            role: "admin",
          },
        },
        sites: {
          create: {
            name: "Main Lab",
          },
        },
      },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        sites: true,
      },
    });

    return NextResponse.json(
      { message: "Setup complete", organization: org },
      { status: 201 }
    );
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed" },
      { status: 500 }
    );
  }
}
