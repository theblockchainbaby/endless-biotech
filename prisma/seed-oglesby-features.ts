import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding clone lines + sales orders for Oglesby demo...\n");

  // Find Oglesby org
  const org = await prisma.organization.findUnique({ where: { slug: "oglesby" } });
  if (!org) {
    console.error("Oglesby org not found. Run seed-labs.ts first.");
    process.exit(1);
  }

  // Get cultivars
  const cultivars = await prisma.cultivar.findMany({
    where: { organizationId: org.id },
  });
  console.log(`Found ${cultivars.length} cultivars`);

  // Clean up existing clone lines and sales orders
  await prisma.vessel.updateMany({
    where: { organizationId: org.id },
    data: { cloneLineId: null },
  });
  await prisma.cloneLine.deleteMany({ where: { organizationId: org.id } });
  await prisma.salesOrder.deleteMany({ where: { organizationId: org.id } });
  await prisma.apiKey.deleteMany({ where: { organizationId: org.id } });
  await prisma.webhookEndpoint.deleteMany({ where: { organizationId: org.id } });

  // ── Clone Lines ──
  const cloneLineData = [
    { cultivarCode: "SPA-SEN", lines: [
      { name: "Sensation Mother A", code: "SEN-MA", sourceType: "mother_plant" },
      { name: "Sensation Mother B", code: "SEN-MB", sourceType: "mother_plant" },
      { name: "Sensation Meristem 2024", code: "SEN-M24", sourceType: "meristem" },
    ]},
    { cultivarCode: "SPA-SWP", lines: [
      { name: "Sweet Pablo Mother 1", code: "SWP-M1", sourceType: "mother_plant" },
      { name: "Sweet Pablo Mother 2", code: "SWP-M2", sourceType: "mother_plant" },
    ]},
    { cultivarCode: "MAN-FLR", lines: [
      { name: "Flaming Red Clone A", code: "FLR-CA", sourceType: "mother_plant" },
      { name: "Flaming Red Clone B", code: "FLR-CB", sourceType: "mother_plant" },
    ]},
    { cultivarCode: "ANT-TKP", lines: [
      { name: "Tickled Pink Mother Stock", code: "TKP-MS", sourceType: "mother_plant" },
    ]},
    { cultivarCode: "ANT-PIZ", lines: [
      { name: "Pizzazz Line 1", code: "PIZ-L1", sourceType: "mother_plant" },
    ]},
    { cultivarCode: "SCH-AMA", lines: [
      { name: "Amate Primary Line", code: "AMA-PL", sourceType: "mother_plant" },
      { name: "Amate Secondary Line", code: "AMA-SL", sourceType: "meristem" },
    ]},
    { cultivarCode: "PHI-ROJ", lines: [
      { name: "Rojo Congo Mother Stock", code: "ROJ-MS", sourceType: "mother_plant" },
    ]},
    { cultivarCode: "SYN-GLO", lines: [
      { name: "Glo-Go Primary", code: "GLO-P1", sourceType: "mother_plant" },
    ]},
    { cultivarCode: "NEP-MAC", lines: [
      { name: "Macho Fern Line A", code: "MAC-LA", sourceType: "mother_plant" },
    ]},
    { cultivarCode: "CAL-FRE", lines: [
      { name: "Freddie Stock Plant", code: "FRE-SP", sourceType: "mother_plant" },
    ]},
  ];

  let cloneLineCount = 0;
  for (const group of cloneLineData) {
    const cultivar = cultivars.find(c => c.code === group.cultivarCode);
    if (!cultivar) continue;

    for (const line of group.lines) {
      const cl = await prisma.cloneLine.create({
        data: {
          name: line.name,
          code: line.code,
          cultivarId: cultivar.id,
          sourceType: line.sourceType,
          status: "active",
          organizationId: org.id,
        },
      });

      // Assign some existing vessels to this clone line
      const vessels = await prisma.vessel.findMany({
        where: {
          cultivarId: cultivar.id,
          organizationId: org.id,
          cloneLineId: null,
          status: { not: "disposed" },
        },
        take: Math.floor(Math.random() * 30) + 10,
      });

      if (vessels.length > 0) {
        await prisma.vessel.updateMany({
          where: { id: { in: vessels.map(v => v.id) } },
          data: { cloneLineId: cl.id },
        });
      }

      cloneLineCount++;
    }
  }
  console.log(`✓ ${cloneLineCount} clone lines created and vessels assigned`);

  // ── Sales Orders ──
  const now = new Date();
  const orders = [
    { orderNumber: "OGL-2026-001", customerName: "Costa Farms", cultivarCode: "SPA-SEN", quantity: 15000, unitType: "plugs", dueWeeks: 16, priority: "high" },
    { orderNumber: "OGL-2026-002", customerName: "Costa Farms", cultivarCode: "SPA-SWP", quantity: 8000, unitType: "plugs", dueWeeks: 18, priority: "high" },
    { orderNumber: "OGL-2026-003", customerName: "Lowe's Regional", cultivarCode: "MAN-FLR", quantity: 5000, unitType: "liners", dueWeeks: 20, priority: "normal" },
    { orderNumber: "OGL-2026-004", customerName: "Lowe's Regional", cultivarCode: "MAN-BRC", quantity: 3000, unitType: "liners", dueWeeks: 22, priority: "normal" },
    { orderNumber: "OGL-2026-005", customerName: "Home Depot South", cultivarCode: "ANT-TKP", quantity: 10000, unitType: "plugs", dueWeeks: 24, priority: "normal" },
    { orderNumber: "OGL-2026-006", customerName: "Home Depot South", cultivarCode: "ANT-PIZ", quantity: 6000, unitType: "plugs", dueWeeks: 24, priority: "normal" },
    { orderNumber: "OGL-2026-007", customerName: "Altman Plants", cultivarCode: "SCH-AMA", quantity: 12000, unitType: "plugs", dueWeeks: 30, priority: "normal" },
    { orderNumber: "OGL-2026-008", customerName: "Altman Plants", cultivarCode: "PHI-ROJ", quantity: 4000, unitType: "liners", dueWeeks: 28, priority: "low" },
    { orderNumber: "OGL-2026-009", customerName: "Proven Winners", cultivarCode: "SYN-GLO", quantity: 7000, unitType: "plugs", dueWeeks: 26, priority: "normal" },
    { orderNumber: "OGL-2026-010", customerName: "Ball Horticultural", cultivarCode: "NEP-MAC", quantity: 3500, unitType: "liners", dueWeeks: 14, priority: "urgent" },
    { orderNumber: "OGL-2026-011", customerName: "Monrovia Nursery", cultivarCode: "CAL-FRE", quantity: 2000, unitType: "plugs", dueWeeks: 32, priority: "low" },
    { orderNumber: "OGL-2026-012", customerName: "Costa Farms", cultivarCode: "SPA-EMS", quantity: 5000, unitType: "plugs", dueWeeks: 36, priority: "normal" },
  ];

  for (const order of orders) {
    const cultivar = cultivars.find(c => c.code === order.cultivarCode);
    if (!cultivar) continue;

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + order.dueWeeks * 7);

    await prisma.salesOrder.create({
      data: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        cultivarId: cultivar.id,
        quantity: order.quantity,
        unitType: order.unitType,
        dueDate,
        status: order.dueWeeks <= 16 ? "in_production" : "pending",
        priority: order.priority,
        organizationId: org.id,
      },
    });
  }
  console.log(`✓ ${orders.length} sales orders created`);

  // Verify counts
  const clCount = await prisma.cloneLine.count({ where: { organizationId: org.id } });
  const soCount = await prisma.salesOrder.count({ where: { organizationId: org.id } });
  const assignedVessels = await prisma.vessel.count({ where: { organizationId: org.id, cloneLineId: { not: null } } });

  console.log(`\n═══════════════════════════════════════`);
  console.log(`Oglesby Demo — New Features Seeded`);
  console.log(`  Clone Lines: ${clCount}`);
  console.log(`  Vessels Assigned to Lines: ${assignedVessels}`);
  console.log(`  Sales Orders: ${soCount}`);
  console.log(`  Login: demo@oglesby.vitros.app / demo1234`);
  console.log(`═══════════════════════════════════════\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
