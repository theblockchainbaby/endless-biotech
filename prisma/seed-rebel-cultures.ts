// Seed script for Rebel Cultures (Della Fetzer) demo account
// Conservation and specialty crops focus — Dahlias + Strawberries
// Usage: npx tsx prisma/seed-rebel-cultures.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STAGES = ["initiation", "multiplication", "rooting", "acclimation", "hardening"] as const;
const HEALTH = ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "stable", "stable", "slow_growth"] as const;

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
  console.log("  VitrOS — Seeding Rebel Cultures demo");
  console.log("═══════════════════════════════════════════════\n");

  const existing = await prisma.organization.findUnique({ where: { slug: "rebel-cultures" } });
  if (existing) {
    console.log("Deleting existing rebel-cultures org...");
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
    data: { name: "Rebel Cultures", slug: "rebel-cultures", plan: "growth" },
  });

  // Create users
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Della Fetzer",
      email: "demo@rebel.vitros.app",
      passwordHash,
      role: "admin",
      pin: "0000",
      organizationId: org.id,
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      name: "Lab Technician",
      email: "tech1@rebel.vitros.app",
      passwordHash,
      role: "lead_tech",
      pin: "1111",
      organizationId: org.id,
    },
  });

  const users = [admin, tech1];
  console.log(`✓ Org "Rebel Cultures" with 2 users`);
  console.log(`  Login: demo@rebel.vitros.app / demo1234 (PIN: 0000)`);

  // Create site + locations
  const site = await prisma.site.create({
    data: { name: "Rebel Cultures Lab", address: "Holland, Michigan", organizationId: org.id },
  });

  const locationData = [
    { name: "Main Lab — Flow Hood A", type: "flow_hood", capacity: 200 },
    { name: "Main Lab — Prep Bench", type: "bench", capacity: 100 },
    { name: "Growth Chamber 1", type: "growth_chamber", capacity: 400 },
    { name: "Growth Chamber 2", type: "growth_chamber", capacity: 400 },
    { name: "Greenhouse — Acclimation", type: "greenhouse", capacity: 600 },
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
    { name: "MS Basal Medium", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
    { name: "Dahlia Multiplication (MS + 1mg/L BAP + 0.1mg/L NAA)", baseMedia: "MS", targetPH: 5.8, agar: 7.5, sucrose: 30.0, stage: "multiplication" },
    { name: "Dahlia Rooting (½MS + 0.5mg/L IBA)", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 20.0, stage: "rooting" },
    { name: "Strawberry Multiplication (MS + 1mg/L BA + 0.5mg/L GA3)", baseMedia: "MS", targetPH: 5.7, agar: 7.5, sucrose: 30.0, stage: "multiplication" },
    { name: "Strawberry Rooting (½MS + 1mg/L IBA)", baseMedia: "MS", targetPH: 5.7, agar: 7.0, sucrose: 20.0, stage: "rooting" },
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

  // Create cultivars — Dahlias + Strawberries
  const cultivarData = [
    // Dahlias
    { name: "Cafe au Lait", code: "DAH-CAL", species: "Dahlia × pinnata", strain: "Dinner plate, peach/cream",
      stageConfig: JSON.stringify({ initiation: { weeks: 4, survivalRate: 0.75 }, multiplication: { weeks: 6, multiplicationRate: 3, survivalRate: 0.85 }, rooting: { weeks: 4, survivalRate: 0.90 }, acclimation: { weeks: 3, survivalRate: 0.85 } }) },
    { name: "Bishop of Llandaff", code: "DAH-BOL", species: "Dahlia × pinnata", strain: "Dark foliage, red flowers",
      stageConfig: JSON.stringify({ initiation: { weeks: 4, survivalRate: 0.70 }, multiplication: { weeks: 6, multiplicationRate: 3, survivalRate: 0.80 }, rooting: { weeks: 4, survivalRate: 0.88 }, acclimation: { weeks: 3, survivalRate: 0.82 } }) },
    { name: "Thomas Edison", code: "DAH-TED", species: "Dahlia × pinnata", strain: "Deep purple, large blooms",
      stageConfig: JSON.stringify({ initiation: { weeks: 5, survivalRate: 0.65 }, multiplication: { weeks: 7, multiplicationRate: 2, survivalRate: 0.78 }, rooting: { weeks: 5, survivalRate: 0.85 }, acclimation: { weeks: 3, survivalRate: 0.80 } }) },
    { name: "Kelvin Floodlight", code: "DAH-KFL", species: "Dahlia × pinnata", strain: "Bright yellow, dinner plate",
      stageConfig: JSON.stringify({ initiation: { weeks: 4, survivalRate: 0.72 }, multiplication: { weeks: 6, multiplicationRate: 3, survivalRate: 0.82 }, rooting: { weeks: 4, survivalRate: 0.88 }, acclimation: { weeks: 3, survivalRate: 0.84 } }) },
    { name: "Mystic Illusion", code: "DAH-MYI", species: "Dahlia × pinnata", strain: "Dark foliage, yellow flowers",
      stageConfig: JSON.stringify({ initiation: { weeks: 4, survivalRate: 0.70 }, multiplication: { weeks: 6, multiplicationRate: 4, survivalRate: 0.85 }, rooting: { weeks: 4, survivalRate: 0.90 }, acclimation: { weeks: 3, survivalRate: 0.85 } }) },
    { name: "Arabian Night", code: "DAH-ARN", species: "Dahlia × pinnata", strain: "Dark red/maroon, compact",
      stageConfig: JSON.stringify({ initiation: { weeks: 4, survivalRate: 0.68 }, multiplication: { weeks: 6, multiplicationRate: 3, survivalRate: 0.80 }, rooting: { weeks: 4, survivalRate: 0.87 }, acclimation: { weeks: 3, survivalRate: 0.82 } }) },
    // Strawberries
    { name: "Albion", code: "STR-ALB", species: "Fragaria × ananassa", strain: "Everbearing, day-neutral, California bred",
      stageConfig: JSON.stringify({ initiation: { weeks: 3, survivalRate: 0.80 }, multiplication: { weeks: 5, multiplicationRate: 5, survivalRate: 0.90 }, rooting: { weeks: 3, survivalRate: 0.92 }, acclimation: { weeks: 2, survivalRate: 0.88 } }) },
    { name: "Seascape", code: "STR-SSC", species: "Fragaria × ananassa", strain: "Day-neutral, high yield",
      stageConfig: JSON.stringify({ initiation: { weeks: 3, survivalRate: 0.82 }, multiplication: { weeks: 5, multiplicationRate: 5, survivalRate: 0.88 }, rooting: { weeks: 3, survivalRate: 0.90 }, acclimation: { weeks: 2, survivalRate: 0.87 } }) },
    { name: "Jewel", code: "STR-JWL", species: "Fragaria × ananassa", strain: "June-bearing, disease resistant",
      stageConfig: JSON.stringify({ initiation: { weeks: 3, survivalRate: 0.78 }, multiplication: { weeks: 5, multiplicationRate: 4, survivalRate: 0.85 }, rooting: { weeks: 3, survivalRate: 0.90 }, acclimation: { weeks: 2, survivalRate: 0.86 } }) },
    { name: "Chandler", code: "STR-CHL", species: "Fragaria × ananassa", strain: "June-bearing, large fruit, Southeast favorite",
      stageConfig: JSON.stringify({ initiation: { weeks: 3, survivalRate: 0.76 }, multiplication: { weeks: 5, multiplicationRate: 4, survivalRate: 0.86 }, rooting: { weeks: 3, survivalRate: 0.88 }, acclimation: { weeks: 2, survivalRate: 0.85 } }) },
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
        stageConfig: c.stageConfig ? JSON.parse(c.stageConfig) : undefined,
        targetMultiplicationRate: c.name.startsWith("Albion") || c.name.startsWith("Seascape") ? 5 : 3,
        organizationId: org.id,
      },
    });
    cultivarIds.push(created.id);
  }
  console.log(`✓ ${cultivarData.length} cultivars (6 dahlias + 4 strawberries)`);

  // ── Create Vessels (~220) ──
  // Conservation focus: heavier on initiation and multiplication, lighter on hardening
  const vesselCount = 220;
  let vesselNum = 0;

  const stageDistribution = [
    { stage: "initiation", count: 40, statusOptions: ["planted", "growing"] },
    { stage: "multiplication", count: 80, statusOptions: ["growing", "ready_to_multiply"] },
    { stage: "rooting", count: 45, statusOptions: ["growing"] },
    { stage: "acclimation", count: 30, statusOptions: ["growing"] },
    { stage: "hardening", count: 15, statusOptions: ["growing"] },
  ];

  for (const dist of stageDistribution) {
    for (let i = 0; i < dist.count; i++) {
      vesselNum++;
      const barcode = `RBC-${String(vesselNum).padStart(4, "0")}`;
      const cultivarId = pick(cultivarIds);
      const locationId = pick(locationIds);
      const recipeId = pick(recipeIds);
      const health = pick(HEALTH);
      const status = pick(dist.statusOptions as string[]);
      const generation = dist.stage === "initiation" ? 0 : randomInt(1, 4);
      const subcultureNumber = dist.stage === "initiation" ? 0 : randomInt(1, generation + 2);
      const plantedAt = randomDate(75);
      const lastSub = new Date(plantedAt.getTime() + randomInt(7, 21) * 86400000);
      const nextSub = new Date(lastSub.getTime() + 14 * 86400000);

      const isContaminated = Math.random() < 0.03;
      const contaminationType = isContaminated ? pick(["bacterial", "fungal"] as const) : null;
      const contaminationDate = isContaminated ? randomDate(30) : null;
      const finalHealth = isContaminated ? "critical" : health;

      const vessel = await prisma.vessel.create({
        data: {
          barcode,
          cultivarId,
          mediaRecipeId: recipeId,
          locationId,
          explantCount: randomInt(1, 8),
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
          const advDate = new Date(plantedAt.getTime() + s * randomInt(10, 18) * 86400000);
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
  for (let i = 0; i < 10; i++) {
    vesselNum++;
    const barcode = `RBC-${String(vesselNum).padStart(4, "0")}`;
    const plantedAt = randomDate(90);
    const vessel = await prisma.vessel.create({
      data: {
        barcode,
        cultivarId: pick(cultivarIds),
        locationId: pick(locationIds),
        explantCount: randomInt(1, 4),
        healthStatus: "dead",
        status: "disposed",
        stage: pick(["initiation", "multiplication"] as const),
        disposalReason: pick(["contaminated", "dead"] as const),
        contaminationType: Math.random() < 0.5 ? "fungal" : "bacterial",
        contaminationDate: randomDate(60),
        plantedAt,
        organizationId: org.id,
      },
    });
    await prisma.activity.create({
      data: { vesselId: vessel.id, userId: pick(users).id, type: "disposed", category: "vessel", notes: "Disposed", createdAt: randomDate(30) },
    });
  }
  console.log(`✓ ${vesselNum} vessels with activity history`);

  // ── Clone Lines ──
  const cafeAuLaitId = cultivarIds[0];
  const albionId = cultivarIds[6];

  const cloneLineData = [
    { name: "Cafe au Lait — Line A", code: "CAL-A", lineNumber: 1, cultivarId: cafeAuLaitId, status: "active", notes: "Primary production line from meristem tip. Strong vigor." },
    { name: "Cafe au Lait — Line B", code: "CAL-B", lineNumber: 2, cultivarId: cafeAuLaitId, status: "active", notes: "Secondary line. Slightly different flower coloring." },
    { name: "Cafe au Lait — Line C", code: "CAL-C", lineNumber: 3, cultivarId: cafeAuLaitId, status: "quarantined", notes: "Dahlia mosaic virus detected. Quarantined." },
    { name: "Albion — Line 1", code: "ALB-1", lineNumber: 1, cultivarId: albionId, status: "active", notes: "Clean stock from meristem tip. Virus indexed." },
    { name: "Albion — Line 2", code: "ALB-2", lineNumber: 2, cultivarId: albionId, status: "active", notes: "Backup line. Good multiplication rate." },
  ];

  const cloneLineIds: string[] = [];
  for (const cl of cloneLineData) {
    const created = await prisma.cloneLine.create({
      data: {
        name: cl.name,
        code: cl.code,
        lineNumber: cl.lineNumber,
        cultivarId: cl.cultivarId,
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

  // ── Pathogen Tests ──
  // Cafe au Lait Line A: 2 clean
  await prisma.pathogenTest.create({
    data: { cloneLineId: cloneLineIds[0], testDate: new Date(Date.now() - 60 * 86400000), result: "clean", labName: "Michigan Plant Diagnostics", assayType: "ELISA", testingId: "MPD-2026-014", organizationId: org.id, loggedById: admin.id },
  });
  await prisma.pathogenTest.create({
    data: { cloneLineId: cloneLineIds[0], testDate: new Date(Date.now() - 14 * 86400000), result: "clean", labName: "Michigan Plant Diagnostics", assayType: "ELISA", testingId: "MPD-2026-088", organizationId: org.id, loggedById: admin.id },
  });
  await prisma.cloneLine.update({ where: { id: cloneLineIds[0] }, data: { lastTestedAt: new Date(Date.now() - 14 * 86400000), lastTestResult: "clean" } });

  // Cafe au Lait Line C: clean then dirty (Dahlia Mosaic Virus)
  await prisma.pathogenTest.create({
    data: { cloneLineId: cloneLineIds[2], testDate: new Date(Date.now() - 45 * 86400000), result: "clean", labName: "Michigan Plant Diagnostics", assayType: "ELISA", testingId: "MPD-2026-042", organizationId: org.id, loggedById: tech1.id },
  });
  await prisma.pathogenTest.create({
    data: { cloneLineId: cloneLineIds[2], testDate: new Date(Date.now() - 10 * 86400000), result: "dirty", pathogen: "Dahlia Mosaic Virus (DMV)", labName: "Michigan Plant Diagnostics", assayType: "RT-PCR", testingId: "MPD-2026-101", notes: "DMV detected. Line quarantined. All vessels from this line flagged for disposal.", organizationId: org.id, loggedById: admin.id },
  });
  await prisma.cloneLine.update({ where: { id: cloneLineIds[2] }, data: { lastTestedAt: new Date(Date.now() - 10 * 86400000), lastTestResult: "dirty" } });

  // Albion Line 1: clean (virus indexed)
  await prisma.pathogenTest.create({
    data: { cloneLineId: cloneLineIds[3], testDate: new Date(Date.now() - 30 * 86400000), result: "clean", pathogen: "Strawberry Mottle Virus (SMoV)", labName: "USDA NCPN Lab", assayType: "RT-PCR", testingId: "NCPN-2026-STR-007", notes: "Virus indexed clean for SMoV, SVBV, SCV.", organizationId: org.id, loggedById: admin.id },
  });
  await prisma.cloneLine.update({ where: { id: cloneLineIds[3] }, data: { lastTestedAt: new Date(Date.now() - 30 * 86400000), lastTestResult: "clean" } });

  console.log(`✓ Pathogen tests (clean, DMV dirty, virus indexed)`);

  console.log("\n═══════════════════════════════════════════════");
  console.log("✅ Rebel Cultures demo ready!");
  console.log("  Login: demo@rebel.vitros.app / demo1234 (PIN: 0000)");
  console.log("  6 Dahlia varieties + 4 Strawberry varieties");
  console.log("  ~220 vessels, 5 clone lines, pathogen history");
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
