import { prisma } from "./prisma";
import { PLAN_CONFIG, PlanName } from "./stripe";
import { ApiError } from "./api-helpers";

export async function checkVesselLimit(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, planStatus: true, vesselLimitOverride: true },
  });
  if (!org) throw new ApiError("Organization not found", 404);

  if (org.planStatus === "canceled") {
    throw new ApiError(
      "Your subscription has been canceled. Please resubscribe to create new vessels.",
      403
    );
  }

  // vesselLimitOverride takes priority over plan-based limit
  const plan = PLAN_CONFIG[org.plan as PlanName] || PLAN_CONFIG.free;
  const effectiveLimit = org.vesselLimitOverride ?? (plan.maxVessels === Infinity ? Infinity : plan.maxVessels);
  if (effectiveLimit === Infinity) return;

  const activeVesselCount = await prisma.vessel.count({
    where: {
      organizationId,
      status: { notIn: ["disposed"] },
    },
  });

  if (activeVesselCount >= effectiveLimit) {
    throw new ApiError(
      `You've reached the vessel limit of ${effectiveLimit.toLocaleString()} active vessels. Contact support to increase your limit.`,
      403
    );
  }
}

export async function checkTeamMemberLimit(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, planStatus: true },
  });
  if (!org) throw new ApiError("Organization not found", 404);

  if (org.planStatus === "canceled") {
    throw new ApiError(
      "Your subscription has been canceled. Please resubscribe to add team members.",
      403
    );
  }

  const plan = PLAN_CONFIG[org.plan as PlanName] || PLAN_CONFIG.free;
  if (plan.maxTeamMembers === Infinity) return;

  const memberCount = await prisma.user.count({
    where: { organizationId },
  });

  if (memberCount >= plan.maxTeamMembers) {
    throw new ApiError(
      `You've reached the ${plan.name} plan limit of ${plan.maxTeamMembers} team members. Upgrade your plan to add more.`,
      403
    );
  }
}

export async function getOrgPlanStatus(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      plan: true,
      planStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      stripeSubscriptionId: true,
      vesselLimitOverride: true,
      _count: {
        select: {
          users: true,
          vessels: { where: { status: { notIn: ["disposed"] } } },
        },
      },
    },
  });
  if (!org) throw new ApiError("Organization not found", 404);

  const planConfig = PLAN_CONFIG[org.plan as PlanName] || PLAN_CONFIG.free;
  const effectiveVesselLimit = org.vesselLimitOverride ?? (planConfig.maxVessels === Infinity ? -1 : planConfig.maxVessels);

  return {
    plan: org.plan,
    planName: planConfig.name,
    planStatus: org.planStatus,
    trialEndsAt: org.trialEndsAt,
    currentPeriodEnd: org.currentPeriodEnd,
    hasSubscription: !!org.stripeSubscriptionId,
    price: planConfig.price,
    limits: {
      maxVessels: effectiveVesselLimit,
      maxTeamMembers: planConfig.maxTeamMembers === Infinity ? -1 : planConfig.maxTeamMembers,
      currentVessels: org._count.vessels,
      currentTeamMembers: org._count.users,
    },
  };
}
