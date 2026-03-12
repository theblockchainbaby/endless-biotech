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
 * Generate demand projections from sales orders + current pipeline state
 */
export function generateDemandProjections(
  orders: DemandOrder[],
  pipelineByCultivar: Record<string, number>, // cultivarId -> active vessel count
  stages: StageYield[] = DEFAULT_STAGES
): DemandSummary {
  const now = new Date();
  const totalPipelineWeeks = getTotalPipelineWeeks(stages);

  const projections: DemandProjection[] = orders.map((order) => {
    const dueDate = new Date(order.dueDate);
    const weeksUntilDue = Math.max(0, Math.round((dueDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    const requiredByStage = calculateBackwardRequirements(order.quantity, stages);
    const currentInPipeline = pipelineByCultivar[order.cultivarId] || 0;

    // The gap is: vessels needed at initiation minus what's already in pipeline
    const initiationNeeded = requiredByStage["initiation"] || 0;
    const gap = Math.max(0, initiationNeeded - currentInPipeline);

    // Calculate initiation deadline
    const initiationDeadline = new Date(dueDate);
    initiationDeadline.setDate(initiationDeadline.getDate() - totalPipelineWeeks * 7);

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
