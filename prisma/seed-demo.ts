import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CULTIVARS = [
  { name: "Monstera deliciosa", code: "MON-DEL", species: "Monstera deliciosa", strain: "Swiss Cheese Plant" },
  { name: "Philodendron birkin", code: "PHI-BIR", species: "Philodendron", strain: "Birkin" },
  { name: "Hosta Blue Angel", code: "HOS-BLU", species: "Hosta", strain: "Blue Angel" },
  { name: "Hosta Sum & Substance", code: "HOS-SUM", species: "Hosta", strain: "Sum & Substance" },
  { name: "Nephrolepis Boston Fern", code: "NEP-BOS", species: "Nephrolepis exaltata", strain: "Bostoniensis" },
  { name: "Anthurium clarinervium", code: "ANT-CLA", species: "Anthurium", strain: "Clarinervium" },
  { name: "Alocasia Polly", code: "ALO-POL", species: "Alocasia amazonica", strain: "Polly" },
  { name: "Syngonium White Butterfly", code: "SYN-WHI", species: "Syngonium podophyllum", strain: "White Butterfly" },
  { name: "Calathea orbifolia", code: "CAL-ORB", species: "Goeppertia orbifolia", strain: "Orbifolia" },
  { name: "Heuchera Palace Purple", code: "HEU-PAL", species: "Heuchera micrantha", strain: "Palace Purple" },
  { name: "Drosera capensis", code: "DRO-CAP", species: "Drosera capensis", strain: "Cape Sundew" },
  { name: "Dionaea muscipula", code: "DIO-MUS", species: "Dionaea muscipula", strain: "Venus Flytrap" },
];

const LOCATIONS = [
  { name: "TC Lab A — Flow Hood 1", type: "flow_hood", capacity: 200 },
  { name: "TC Lab A — Flow Hood 2", type: "flow_hood", capacity: 200 },
  { name: "TC Lab B — Flow Hood 3", type: "flow_hood", capacity: 150 },
  { name: "Growth Chamber 1", type: "growth_chamber", capacity: 500 },
  { name: "Growth Chamber 2", type: "growth_chamber", capacity: 500 },
  { name: "Growth Chamber 3", type: "growth_chamber", capacity: 300 },
  { name: "Greenhouse Bay 1", type: "greenhouse", capacity: 1000 },
  { name: "Greenhouse Bay 2", type: "greenhouse", capacity: 1000 },
  { name: "Cold Storage", type: "cold_storage", capacity: 200 },
  { name: "Hardening Bench A", type: "bench", capacity: 400 },
  { name: "Hardening Bench B", type: "bench", capacity: 400 },
];

