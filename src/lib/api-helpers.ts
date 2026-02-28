import { auth } from "./auth";
import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    organizationId: session.user.organizationId,
  };
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new ApiError("Unauthorized", 401);
  }
  return user;
}

export function requireRole(user: AuthenticatedUser, ...roles: string[]) {
  if (!roles.includes(user.role)) {
    throw new ApiError("Insufficient permissions", 403);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.issues },
      { status: 400 }
    );
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}
