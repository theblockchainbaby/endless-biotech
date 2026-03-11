import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { getOrgPlanStatus } from "@/lib/plan-limits";

export async function GET() {
  try {
    const user = await requireAuth();
    const status = await getOrgPlanStatus(user.organizationId);
    return NextResponse.json(status);
  } catch (error) {
    return handleApiError(error);
  }
}