const MEDIA_RECIPES = [
  { name: "MS + 1mg/L BAP", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
  { name: "MS + 0.5mg/L NAA", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 30.0, stage: "rooting" },
  { name: "DKW Initiation", baseMedia: "DKW", targetPH: 5.6, agar: 8.0, sucrose: 25.0, stage: "initiation" },
  { name: "WPM Woody Plant", baseMedia: "WPM", targetPH: 5.5, agar: 7.5, sucrose: 20.0, stage: "multiplication" },
  { name: "B5 Tropical", baseMedia: "B5", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
];

const STAGES = ["initiation", "multiplication", "rooting", "acclimation", "hardening"] as const;
const HEALTH = ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "stable", "stable", "slow_growth", "critical"] as const;

function randomDate(daysBack: number): Date {
  const now = Date.now();
  return new Date(now - Math.random() * daysBack * 86400000);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🌱 Creating Demo Lab organization...");

  // Check if demo org already exists
  const existing = await prisma.organization.findUnique({ where: { slug: "demo-lab" } });
  if (existing) {
    console.log("Demo org already exists. Deleting and recreating...");
    // Delete in order of dependencies
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
    await prisma.session.deleteMany({ where: { user: { organizationId: existing.id } } });
    await prisma.account.deleteMany({ where: { user: { organizationId: existing.id } } });
    await prisma.user.deleteMany({ where: { organizationId: existing.id } });
    await prisma.organization.delete({ where: { id: existing.id } });
  }

  // Create org
  const org = await prisma.organization.create({
    data: { name: "Demo Lab", slug: "demo-lab", plan: "pro" },
  });

  // Create users
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Demo Admin",
      email: "demo@vitros.app",
      passwordHash,
      role: "admin",
      pin: "0000",
      organizationId: org.id,
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      name: "Sarah Chen",
      email: "sarah@demo.vitros.app",
      passwordHash,
      role: "lead_tech",
      pin: "1111",
      organizationId: org.id,
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      name: "Marcus Rivera",
      email: "marcus@demo.vitros.app",
      passwordHash,
      role: "tech",
      pin: "2222",
      organizationId: org.id,
    },
  });

  const users = [admin, tech1, tech2];
  console.log(`  ✓ Created org "${org.name}" with 3 users`);
  console.log(`    Login: demo@vitros.app / demo1234`);

  // Create site + locations
  const site = await prisma.site.create({
    data: { name: "Main Facility", address: "123 Innovation Dr, Apopka, FL 32712", organizationId: org.id },
  });

  const locationIds: string[] = [];
  for (const loc of LOCATIONS) {
    const created = await prisma.location.create({
      data: { name: loc.name, type: loc.type, capacity: loc.capacity, siteId: site.id },
    });
    locationIds.push(created.id);
  }
  console.log(`  ✓ Created ${LOCATIONS.length} locations`);

  // Create media recipes
  const recipeIds: string[] = [];
  for (const recipe of MEDIA_RECIPES) {
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
  console.log(`  ✓ Created ${MEDIA_RECIPES.length} media recipes`);

  // Create cultivars
  const cultivarIds: string[] = [];
  for (const c of CULTIVARS) {
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
  console.log(`  ✓ Created ${CULTIVARS.length} cultivars`);

  // Create vessels — 500 total across all stages
  console.log("  Creating vessels...");
  let vesselCount = 0;
  const barcodePrefix = "DEM";

  // Distribution: 30 initiation, 180 multiplication, 120 rooting, 100 acclimation, 70 hardening
  const stageDistribution = [
    { stage: "initiation", count: 30, statusOptions: ["planted", "growing"] },
    { stage: "multiplication", count: 180, statusOptions: ["growing", "ready_to_multiply"] },
    { stage: "rooting", count: 120, statusOptions: ["growing"] },
    { stage: "acclimation", count: 100, statusOptions: ["growing"] },
    { stage: "hardening", count: 70, statusOptions: ["growing"] },
  ];

  for (const dist of stageDistribution) {
    for (let i = 0; i < dist.count; i++) {
      vesselCount++;
      const barcode = `${barcodePrefix}-${String(vesselCount).padStart(5, "0")}`;
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

      // Small chance of contamination
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

      // Create activity history
      const userId = pick(users).id;
      await prisma.activity.create({
        data: {
          vesselId: vessel.id,
          userId,
          type: "created",
          category: "vessel",
          newState: { status: "planted", stage: "initiation" },
          notes: `Vessel ${barcode} initiated`,
          createdAt: plantedAt,
        },
      });

      // Stage advances
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

  // Add some disposed vessels for funnel data
  for (let i = 0; i < 50; i++) {
    vesselCount++;
    const barcode = `${barcodePrefix}-${String(vesselCount).padStart(5, "0")}`;
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
        notes: "Disposed - contaminated",
        createdAt: randomDate(30),
      },
    });
  }

  // Add multiplication events for analytics
  for (let i = 0; i < 40; i++) {
    vesselCount++;
    const barcode = `${barcodePrefix}-${String(vesselCount).padStart(5, "0")}`;
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
        notes: `Multiplied into new vessels`,
        createdAt: randomDate(30),
      },
    });
  }

  console.log(`  ✓ Created ${vesselCount} vessels with activity history`);

  // ==================== LINEAGE TREES ====================
  console.log("  Creating lineage trees...");

  const treeHealthStatuses = ["healthy", "healthy", "healthy", "healthy", "stable", "slow_growth", "critical"] as const;
  const treeStatuses = ["planted", "growing", "growing", "ready_to_multiply"] as const;

  // Tree 1: Monstera — 3 generations (root -> 5 children -> 3 grandchildren each = 21 vessels)
  const tree1Root = await prisma.vessel.create({
    data: {
      barcode: "TREE-MON-001",
      cultivarId: cultivarIds[0], // Monstera deliciosa
      mediaRecipeId: recipeIds[0],
      locationId: locationIds[0],
      explantCount: 8,
      healthStatus: "healthy",
      status: "multiplied",
      stage: "multiplication",
      generation: 0,
      subcultureNumber: 3,
      plantedAt: randomDate(120),
      lastSubcultureDate: randomDate(60),
      organizationId: org.id,
    },
  });

  for (let c = 0; c < 5; c++) {
    const childHealth = pick(treeHealthStatuses);
    const childStatus = c < 3 ? "multiplied" : pick(treeStatuses);
    const child = await prisma.vessel.create({
      data: {
        barcode: `TREE-MON-001-${String(c + 1).padStart(2, "0")}`,
        cultivarId: cultivarIds[0],
        mediaRecipeId: recipeIds[0],
        locationId: pick(locationIds),
        explantCount: randomInt(3, 10),
        healthStatus: childHealth,
        status: childStatus,
        stage: "multiplication",
        generation: 1,
        subcultureNumber: 4,
        parentVesselId: tree1Root.id,
        plantedAt: randomDate(90),
        lastSubcultureDate: randomDate(45),
        organizationId: org.id,
      },
    });

    if (childStatus === "multiplied" || c < 3) {
      for (let gc = 0; gc < 3; gc++) {
        const gcHealth = pick(treeHealthStatuses);
        const isContam = gcHealth === "critical";
        await prisma.vessel.create({
          data: {
            barcode: `TREE-MON-001-${String(c + 1).padStart(2, "0")}-${String(gc + 1).padStart(2, "0")}`,
            cultivarId: cultivarIds[0],
            mediaRecipeId: recipeIds[1],
            locationId: pick(locationIds),
            explantCount: randomInt(2, 8),
            healthStatus: gcHealth,
            status: pick(treeStatuses),
            stage: gcHealth === "critical" ? "multiplication" : pick(["multiplication", "rooting"] as const),
            generation: 2,
            subcultureNumber: 5,
            parentVesselId: child.id,
            contaminationType: isContam ? pick(["bacterial", "fungal"] as const) : null,
            contaminationDate: isContam ? randomDate(14) : null,
            plantedAt: randomDate(60),
            lastSubcultureDate: randomDate(30),
            organizationId: org.id,
          },
        });
      }
    }
  }

  // Tree 2: Philodendron — 4 generations (root -> 3 -> 2 -> 2 = ~19 vessels)
  const tree2Root = await prisma.vessel.create({
    data: {
      barcode: "TREE-PHI-001",
      cultivarId: cultivarIds[1], // Philodendron birkin
      mediaRecipeId: recipeIds[0],
      locationId: locationIds[1],
      explantCount: 6,
      healthStatus: "healthy",
      status: "multiplied",
      stage: "multiplication",
      generation: 0,
      subcultureNumber: 2,
      plantedAt: randomDate(150),
      lastSubcultureDate: randomDate(90),
      organizationId: org.id,
    },
  });

  for (let c = 0; c < 3; c++) {
    const child = await prisma.vessel.create({
      data: {
        barcode: `TREE-PHI-001-${String(c + 1).padStart(2, "0")}`,
        cultivarId: cultivarIds[1],
        mediaRecipeId: recipeIds[0],
        locationId: pick(locationIds),
        explantCount: randomInt(4, 8),
        healthStatus: pick(treeHealthStatuses),
        status: "multiplied",
        stage: "multiplication",
        generation: 1,
        subcultureNumber: 3,
        parentVesselId: tree2Root.id,
        plantedAt: randomDate(100),
        lastSubcultureDate: randomDate(60),
        organizationId: org.id,
      },
    });

    for (let gc = 0; gc < 2; gc++) {
      const grandchild = await prisma.vessel.create({
        data: {
          barcode: `TREE-PHI-001-${String(c + 1).padStart(2, "0")}-${String(gc + 1).padStart(2, "0")}`,
          cultivarId: cultivarIds[1],
          mediaRecipeId: recipeIds[1],
          locationId: pick(locationIds),
          explantCount: randomInt(3, 6),
          healthStatus: pick(treeHealthStatuses),
          status: "multiplied",
          stage: "rooting",
          generation: 2,
          subcultureNumber: 4,
          parentVesselId: child.id,
          plantedAt: randomDate(70),
          lastSubcultureDate: randomDate(40),
          organizationId: org.id,
        },
      });

      for (let ggc = 0; ggc < 2; ggc++) {
        const ggcHealth = pick(treeHealthStatuses);
        await prisma.vessel.create({
          data: {
            barcode: `TREE-PHI-001-${String(c + 1).padStart(2, "0")}-${String(gc + 1).padStart(2, "0")}-${String(ggc + 1).padStart(2, "0")}`,
            cultivarId: cultivarIds[1],
            mediaRecipeId: recipeIds[1],
            locationId: pick(locationIds),
            explantCount: randomInt(2, 5),
            healthStatus: ggcHealth,
            status: pick(treeStatuses),
            stage: "rooting",
            generation: 3,
            subcultureNumber: 5,
            parentVesselId: grandchild.id,
            contaminationType: ggcHealth === "critical" ? "fungal" : null,
            contaminationDate: ggcHealth === "critical" ? randomDate(7) : null,
            plantedAt: randomDate(40),
            lastSubcultureDate: randomDate(20),
            organizationId: org.id,
          },
        });
      }
    }
  }

  console.log("  ✓ Created 2 lineage trees (Monstera 3-gen, Philodendron 4-gen)");

  console.log("");
  console.log("✅ Demo Lab ready!");
  console.log("   Login: demo@vitros.app / demo1234");
  console.log("   PIN:   0000");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
