/**
 * Top-down demand forecasting: starts from sales orders (end demand)
 * and works backwards through TC stages to determine how many vessels
 * need to be initiated NOW to meet future delivery dates.
 */

export interface DemandOrder {
  id: string;
  customerName: string;
  cultivarName: string;
  cultivarId: string;
  quantity: number;
  unitType: string;
  dueDate: string;
  priority: string;
}

export interface StageYield {
  stage: string;
  durationWeeks: number;
  multiplicationRate: number; // how many outputs per input at this stage
  survivalRate: number; // % that survive (0.95 = 95%)
}

export interface DemandProjection {
  order: DemandOrder;
  weeksUntilDue: number;
  requiredByStage: Record<string, number>; // how many vessels needed at each stage
  currentInPipeline: number; // vessels already assigned to this cultivar
  gap: number; // shortfall (positive = need more)
  status: "on_track" | "at_risk" | "behind";
  initiationDeadline: string; // latest date to start new initiations
}

export interface DemandSummary {
  totalOrdered: number;
  totalInPipeline: number;
  totalGap: number;
  projections: DemandProjection[];
  weeklyInitiations: WeeklyInitiation[];
}

export interface WeeklyInitiation {
  week: number;
  date: string;
  cultivarId: string;
  cultivarName: string;
  vesselsToInitiate: number;
  forOrders: string[];
}

export interface ScheduleWeek {
  week: number;
  date: string;
  actions: ScheduleAction[];
  totalVessels: number;
}

export interface ScheduleAction {
  type: "initiate" | "subculture" | "transfer" | "ship";
  cultivarName: string;
  cultivarId: string;
  quantity: number;
  fromStage?: string;
  toStage?: string;
  orderNumber?: string;
  customerName?: string;
}

// Default stage pipeline for ornamental TC
const DEFAULT_STAGES: StageYield[] = [
  { stage: "initiation", durationWeeks: 4, multiplicationRate: 1, survivalRate: 0.85 },
  { stage: "multiplication", durationWeeks: 6, multiplicationRate: 3, survivalRate: 0.92 },
  { stage: "rooting", durationWeeks: 4, multiplicationRate: 1, survivalRate: 0.90 },
  { stage: "acclimation", durationWeeks: 4, multiplicationRate: 1, survivalRate: 0.88 },
  { stage: "hardening", durationWeeks: 3, multiplicationRate: 1, survivalRate: 0.95 },
];

export function getDefaultStages(): StageYield[] {
  return DEFAULT_STAGES.map((s) => ({ ...s }));
}

/**
 * Calculate how many vessels need to enter each stage to produce `targetOutput` finished plants.
 * Works backwards from the final stage.
 */
export function calculateBackwardRequirements(
  targetOutput: number,
  stages: StageYield[] = DEFAULT_STAGES
): Record<string, number> {
  const requirements: Record<string, number> = {};
  let needed = targetOutput;

  // Work backwards through stages
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i];
    // Account for losses at this stage
    needed = Math.ceil(needed / stage.survivalRate);
    // Account for multiplication (divide because multiplication increases output)
    needed = Math.ceil(needed / stage.multiplicationRate);
    requirements[stage.stage] = needed;
  }

  return requirements;
}

/**
 * Calculate total pipeline duration in weeks
 */
export function getTotalPipelineWeeks(stages: StageYield[] = DEFAULT_STAGES): number {
  return stages.reduce((sum, s) => sum + s.durationWeeks, 0);
}

/**
 * Generate demand projections from sales orders + current pipeline state.
 * Supports per-cultivar stage configs: pass a map of cultivarId -> StageYield[].
 */
