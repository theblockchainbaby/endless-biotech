import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(1, "Lab name is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate slug from org name
    let slug = data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Ensure slug is unique
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create org + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug,
          plan: "free",
        },
      });

      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: "admin",
          pin: "0000",
          organizationId: org.id,
        },
      });

      // Create default site
      await tx.site.create({
        data: {
          name: "Main Lab",
          organizationId: org.id,
        },
      });

      return { user, org };
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((i) => {
        const path = i.path.length > 0 ? `${i.path.join(".")}: ` : "";
        return `${path}${i.message}`;
      });
      return NextResponse.json({ error: messages.join("; ") }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
