import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding incentive system for Oglesby demo...\n");

  const org = await prisma.organization.findUnique({ where: { slug: "oglesby" } });
  if (!org) {
    console.error("Oglesby org not found. Run seed-labs.ts first.");
    process.exit(1);
  }

  // Clean up existing incentive data
  await prisma.shiftNote.deleteMany({ where: { organizationId: org.id } });
  await prisma.techShift.deleteMany({ where: { organizationId: org.id } });
  await prisma.incentivePointRule.deleteMany({ where: { organizationId: org.id } });
  await prisma.incentiveConfig.deleteMany({ where: { organizationId: org.id } });
  await prisma.station.deleteMany({ where: { organizationId: org.id } });

  // ── Incentive Config ──
  await prisma.incentiveConfig.create({
    data: {
      organizationId: org.id,
      baseHourlyRate: 16.0,
      pointDollarValue: 0.025,
      contaminationThreshold: 5.0,
      contaminationLookbackDays: 14,
      bonusPeriod: "weekly",
      dailyVesselTarget: 250,
      enableIncentives: true,
    },
  });
  console.log("✓ Incentive config created");

  // ── Stations (Hoods) ──
  const stationData = [
    { name: "Hood 1", type: "laminar_flow_hood" },
    { name: "Hood 2", type: "laminar_flow_hood" },
    { name: "Hood 3", type: "laminar_flow_hood" },
    { name: "Hood 4", type: "laminar_flow_hood" },
    { name: "Hood 5", type: "laminar_flow_hood" },
    { name: "Hood 6", type: "laminar_flow_hood" },
    { name: "Clean Bench 1", type: "clean_bench" },
    { name: "Clean Bench 2", type: "clean_bench" },
    { name: "Prep Station A", type: "prep_station" },
    { name: "Prep Station B", type: "prep_station" },
  ];

  const stations: Record<string, string> = {};
  for (const s of stationData) {
    const station = await prisma.station.create({
      data: { ...s, organizationId: org.id },
    });
    stations[s.name] = station.id;
  }
  console.log(`✓ ${stationData.length} stations created`);

  // ── Point Rules ──
  const cultivars = await prisma.cultivar.findMany({
    where: { organizationId: org.id },
    select: { id: true, code: true, name: true },
  });

  // Generic rules by stage
  const genericRules = [
    { stage: "initiation", containerType: "tube", taskType: "initiation", basePoints: 8 },
    { stage: "initiation", containerType: "jar", taskType: "initiation", basePoints: 7 },
    { stage: "multiplication", containerType: "jar", taskType: "transfer", basePoints: 4 },
    { stage: "multiplication", containerType: "tube", taskType: "transfer", basePoints: 3 },
    { stage: "rooting", containerType: "jar", taskType: "transfer", basePoints: 3 },
    { stage: "acclimation", containerType: "jar", taskType: "transfer", basePoints: 2 },
    { stage: "hardening", containerType: "jar", taskType: "transfer", basePoints: 2 },
  ];

  for (const rule of genericRules) {
    await prisma.incentivePointRule.create({
      data: { ...rule, organizationId: org.id },
    });
  }

  // Cultivar overrides for difficult species (Anthurium gets more points)
  const antTkp = cultivars.find((c) => c.code === "ANT-TKP");
  const antPiz = cultivars.find((c) => c.code === "ANT-PIZ");

  for (const cult of [antTkp, antPiz]) {
    if (!cult) continue;
    await prisma.incentivePointRule.create({
      data: {
        stage: "multiplication",
        containerType: "jar",
        taskType: "transfer",
        basePoints: 5,
        cultivarId: cult.id,
        organizationId: org.id,
      },
    });
    await prisma.incentivePointRule.create({
      data: {
        stage: "initiation",
        containerType: "tube",
        taskType: "initiation",
        basePoints: 10,
        cultivarId: cult.id,
        organizationId: org.id,
      },
    });
  }

  const ruleCount = await prisma.incentivePointRule.count({ where: { organizationId: org.id } });
  console.log(`✓ ${ruleCount} point rules created (${genericRules.length} generic + Anthurium overrides)`);

  // ── Create Tech Users ──
  const bcrypt = await import("bcryptjs");
  const demoHash = await bcrypt.hash("demo1234", 10);

  const techData = [
    { name: "Maria Rodriguez", email: "maria@oglesby.vitros.app", role: "tech" },
    { name: "James Thompson", email: "james@oglesby.vitros.app", role: "tech" },
    { name: "Sara Kim", email: "sara@oglesby.vitros.app", role: "tech" },
    { name: "David Lopez", email: "david@oglesby.vitros.app", role: "tech" },
    { name: "Priya Patel", email: "priya@oglesby.vitros.app", role: "tech" },
    { name: "Tyler Jackson", email: "tyler@oglesby.vitros.app", role: "tech" },
    { name: "Lisa Chen", email: "lisa@oglesby.vitros.app", role: "supervisor" },
  ];

  const techUsers: { id: string; name: string }[] = [];
  for (const t of techData) {
    const existing = await prisma.user.findUnique({ where: { email: t.email } });
    if (existing) {
      techUsers.push({ id: existing.id, name: existing.name });
    } else {
      const user = await prisma.user.create({
        data: {
          ...t,
          passwordHash: demoHash,
          pin: "0000",
          organizationId: org.id,
        },
      });
      techUsers.push({ id: user.id, name: user.name });
    }
  }
  console.log(`✓ ${techUsers.length} tech users created/found`);

  // ── Generate Historical Shifts (last 14 days) ──
  const now = new Date();
  const stationNames = ["Hood 1", "Hood 2", "Hood 3", "Hood 4", "Hood 5", "Hood 6"];
  let shiftCount = 0;

  // Get vessels for creating realistic activities
  const vessels = await prisma.vessel.findMany({
    where: { organizationId: org.id, status: { not: "disposed" } },
    select: { id: true, stage: true, cultivarId: true },
    take: 500,
  });

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const day = new Date(now);
    day.setDate(day.getDate() - daysAgo);

    // Skip weekends
    if (day.getDay() === 0 || day.getDay() === 6) continue;

    for (const tech of techUsers) {
      // Some techs miss some days
      if (Math.random() < 0.1) continue;

      const stationName = stationNames[Math.floor(Math.random() * stationNames.length)];
      const clockIn = new Date(day);
      clockIn.setHours(7, 0, 0, 0);
      const isOvertime = Math.random() < 0.2;
      const hoursWorked = isOvertime ? 10 : 8;
      const clockOut = new Date(clockIn.getTime() + hoursWorked * 60 * 60 * 1000);

      // Productivity varies by tech -- Maria is top performer, David struggles
      let vesselMultiplier = 1.0;
      if (tech.name === "Maria Rodriguez") vesselMultiplier = 1.3;
      if (tech.name === "James Thompson") vesselMultiplier = 1.15;
      if (tech.name === "David Lopez") vesselMultiplier = 0.75;
      if (tech.name === "Priya Patel") vesselMultiplier = 0.6; // new hire

      const baseVessels = Math.floor((30 + Math.random() * 25) * vesselMultiplier * (hoursWorked / 8));

      // Create activities for this shift
      let activityCount = 0;
      const types = ["multiply", "advance", "subculture", "transfer"];
      for (let i = 0; i < baseVessels; i++) {
        const vessel = vessels[Math.floor(Math.random() * vessels.length)];
        if (!vessel) continue;

        const actTime = new Date(clockIn.getTime() + Math.random() * (clockOut.getTime() - clockIn.getTime()));
        await prisma.activity.create({
          data: {
            vesselId: vessel.id,
            userId: tech.id,
            type: types[Math.floor(Math.random() * types.length)],
            category: "vessel",
            createdAt: actTime,
          },
        });
        activityCount++;
      }

      // Contamination events -- David has higher rate, Hood 3 has higher rate
      let contamRate = 0.03;
      if (tech.name === "David Lopez") contamRate = 0.07;
      if (stationName === "Hood 3") contamRate += 0.03;
      const contamCount = Math.floor(baseVessels * contamRate);

      for (let c = 0; c < contamCount; c++) {
        const vessel = vessels[Math.floor(Math.random() * vessels.length)];
        if (!vessel) continue;
        const actTime = new Date(clockIn.getTime() + Math.random() * (clockOut.getTime() - clockIn.getTime()));
        await prisma.activity.create({
          data: {
            vesselId: vessel.id,
            userId: tech.id,
            type: "contamination",
            category: "vessel",
            notes: Math.random() > 0.5 ? "Bacterial" : "Fungal",
            createdAt: actTime,
          },
        });
      }

      // Calculate points
      let totalPoints = activityCount * 4; // simplified -- mostly multiplication transfers
      if (tech.name.includes("Patel")) totalPoints *= 0.8; // training period

      const effectiveRate = hoursWorked > 0 ? (totalPoints * 0.025) / hoursWorked : 0;
      const bonusAmount = Math.max(0, effectiveRate - 16) * hoursWorked;

      await prisma.techShift.create({
        data: {
          userId: tech.id,
          organizationId: org.id,
          stationId: stations[stationName],
          clockIn,
          clockOut,
          hoursWorked,
          isOvertime,
          vesselsProcessed: activityCount,
          contaminationCount: contamCount,
          totalPoints,
          effectiveRate: Math.round(effectiveRate * 100) / 100,
          bonusAmount: Math.round(bonusAmount * 100) / 100,
          status: "completed",
        },
      });
      shiftCount++;
    }
  }
  console.log(`✓ ${shiftCount} historical shifts with activities created`);

  // ── Shift Notes ──
  const noteData = [
    { author: "Lisa Chen", content: "Autoclave 2 is running slow again. Taking an extra 15 minutes per cycle. Maintenance ticket submitted.", priority: "important", daysAgo: 1 },
    { author: "Maria Rodriguez", content: "Anthurium batch from last week's media prep looks off. Shoots are pale. Keeping an eye on it.", priority: "normal", daysAgo: 2 },
    { author: "James Thompson", content: "Hood 3 filter indicator is yellow. Might need HEPA swap soon.", priority: "urgent", daysAgo: 0 },
    { author: "Sara Kim", content: "New Schefflera order came in. Added 200 jars to the multiplication queue for Friday.", priority: "normal", daysAgo: 3 },
    { author: "David Lopez", content: "Media batch MB-0412 had some precipitation before autoclaving. I re-made it but wanted to flag it.", priority: "important", daysAgo: 1 },
    { author: "Lisa Chen", content: "Reminder: Ben wants the Costa Farms order counts verified by end of week.", priority: "normal", daysAgo: 0 },
  ];

  for (const note of noteData) {
    const author = techUsers.find((t) => t.name === note.author);
    if (!author) continue;
    const noteDate = new Date(now);
    noteDate.setDate(noteDate.getDate() - note.daysAgo);

    await prisma.shiftNote.create({
      data: {
        authorId: author.id,
        organizationId: org.id,
        content: note.content,
        priority: note.priority,
        shiftDate: noteDate,
        createdAt: noteDate,
      },
    });
  }
  console.log(`✓ ${noteData.length} shift notes created`);

  // ── Summary ──
  const totalShifts = await prisma.techShift.count({ where: { organizationId: org.id } });
  const totalActivities = await prisma.activity.count({
    where: {
      vessel: { organizationId: org.id },
      type: { in: ["multiply", "advance", "subculture", "transfer", "contamination"] },
    },
  });

  console.log(`\n═══════════════════════════════════════`);
  console.log(`Oglesby Demo — Incentive System Seeded`);
  console.log(`  Incentive Config: Set`);
  console.log(`  Stations: ${Object.keys(stations).length}`);
  console.log(`  Point Rules: ${ruleCount}`);
  console.log(`  Tech Users: ${techUsers.length}`);
  console.log(`  Historical Shifts: ${totalShifts}`);
  console.log(`  Production Activities: ${totalActivities}`);
  console.log(`  Shift Notes: ${noteData.length}`);
  console.log(`  Login: demo@oglesby.vitros.app / demo1234`);
  console.log(`═══════════════════════════════════════\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
