// Seed script for Conception Nurseries demo account
// Usage: npx tsx prisma/seed-conception.ts

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
  console.log("  VitrOS — Seeding Conception Nurseries demo");
  console.log("═══════════════════════════════════════════════\n");

  const existing = await prisma.organization.findUnique({ where: { slug: "conception" } });
  if (existing) {
    console.log("Deleting existing conception org...");
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
    data: { name: "Conception Nurseries", slug: "conception", plan: "enterprise" },
  });
  console.log("✓ Organization created");

  // Create users
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Jesse Davis",
      email: "demo@conception.vitros.app",
      passwordHash,
      role: "admin",
      pin: "0000",
      organizationId: org.id,
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      name: "Maria Santos",
      email: "tech1@conception.vitros.app",
      passwordHash,
      role: "lead_tech",
      pin: "1111",
      organizationId: org.id,
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      name: "Alex Kim",
      email: "tech2@conception.vitros.app",
      passwordHash,
      role: "tech",
      pin: "2222",
      organizationId: org.id,
    },
  });

  const tech3 = await prisma.user.create({
    data: {
      name: "Jordan Rivera",
      email: "tech3@conception.vitros.app",
      passwordHash,
      role: "tech",
      pin: "3333",
      organizationId: org.id,
    },
  });

  const techs = [admin, tech1, tech2, tech3];
  console.log("✓ 4 users created");

  // Create sites and locations
  const site = await prisma.site.create({
    data: { name: "Sacramento HQ", address: "3835 N. Freeway Blvd, Sacramento, CA 95834", organizationId: org.id },
  });

  const locationNames = [
    "TC Lab A - Initiation",
    "TC Lab B - Multiplication",
    "TC Lab C - Multiplication",
    "Rooting Chamber 1",
    "Rooting Chamber 2",
    "Acclimation Greenhouse",
    "Cold Storage",
    "Media Prep Room",
  ];
  const locations = [];
  for (const name of locationNames) {
    const loc = await prisma.location.create({
      data: { name, siteId: site.id, type: "room" },
    });
    locations.push(loc);
  }
  console.log("✓ 1 site, 8 locations created");

  // Cannabis cultivars - Conception's TrueClones varieties
  const cultivarData = [
    { name: "Gelato 41", species: "Cannabis sativa", code: "GEL41", notes: "TrueClones flagship. High demand from dispensaries." },
    { name: "Cookies", species: "Cannabis sativa", code: "COOK", notes: "Exclusive production for Cookies brand partnership." },
    { name: "Wedding Cake", species: "Cannabis sativa", code: "WCAKE", notes: "Premium hybrid. Strong pathogen resistance." },
    { name: "Zkittlez", species: "Cannabis sativa", code: "ZKIT", notes: "Award-winning genetics. High terpene profile." },
    { name: "Gary Payton", species: "Cannabis sativa", code: "GPAY", notes: "Cookies collab. Limited availability." },
    { name: "Runtz", species: "Cannabis sativa", code: "RUNZ", notes: "Cross between Zkittlez and Gelato. Top seller." },
    { name: "Ice Cream Cake", species: "Cannabis sativa", code: "ICC", notes: "Indica-dominant. Cold storage validated." },
    { name: "Biscotti", species: "Cannabis sativa", code: "BISC", notes: "Cookies family genetics. Exclusive production." },
    { name: "Permanent Marker", species: "Cannabis sativa", code: "PMARK", notes: "New release. Generation Zero certified." },
    { name: "Cereal Milk", species: "Cannabis sativa", code: "CMILK", notes: "Cookies collab. High demand Q2 2026." },
  ];

  const cultivars = [];
  for (const c of cultivarData) {
    const cultivar = await prisma.cultivar.create({
      data: { ...c, organizationId: org.id },
    });
    cultivars.push(cultivar);
  }
  console.log("✓ 10 cultivars created");

  // Media recipes
  const recipes = [
    { name: "CN-Init", baseMedia: "MS", notes: "Conception initiation media with BAP 2.0mg/L", organizationId: org.id },
    { name: "CN-Multi", baseMedia: "MS", notes: "Multiplication media with BAP 1.5mg/L + IAA 0.1mg/L", organizationId: org.id },
    { name: "CN-Root", baseMedia: "1/2 MS", notes: "Rooting media with IBA 1.0mg/L", organizationId: org.id },
  ];
  const mediaRecipes = [];
  for (const r of recipes) {
    const recipe = await prisma.mediaRecipe.create({ data: r });
    mediaRecipes.push(recipe);
  }

  // Media batches
  const mediaBatches = [];
  for (let i = 0; i < 8; i++) {
    const batch = await prisma.mediaBatch.create({
      data: {
        batchNumber: `CN-${2026}-${String(i + 1).padStart(3, "0")}`,
        recipeId: pick(mediaRecipes).id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
        volumeL: randomInt(5, 20),
        vesselCount: randomInt(50, 200),
        preparedById: pick(techs).id,
      },
    });
    mediaBatches.push(batch);
  }
  console.log("✓ 3 media recipes, 8 batches created");

  // Clone lines - Generation Zero tracking
  const cloneLineData = [
    { name: "Gelato 41 - Mother A", cultivarId: cultivars[0].id, code: "GEL41-MA", lineNumber: 1, sourceType: "meristem", status: "active" as const },
    { name: "Gelato 41 - Mother B", cultivarId: cultivars[0].id, code: "GEL41-MB", lineNumber: 2, sourceType: "meristem", status: "active" as const },
    { name: "Cookies - Mother A", cultivarId: cultivars[1].id, code: "COOK-MA", lineNumber: 1, sourceType: "meristem", status: "active" as const },
    { name: "Wedding Cake - Mother A", cultivarId: cultivars[2].id, code: "WCAKE-MA", lineNumber: 1, sourceType: "meristem", status: "active" as const },
    { name: "Zkittlez - Mother A", cultivarId: cultivars[3].id, code: "ZKIT-MA", lineNumber: 1, sourceType: "meristem", status: "active" as const },
    { name: "Zkittlez - Mother B", cultivarId: cultivars[3].id, code: "ZKIT-MB", lineNumber: 2, sourceType: "meristem", status: "quarantined" as const },
    { name: "Runtz - Mother A", cultivarId: cultivars[5].id, code: "RUNZ-MA", lineNumber: 1, sourceType: "meristem", status: "active" as const },
    { name: "Ice Cream Cake - Mother A", cultivarId: cultivars[6].id, code: "ICC-MA", lineNumber: 1, sourceType: "meristem", status: "active" as const },
  ];

  const cloneLines = [];
  for (const cl of cloneLineData) {
    const line = await prisma.cloneLine.create({
      data: {
        ...cl,
        organizationId: org.id,
        notes: cl.status === "quarantined" ? "HLVd detected 3/20. Quarantined pending retest." : "Generation Zero verified. Clean stock.",
      },
    });
    cloneLines.push(line);
  }
  console.log("✓ 8 clone lines created");

  // Pathogen tests - HLVd is the big one for cannabis
  const testData = [
    { cloneLineIdx: 0, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 14 },
    { cloneLineIdx: 0, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 45 },
    { cloneLineIdx: 1, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 14 },
    { cloneLineIdx: 2, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 7 },
    { cloneLineIdx: 2, result: "clean", pathogen: "Powdery Mildew", assayType: "Visual + PCR", daysAgo: 7 },
    { cloneLineIdx: 3, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 21 },
    { cloneLineIdx: 4, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 10 },
    { cloneLineIdx: 5, result: "dirty", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 5 },
    { cloneLineIdx: 5, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 35 },
    { cloneLineIdx: 6, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 12 },
    { cloneLineIdx: 7, result: "clean", pathogen: "HLVd", assayType: "RT-qPCR", daysAgo: 18 },
    { cloneLineIdx: 7, result: "inconclusive", pathogen: "Fusarium", assayType: "Culture plate", daysAgo: 3 },
  ];

  for (const t of testData) {
    const testDate = randomDate(t.daysAgo);
    await prisma.pathogenTest.create({
      data: {
        cloneLineId: cloneLines[t.cloneLineIdx].id,
        organizationId: org.id,
        testDate,
        result: t.result,
        pathogen: t.pathogen,
        assayType: t.assayType,
        labName: "Tumi Genomics",
        loggedById: pick(techs).id,
        notes: t.result === "dirty" ? "HLVd positive. Line quarantined immediately. All downstream vessels flagged." : undefined,
      },
    });
  }

  // Update clone line denormalized fields
  for (let i = 0; i < cloneLines.length; i++) {
    const tests = testData.filter(t => t.cloneLineIdx === i);
    const latest = tests.sort((a, b) => a.daysAgo - b.daysAgo)[0];
    if (latest) {
      await prisma.cloneLine.update({
        where: { id: cloneLines[i].id },
        data: {
          lastTestedAt: randomDate(latest.daysAgo),
          lastTestResult: latest.result,
        },
      });
    }
  }
  console.log("✓ 12 pathogen tests created (HLVd, Powdery Mildew, Fusarium)");

  // Vessels - 500 vessels across stages
  const vessels = [];
  for (let i = 0; i < 500; i++) {
    const cultivar = pick(cultivars);
    const stage = pick(STAGES);
    const cloneLine = cloneLines.find(cl => cl.cultivarId === cultivar.id) || pick(cloneLines);
    const vessel = await prisma.vessel.create({
      data: {
        barcode: `CN-${String(i + 1).padStart(5, "0")}`,
        stage,
        healthStatus: pick(HEALTH),
        subcultureNumber: randomInt(0, stage === "initiation" ? 0 : stage === "multiplication" ? 5 : 2),
        plantedAt: randomDate(90),
        organizationId: org.id,
        cultivarId: cultivar.id,
        cloneLineId: cloneLine.id,
        locationId: pick(locations).id,
        mediaBatchId: pick(mediaBatches).id,
        notes: i % 20 === 0 ? "Flagged for quality review" : undefined,
      },
    });
    vessels.push(vessel);
  }
  console.log("✓ 500 vessels created");

  // Sales orders - real cannabis industry customers
  const orders = [
    {
      customerName: "Cookies",
      cultivarId: cultivars[1].id,
      quantity: 50000,
      dueDate: new Date("2026-05-15"),
      status: "confirmed",
      notes: "Exclusive production contract. Monthly delivery. Generation Zero certified.",
    },
    {
      customerName: "Shadowbox Farms",
      cultivarId: cultivars[0].id,
      quantity: 25000,
      dueDate: new Date("2026-04-30"),
      status: "confirmed",
      notes: "Q2 order. Gelato 41 TrueClones. HLVd cert required.",
    },
    {
      customerName: "Ball Family Farms",
      cultivarId: cultivars[5].id,
      quantity: 15000,
      dueDate: new Date("2026-06-01"),
      status: "pending",
      notes: "New customer. Runtz order. Needs pathogen test documentation.",
    },
    {
      customerName: "Excolo Farms",
      cultivarId: cultivars[2].id,
      quantity: 30000,
      dueDate: new Date("2026-05-01"),
      status: "confirmed",
      notes: "Wedding Cake bulk order. Repeat customer.",
    },
    {
      customerName: "Green Coast Collective",
      cultivarId: cultivars[3].id,
      quantity: 10000,
      dueDate: new Date("2026-04-15"),
      status: "in_production",
      notes: "Zkittlez order. 60% through multiplication stage.",
    },
  ];

  let orderNum = 1;
  for (const order of orders) {
    await prisma.salesOrder.create({
      data: { ...order, orderNumber: `CN-ORD-${String(orderNum++).padStart(3, "0")}`, organizationId: org.id },
    });
  }
  console.log("✓ 5 sales orders created (Cookies, Shadowbox, Ball Family, Excolo, Green Coast)");

  // Activity log
  for (let i = 0; i < 50; i++) {
    const vessel = pick(vessels);
    const types = ["subculture", "transfer", "health_check", "contamination_flag", "stage_advance"] as const;
    await prisma.activity.create({
      data: {
        vesselId: vessel.id,
        type: pick(types),
        category: "vessel",
        userId: pick(techs).id,
        createdAt: randomDate(30),
        metadata: {},
      },
    });
  }
  console.log("✓ 50 activity records created");

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Conception Nurseries demo seeded!");
  console.log("  Login: demo@conception.vitros.app");
  console.log("  Password: demo1234 | PIN: 0000");
  console.log("═══════════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
