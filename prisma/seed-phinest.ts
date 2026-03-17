// Quick script to seed just the Phinest demo account
// Usage: npx tsx prisma/seed-phinest.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STAGES = ["initiation", "multiplication", "rooting", "acclimation", "hardening"] as const;
const HEALTH = ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "stable", "stable", "slow_growth", "critical"] as const;

function randomDate(daysBack: number): Date {
  return new Date(Date.now() - Math.random() * daysBack * 86400000);
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  VitrOS — Seeding Phinest Tissue Culture demo");
  console.log("═══════════════════════════════════════════════\n");

  // Check if org already exists
  const existing = await prisma.organization.findUnique({ where: { slug: "phinest" } });
  if (existing) {
    console.log("Deleting existing phinest org...");
    await prisma.activity.deleteMany({ where: { vessel: { organizationId: existing.id } } });
    await prisma.vessel.deleteMany({ where: { organizationId: existing.id } });
    await prisma.mediaBatch.deleteMany({ where: { recipe: { organizationId: existing.id } } });
    await prisma.mediaComponent.deleteMany({ where: { recipe: { organizationId: existing.id } } });
    await prisma.mediaRecipe.deleteMany({ where: { organizationId: existing.id } });
    await prisma.cultivar.deleteMany({ where: { organizationId: existing.id } });
    await prisma.environmentReading.deleteMany({ where: { location: { site: { organizationId: existing.id } } } });
    await prisma.location.deleteMany({ where: { site: { organizationId: existing.id } } });
    await prisma.site.deleteMany({ where: { organizationId: existing.id } });
    await prisma.alert.deleteMany({ where: { organizationId: existing.id } });
    await prisma.pathogenTest.deleteMany({ where: { organizationId: existing.id } });
    await prisma.cloneLine.deleteMany({ where: { organizationId: existing.id } });
    await prisma.salesOrder.deleteMany({ where: { organizationId: existing.id } });
    await prisma.apiKey.deleteMany({ where: { organizationId: existing.id } });
    await prisma.webhookEndpoint.deleteMany({ where: { organizationId: existing.id } });
    await prisma.session.deleteMany({ where: { user: { organizationId: existing.id } } });
    await prisma.account.deleteMany({ where: { user: { organizationId: existing.id } } });
    await prisma.user.deleteMany({ where: { organizationId: existing.id } });
    await prisma.organization.delete({ where: { id: existing.id } });
  }

  // Create org
  const org = await prisma.organization.create({
    data: { name: "Phinest Tissue Culture", slug: "phinest", plan: "pro" },
  });

  // Create users
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Hector Monge",
      email: "demo@phinest.vitros.app",
      passwordHash,
      role: "admin",
      pin: "0000",
      organizationId: org.id,
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      name: "Lab Technician",
      email: "tech1@phinest.vitros.app",
      passwordHash,
      role: "lead_tech",
      pin: "1111",
      organizationId: org.id,
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      name: "Junior Technician",
      email: "tech2@phinest.vitros.app",
      passwordHash,
      role: "tech",
      pin: "2222",
      organizationId: org.id,
    },
  });

  const users = [admin, tech1, tech2];
  console.log(`✓ Org "Phinest Tissue Culture" with 3 users`);
  console.log(`  Login: demo@phinest.vitros.app / demo1234 (PIN: 0000)`);

  // Create site + locations
  const site = await prisma.site.create({
    data: { name: "Sacramento TC Facility", address: "3835 N. Freeway Blvd. Suite #210, Sacramento, CA 95834", organizationId: org.id },
  });

  const locationData = [
    { name: "TC Lab 1 — Flow Hood A", type: "flow_hood", capacity: 350 },
    { name: "TC Lab 1 — Flow Hood B", type: "flow_hood", capacity: 350 },
    { name: "TC Lab 2 — Flow Hood C", type: "flow_hood", capacity: 300 },
    { name: "TC Lab 2 — Flow Hood D", type: "flow_hood", capacity: 300 },
    { name: "TC Lab 3 — Meristem Isolation", type: "flow_hood", capacity: 200 },
    { name: "Growth Chamber A", type: "growth_chamber", capacity: 800 },
    { name: "Growth Chamber B", type: "growth_chamber", capacity: 800 },
    { name: "Growth Chamber C", type: "growth_chamber", capacity: 600 },
    { name: "Mother Room", type: "growth_chamber", capacity: 300 },
    { name: "Rooting Chamber", type: "growth_chamber", capacity: 600 },
    { name: "Germplasm Bank — Cold Storage", type: "cold_storage", capacity: 500 },
    { name: "Nursery Bay A", type: "greenhouse", capacity: 2000 },
    { name: "Nursery Bay B", type: "greenhouse", capacity: 2000 },
    { name: "Hardening Greenhouse", type: "greenhouse", capacity: 1500 },
    { name: "Acclimation Bench Section", type: "bench", capacity: 600 },
  ];

  const locationIds: string[] = [];
  for (const loc of locationData) {
    const created = await prisma.location.create({
      data: { name: loc.name, type: loc.type, capacity: loc.capacity, siteId: site.id },
    });
    locationIds.push(created.id);
  }
  console.log(`✓ ${locationData.length} locations`);

  // Create media recipes
  const recipeData = [
    { name: "MS + 1mg/L BAP (Cannabis Mult)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
    { name: "MS + 0.5mg/L TDZ (High Mult)", baseMedia: "MS", targetPH: 5.8, agar: 7.5, sucrose: 25.0, stage: "multiplication" },
    { name: "MS + 0.5mg/L IBA Rooting", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 30.0, stage: "rooting" },
    { name: "MS Meristem Tip Initiation", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
    { name: "MS + PPM Pathogen Remediation", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 20.0, stage: "initiation" },
  ];

  const recipeIds: string[] = [];
  for (const recipe of recipeData) {
    const created = await prisma.mediaRecipe.create({
      data: {
        name: recipe.name,
        baseMedia: recipe.baseMedia,
        targetPH: recipe.targetPH,
        agarConcentration: recipe.agar,
        sucroseConcentration: recipe.sucrose,
        stage: recipe.stage,
        organizationId: org.id,
      },
    });
    recipeIds.push(created.id);
  }
  console.log(`✓ ${recipeData.length} media recipes`);

  // Create cultivars — actual Phinest genetics
  const cultivarData = [
    { name: "Grapes and Cream", code: "CAN-GNC", species: "Cannabis hybrid", strain: "Grapes and Cream" },
    { name: "Super Runtz", code: "CAN-SRZ", species: "Cannabis hybrid", strain: "Super Runtz" },
    { name: "Lava Cake", code: "CAN-LVC", species: "Cannabis indica", strain: "Lava Cake" },
    { name: "Gelato 33", code: "CAN-G33", species: "Cannabis hybrid", strain: "Gelato 33" },
    { name: "Sunset Sherbet", code: "CAN-SSH", species: "Cannabis hybrid", strain: "Sunset Sherbet" },
    { name: "Purple Punch 2.0", code: "CAN-PP2", species: "Cannabis indica", strain: "Purple Punch 2.0" },
    { name: "Mimosa", code: "CAN-MMS", species: "Cannabis sativa", strain: "Mimosa" },
    { name: "Wedding Crasher", code: "CAN-WCR", species: "Cannabis hybrid", strain: "Wedding Crasher" },
    { name: "Fatso", code: "CAN-FAT", species: "Cannabis indica", strain: "Fatso" },
    { name: "RS11", code: "CAN-R11", species: "Cannabis hybrid", strain: "RS11" },
    { name: "Amaretto Mintz", code: "CAN-AMZ", species: "Cannabis hybrid", strain: "Amaretto Mintz" },
    { name: "Carbon Fiber", code: "CAN-CBF", species: "Cannabis hybrid", strain: "Carbon Fiber" },
  ];

  const cultivarIds: string[] = [];
  for (const c of cultivarData) {
    const created = await prisma.cultivar.create({
      data: {
        name: c.name,
        code: c.code,
        species: c.species,
        strain: c.strain,
        cultivarType: "in_house",
        targetMultiplicationRate: randomInt(3, 8),
        organizationId: org.id,
      },
    });
    cultivarIds.push(created.id);
  }
  console.log(`✓ ${cultivarData.length} cultivars`);

  // ── Create Vessels ──
  const vesselCount = 500;
  let vesselNum = 0;

  const initCount = Math.round(vesselCount * 0.06);
  const multiCount = Math.round(vesselCount * 0.35);
  const rootCount = Math.round(vesselCount * 0.22);
  const acclCount = Math.round(vesselCount * 0.18);
  const hardCount = Math.round(vesselCount * 0.10);
  const disposedCount = Math.round(vesselCount * 0.06);
  const multipliedCount = vesselCount - initCount - multiCount - rootCount - acclCount - hardCount - disposedCount;

  const stageDistribution = [
    { stage: "initiation", count: initCount, statusOptions: ["planted", "growing"] },
    { stage: "multiplication", count: multiCount, statusOptions: ["growing", "ready_to_multiply"] },
    { stage: "rooting", count: rootCount, statusOptions: ["growing"] },
    { stage: "acclimation", count: acclCount, statusOptions: ["growing"] },
    { stage: "hardening", count: hardCount, statusOptions: ["growing"] },
  ];

  for (const dist of stageDistribution) {
    for (let i = 0; i < dist.count; i++) {
      vesselNum++;
      const barcode = `PHI-${String(vesselNum).padStart(5, "0")}`;
      const cultivarId = pick(cultivarIds);
      const locationId = pick(locationIds);
      const recipeId = pick(recipeIds);
      const health = pick(HEALTH);
      const status = pick(dist.statusOptions as string[]);
      const generation = dist.stage === "initiation" ? 0 : randomInt(1, 6);
      const subcultureNumber = dist.stage === "initiation" ? 0 : randomInt(1, generation + 2);
      const plantedAt = randomDate(90);
      const lastSub = new Date(plantedAt.getTime() + randomInt(7, 30) * 86400000);
      const nextSub = new Date(lastSub.getTime() + 14 * 86400000);

      const isContaminated = Math.random() < 0.04;
      const contaminationType = isContaminated ? pick(["bacterial", "fungal", "viral", "unknown"] as const) : null;
      const contaminationDate = isContaminated ? randomDate(30) : null;
      const finalHealth = isContaminated ? "critical" : health;

      const vessel = await prisma.vessel.create({
        data: {
          barcode,
          cultivarId,
          mediaRecipeId: recipeId,
          locationId,
          explantCount: randomInt(1, 12),
          healthStatus: finalHealth,
          status,
          stage: dist.stage,
          subcultureNumber,
          generation,
          contaminationType,
          contaminationDate,
          plantedAt,
          lastSubcultureDate: dist.stage !== "initiation" ? lastSub : null,
          nextSubcultureDate: dist.stage === "multiplication" ? nextSub : null,
          organizationId: org.id,
        },
      });

      await prisma.activity.create({
        data: {
          vesselId: vessel.id,
          userId: pick(users).id,
          type: "created",
          category: "vessel",
          newState: { status: "planted", stage: "initiation" },
          notes: `Vessel ${barcode} initiated`,
          createdAt: plantedAt,
        },
      });

      const stageIdx = STAGES.indexOf(dist.stage as typeof STAGES[number]);
      if (stageIdx > 0) {
        for (let s = 1; s <= stageIdx; s++) {
          const advDate = new Date(plantedAt.getTime() + s * randomInt(10, 20) * 86400000);
          await prisma.activity.create({
            data: {
              vesselId: vessel.id,
              userId: pick(users).id,
              type: "stage_advanced",
              category: "vessel",
              previousState: { stage: STAGES[s - 1] },
              newState: { stage: STAGES[s] },
              notes: `Advanced from ${STAGES[s - 1]} to ${STAGES[s]}`,
              createdAt: advDate,
            },
          });
        }
      }

      if (isContaminated) {
        await prisma.activity.create({
          data: {
            vesselId: vessel.id,
            userId: pick(users).id,
            type: "contaminated",
            category: "vessel",
            newState: { healthStatus: "critical", contaminationType },
            notes: `${contaminationType} contamination detected`,
            createdAt: contaminationDate!,
          },
        });
      }
    }
  }

  // Disposed vessels
  for (let i = 0; i < disposedCount; i++) {
    vesselNum++;
    const barcode = `PHI-${String(vesselNum).padStart(5, "0")}`;
    const plantedAt = randomDate(90);
    const vessel = await prisma.vessel.create({
      data: {
        barcode,
        cultivarId: pick(cultivarIds),
        locationId: pick(locationIds),
        explantCount: randomInt(1, 6),
        healthStatus: "dead",
        status: "disposed",
        stage: pick(["initiation", "multiplication", "rooting"] as const),
        disposalReason: pick(["contaminated", "dead", "end_of_life"] as const),
        contaminationType: Math.random() < 0.6 ? pick(["bacterial", "fungal"] as const) : null,
        contaminationDate: randomDate(60),
        plantedAt,
        organizationId: org.id,
      },
    });

    await prisma.activity.create({
      data: {
        vesselId: vessel.id,
        userId: pick(users).id,
        type: "disposed",
        category: "vessel",
        notes: "Disposed",
        createdAt: randomDate(30),
      },
    });
  }

  // Multiplied vessels
  for (let i = 0; i < multipliedCount; i++) {
    vesselNum++;
    const barcode = `PHI-${String(vesselNum).padStart(5, "0")}`;
    const plantedAt = randomDate(60);
    const vessel = await prisma.vessel.create({
      data: {
        barcode,
        cultivarId: pick(cultivarIds),
        locationId: pick(locationIds),
        explantCount: 0,
        healthStatus: "healthy",
        status: "multiplied",
        stage: "multiplication",
        generation: randomInt(1, 4),
        subcultureNumber: randomInt(2, 6),
        plantedAt,
        lastSubcultureDate: randomDate(30),
        organizationId: org.id,
      },
    });

    await prisma.activity.create({
      data: {
        vesselId: vessel.id,
        userId: pick(users).id,
        type: "multiplied",
        category: "vessel",
        previousState: { status: "growing" },
        newState: { status: "multiplied" },
        metadata: { childCount: randomInt(3, 8) },
        notes: "Multiplied into new vessels",
        createdAt: randomDate(30),
      },
    });
  }

  console.log(`✓ ${vesselNum} vessels with activity history`);

  // ── Clone Lines for Gelato 33 (Feature: Meristematic Lines) ──
  const gelato33Id = cultivarIds[3]; // index 3 = Gelato 33

  const cloneLineData = [
    { name: "Gelato 33 — Line A", code: "G33-A", lineNumber: 1, status: "active", notes: "Primary production line. Excellent vigor." },
    { name: "Gelato 33 — Line B", code: "G33-B", lineNumber: 2, status: "active", notes: "Secondary line. Slightly slower multiplication." },
    { name: "Gelato 33 — Line C", code: "G33-C", lineNumber: 3, status: "quarantined", notes: "Quarantined due to HLVd detection." },
    { name: "Gelato 33 — Line D", code: "G33-D", lineNumber: 4, status: "active", notes: "New line from clean source. Promising." },
    { name: "Super Runtz — Line 1", code: "SRZ-1", lineNumber: 1, status: "active", notes: "Main production line." },
    { name: "Grapes and Cream — Line 1", code: "GNC-1", lineNumber: 1, status: "active", notes: "High demand line." },
  ];

  const supRuntzId = cultivarIds[1]; // Super Runtz
  const gncId = cultivarIds[0]; // Grapes and Cream

  const cultivarForLine = [gelato33Id, gelato33Id, gelato33Id, gelato33Id, supRuntzId, gncId];
  const cloneLineIds: string[] = [];

  for (let i = 0; i < cloneLineData.length; i++) {
    const cl = cloneLineData[i];
    const created = await prisma.cloneLine.create({
      data: {
        name: cl.name,
        code: cl.code,
        lineNumber: cl.lineNumber,
        cultivarId: cultivarForLine[i],
        sourceType: "meristem",
        status: cl.status,
        notes: cl.notes,
        organizationId: org.id,
        startDate: randomDate(120),
      },
    });
    cloneLineIds.push(created.id);
  }
  console.log(`✓ ${cloneLineData.length} clone lines`);

  // ── Pathogen Tests (Feature: Pathogen Test Logging) ──
  // Line A: 2 clean tests
  const lineA = cloneLineIds[0];
  await prisma.pathogenTest.create({
    data: {
      cloneLineId: lineA,
      testDate: new Date(Date.now() - 90 * 86400000),
      result: "clean",
      labName: "Confident Cannabis Labs",
      assayType: "RT-PCR",
      testingId: "CC-2024-001",
      organizationId: org.id,
      loggedById: admin.id,
    },
  });
  await prisma.pathogenTest.create({
    data: {
      cloneLineId: lineA,
      testDate: new Date(Date.now() - 30 * 86400000),
      result: "clean",
      labName: "Confident Cannabis Labs",
      assayType: "RT-PCR",
      testingId: "CC-2024-084",
      organizationId: org.id,
      loggedById: admin.id,
    },
  });
  await prisma.cloneLine.update({
    where: { id: lineA },
    data: { lastTestedAt: new Date(Date.now() - 30 * 86400000), lastTestResult: "clean" },
  });

  // Line C: clean test then dirty (HLVd) — triggers quarantine
  const lineC = cloneLineIds[2];
  await prisma.pathogenTest.create({
    data: {
      cloneLineId: lineC,
      testDate: new Date(Date.now() - 60 * 86400000),
      result: "clean",
      labName: "Confident Cannabis Labs",
      assayType: "RT-PCR",
      testingId: "CC-2024-042",
      organizationId: org.id,
      loggedById: tech1.id,
    },
  });
  await prisma.pathogenTest.create({
    data: {
      cloneLineId: lineC,
      testDate: new Date(Date.now() - 14 * 86400000),
      result: "dirty",
      pathogen: "Hop Latent Viroid (HLVd)",
      labName: "Confident Cannabis Labs",
      assayType: "RT-PCR",
      testingId: "CC-2024-098",
      notes: "HLVd detected. Line quarantined immediately. Destroying all vessels from this line.",
      organizationId: org.id,
      loggedById: admin.id,
    },
  });
  await prisma.cloneLine.update({
    where: { id: lineC },
    data: { lastTestedAt: new Date(Date.now() - 14 * 86400000), lastTestResult: "dirty" },
  });

  // Line D: one inconclusive
  const lineD = cloneLineIds[3];
  await prisma.pathogenTest.create({
    data: {
      cloneLineId: lineD,
      testDate: new Date(Date.now() - 7 * 86400000),
      result: "inconclusive",
      labName: "Infinite Chemical Analysis",
      assayType: "qPCR",
      testingId: "ICA-2024-007",
      notes: "Inconclusive result. Retesting in 2 weeks.",
      organizationId: org.id,
      loggedById: tech1.id,
    },
  });
  await prisma.cloneLine.update({
    where: { id: lineD },
    data: { lastTestedAt: new Date(Date.now() - 7 * 86400000), lastTestResult: "inconclusive" },
  });
  console.log(`✓ Pathogen test history (clean, dirty HLVd, inconclusive)`);

  // ── Sales Orders with Backward Production Plan (Feature: Production Scheduling) ──
  const sampleOrders = [
    {
      orderNumber: "PO-2024-001",
      customerName: "Green Coast Dispensary",
      cultivarId: gelato33Id,
      quantity: 500,
      unitType: "plugs",
      dueDate: new Date(Date.now() + 90 * 86400000),
      status: "confirmed",
      priority: "high",
      deliveryType: "gen_zero_direct",
      notes: "First large order from Green Coast. Critical.",
      productionPlan: {
        initiationDate: new Date(Date.now() - 4 * 7 * 86400000).toISOString().split("T")[0],
        timeline: [
          { stage: "initiation", startDate: new Date(Date.now() - 4 * 7 * 86400000).toISOString().split("T")[0], endDate: new Date(Date.now()).toISOString().split("T")[0], vesselsNeeded: 72 },
          { stage: "multiplication", startDate: new Date(Date.now()).toISOString().split("T")[0], endDate: new Date(Date.now() + 6 * 7 * 86400000).toISOString().split("T")[0], vesselsNeeded: 55 },
          { stage: "rooting", startDate: new Date(Date.now() + 6 * 7 * 86400000).toISOString().split("T")[0], endDate: new Date(Date.now() + 10 * 7 * 86400000).toISOString().split("T")[0], vesselsNeeded: 550 },
          { stage: "acclimation", startDate: new Date(Date.now() + 10 * 7 * 86400000).toISOString().split("T")[0], endDate: new Date(Date.now() + 12 * 7 * 86400000).toISOString().split("T")[0], vesselsNeeded: 500 },
        ],
      },
    },
    {
      orderNumber: "PO-2024-002",
      customerName: "Apex Cannabis Co.",
      cultivarId: supRuntzId,
      quantity: 300,
      unitType: "plugs",
      dueDate: new Date(Date.now() + 60 * 86400000),
      status: "pending",
      priority: "normal",
      deliveryType: "gen_zero_to_nursery",
      notes: "Nursery pickup.",
      productionPlan: null,
    },
  ];

  for (const order of sampleOrders) {
    await prisma.salesOrder.create({
      data: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        cultivarId: order.cultivarId,
        quantity: order.quantity,
        unitType: order.unitType,
        dueDate: order.dueDate,
        status: order.status,
        priority: order.priority,
        deliveryType: order.deliveryType,
        notes: order.notes,
        productionPlan: order.productionPlan ?? undefined,
        organizationId: org.id,
      },
    });
  }
  console.log(`✓ ${sampleOrders.length} sales orders with production plan`);

  console.log("\n═══════════════════════════════════════════════");
  console.log("✅ Phinest Tissue Culture demo ready!");
  console.log("  Login: demo@phinest.vitros.app / demo1234 (PIN: 0000)");
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