export function generateDemandProjections(
  orders: DemandOrder[],
  pipelineByCultivar: Record<string, number>, // cultivarId -> active vessel count
  stages: StageYield[] = DEFAULT_STAGES,
  stagesByCultivar?: Record<string, StageYield[]>
): DemandSummary {
  const now = new Date();

  const projections: DemandProjection[] = orders.map((order) => {
    // Use per-cultivar stages if available, else fall back to default
    const orderStages = stagesByCultivar?.[order.cultivarId] || stages;
    const orderPipelineWeeks = getTotalPipelineWeeks(orderStages);

    const dueDate = new Date(order.dueDate);
    const weeksUntilDue = Math.max(0, Math.round((dueDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    const requiredByStage = calculateBackwardRequirements(order.quantity, orderStages);
    const currentInPipeline = pipelineByCultivar[order.cultivarId] || 0;

    // The gap is: vessels needed at initiation minus what's already in pipeline
    const initiationNeeded = requiredByStage["initiation"] || 0;
    const gap = Math.max(0, initiationNeeded - currentInPipeline);

    // Calculate initiation deadline
    const initiationDeadline = new Date(dueDate);
    initiationDeadline.setDate(initiationDeadline.getDate() - orderPipelineWeeks * 7);

    let status: "on_track" | "at_risk" | "behind" = "on_track";
    if (gap > 0 && now > initiationDeadline) {
      status = "behind";
    } else if (gap > 0) {
      status = "at_risk";
    }

    return {
      order,
      weeksUntilDue,
      requiredByStage,
      currentInPipeline,
      gap,
      status,
      initiationDeadline: initiationDeadline.toISOString().split("T")[0],
    };
  });

  // Group initiation needs by week
  const weeklyMap = new Map<string, WeeklyInitiation>();
  projections
    .filter((p) => p.gap > 0)
    .forEach((p) => {
      const weekStart = p.initiationDeadline;
      const key = `${weekStart}-${p.order.cultivarId}`;
      if (weeklyMap.has(key)) {
        const existing = weeklyMap.get(key)!;
        existing.vesselsToInitiate += p.gap;
        existing.forOrders.push(p.order.id);
      } else {
        const weeksFromNow = Math.round(
          (new Date(weekStart).getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        weeklyMap.set(key, {
          week: Math.max(0, weeksFromNow),
          date: weekStart,
          cultivarId: p.order.cultivarId,
          cultivarName: p.order.cultivarName,
          vesselsToInitiate: p.gap,
          forOrders: [p.order.id],
        });
      }
    });

  const weeklyInitiations = Array.from(weeklyMap.values()).sort((a, b) => a.week - b.week);

  return {
    totalOrdered: orders.reduce((sum, o) => sum + o.quantity, 0),
    totalInPipeline: Object.values(pipelineByCultivar).reduce((sum, c) => sum + c, 0),
    totalGap: projections.reduce((sum, p) => sum + p.gap, 0),
    projections: projections.sort((a, b) => a.weeksUntilDue - b.weeksUntilDue),
    weeklyInitiations,
  };
}

/**
 * Generate a 40+ week forward projection showing cumulative output over time.
 * This is the 10-month view Ben asked about.
 */
export function generateLongRangeProjection(
  initialVessels: number,
  stages: StageYield[] = DEFAULT_STAGES,
  weeksToProject: number = 44 // ~10 months
): { week: number; date: string; cumulativeOutput: number; byStage: Record<string, number> }[] {
  const points: { week: number; date: string; cumulativeOutput: number; byStage: Record<string, number> }[] = [];

  // Track vessels in each stage as a queue (FIFO by week entered)
  const stageQueues: { count: number; weeksRemaining: number }[][] = stages.map(() => []);

  // Start with all vessels in initiation
  stageQueues[0].push({ count: initialVessels, weeksRemaining: stages[0].durationWeeks });

  let cumulativeOutput = 0;

  for (let week = 0; week <= weeksToProject; week++) {
    const date = new Date();
    date.setDate(date.getDate() + week * 7);

    // Process each stage
    for (let s = stages.length - 1; s >= 0; s--) {
      const stage = stages[s];
      const queue = stageQueues[s];

      // Advance time for all batches in this stage
      for (const batch of queue) {
        batch.weeksRemaining--;
      }

      // Move completed batches to next stage (or output)
      while (queue.length > 0 && queue[0].weeksRemaining <= 0) {
        const completed = queue.shift()!;
        const surviving = Math.round(completed.count * stage.survivalRate);
        const multiplied = Math.round(surviving * stage.multiplicationRate);

        if (s === stages.length - 1) {
          // Final stage - these become output
          cumulativeOutput += multiplied;
        } else {
          // Move to next stage
          stageQueues[s + 1].push({
            count: multiplied,
            weeksRemaining: stages[s + 1].durationWeeks,
          });
        }
      }
    }

    const byStage: Record<string, number> = {};
    stages.forEach((stage, i) => {
      byStage[stage.stage] = stageQueues[i].reduce((sum, b) => sum + b.count, 0);
    });

    points.push({
      week,
      date: date.toISOString().split("T")[0],
      cumulativeOutput,
      byStage,
    });
  }

  return points;
}

/**
 * Generate a weekly production schedule from demand projections.
 * This replaces "Lab Planner" — shows week-by-week what to initiate,
 * subculture, transfer between stages, and ship.
 */
export function generateProductionSchedule(
  orders: DemandOrder[],
  pipelineByCultivar: Record<string, number>,
  stages: StageYield[] = DEFAULT_STAGES,
  weeksOut: number = 36,
  stagesByCultivar?: Record<string, StageYield[]>
): ScheduleWeek[] {
  const now = new Date();
  const schedule: ScheduleWeek[] = [];

  // Build per-order timeline: when to initiate, when each stage transition happens, when to ship
  interface OrderTimeline {
    order: DemandOrder;
    initiateWeek: number;
    stageTransitions: { week: number; fromStage: string; toStage: string; quantity: number }[];
    shipWeek: number;
    initiationQuantity: number;
    orderStages: StageYield[];
  }

  const timelines: OrderTimeline[] = [];

  for (const order of orders) {
    const orderStages = stagesByCultivar?.[order.cultivarId] || stages;
    const orderPipelineWeeks = getTotalPipelineWeeks(orderStages);

    const dueDate = new Date(order.dueDate);
    const shipWeek = Math.max(0, Math.round((dueDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    if (shipWeek > weeksOut) continue;

    const requirements = calculateBackwardRequirements(order.quantity, orderStages);
    const currentPipeline = pipelineByCultivar[order.cultivarId] || 0;
    const initiationNeeded = Math.max(0, (requirements["initiation"] || 0) - currentPipeline);

    if (initiationNeeded === 0 && currentPipeline >= order.quantity) continue;

    // Calculate when each stage transition happens (working forward from initiation)
    const initiateWeek = Math.max(0, shipWeek - orderPipelineWeeks);
    const transitions: { week: number; fromStage: string; toStage: string; quantity: number }[] = [];
    let currentWeek = initiateWeek;
    let currentQty = initiationNeeded > 0 ? initiationNeeded : requirements["initiation"] || 0;

    for (let i = 0; i < orderStages.length - 1; i++) {
      currentWeek += orderStages[i].durationWeeks;
      const surviving = Math.round(currentQty * orderStages[i].survivalRate * orderStages[i].multiplicationRate);
      transitions.push({
        week: currentWeek,
        fromStage: orderStages[i].stage,
        toStage: orderStages[i + 1].stage,
        quantity: surviving,
      });
      currentQty = surviving;
    }

    timelines.push({
      order,
      initiateWeek,
      stageTransitions: transitions,
      shipWeek,
      initiationQuantity: initiationNeeded > 0 ? initiationNeeded : 0,
      orderStages,
    });
  }

  // Build week-by-week schedule
  for (let week = 0; week <= weeksOut; week++) {
    const date = new Date(now);
    date.setDate(date.getDate() + week * 7);
    const actions: ScheduleAction[] = [];

    for (const tl of timelines) {
      // Initiation actions
      if (tl.initiateWeek === week && tl.initiationQuantity > 0) {
        actions.push({
          type: "initiate",
          cultivarName: tl.order.cultivarName,
          cultivarId: tl.order.cultivarId,
          quantity: tl.initiationQuantity,
          toStage: "initiation",
          orderNumber: tl.order.id,
          customerName: tl.order.customerName,
        });
      }

      // Stage transfer actions
      for (const tr of tl.stageTransitions) {
        if (tr.week === week) {
          actions.push({
            type: "transfer",
            cultivarName: tl.order.cultivarName,
            cultivarId: tl.order.cultivarId,
            quantity: tr.quantity,
            fromStage: tr.fromStage,
            toStage: tr.toStage,
          });
        }
      }

      // Subculture (multiplication) actions — during multiplication stage
      const os = tl.orderStages;
      const multStageIndex = os.findIndex((s) => s.stage === "multiplication");
      if (multStageIndex >= 0) {
        const multStart = tl.initiateWeek + os[0].durationWeeks;
        const multEnd = multStart + os[multStageIndex].durationWeeks;
        const subcultureInterval = 2; // every 2 weeks
        if (week > multStart && week < multEnd && (week - multStart) % subcultureInterval === 0) {
          const estQty = Math.round(tl.initiationQuantity * os[0].survivalRate);
          if (estQty > 0) {
            actions.push({
              type: "subculture",
              cultivarName: tl.order.cultivarName,
              cultivarId: tl.order.cultivarId,
              quantity: estQty,
              fromStage: "multiplication",
              toStage: "multiplication",
            });
          }
        }
      }

      // Ship actions
      if (tl.shipWeek === week) {
        actions.push({
          type: "ship",
          cultivarName: tl.order.cultivarName,
          cultivarId: tl.order.cultivarId,
          quantity: tl.order.quantity,
          orderNumber: tl.order.id,
          customerName: tl.order.customerName,
        });
      }
    }

    if (actions.length > 0) {
      schedule.push({
        week,
        date: date.toISOString().split("T")[0],
        actions,
        totalVessels: actions.reduce((sum, a) => sum + a.quantity, 0),
      });
    }
  }

  return schedule;
}

/**
 * Export demand data as CSV string
 */
export function exportDemandCSV(
  projections: DemandProjection[],
  schedule: ScheduleWeek[]
): string {
  const lines: string[] = [];

  // Section 1: Order Projections
  lines.push("=== ORDER PROJECTIONS ===");
  lines.push("Customer,Cultivar,Quantity,Unit Type,Due Date,Weeks Until Due,In Pipeline,Gap,Status,Initiation Deadline");
  for (const p of projections) {
    lines.push([
      p.order.customerName,
      p.order.cultivarName,
      p.order.quantity,
      p.order.unitType,
      p.order.dueDate,
      p.weeksUntilDue,
      p.currentInPipeline,
      p.gap,
      p.status,
      p.initiationDeadline,
    ].join(","));
  }

  lines.push("");

  // Section 2: Production Schedule
  lines.push("=== PRODUCTION SCHEDULE ===");
  lines.push("Week,Date,Action,Cultivar,Quantity,From Stage,To Stage,Customer");
  for (const week of schedule) {
    for (const action of week.actions) {
      lines.push([
        week.week,
        week.date,
        action.type,
        action.cultivarName,
        action.quantity,
        action.fromStage || "",
        action.toStage || "",
        action.customerName || "",
      ].join(","));
    }
  }

  return lines.join("\n");
}
