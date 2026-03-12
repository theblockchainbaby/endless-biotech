export interface ForecastPoint {
  week: number;
  date: string;
  initiation: number;
  multiplication: number;
  rooting: number;
  acclimation: number;
  hardening: number;
  total: number;
}

export interface ForecastParams {
  currentByStage: Record<string, number>;
  multiplicationRate: number; // e.g., 3.0 = triples each subculture
  subcultureIntervalWeeks: number; // default 2
  lossRate: number; // e.g., 0.05 = 5% loss per cycle
  advanceRate: number; // e.g., 0.7 = 70% advance each cycle
  weeksToForecast: number; // 4-12
}

export function generateForecast(params: ForecastParams): ForecastPoint[] {
  const {
    currentByStage,
    multiplicationRate,
    subcultureIntervalWeeks,
    lossRate,
    advanceRate,
    weeksToForecast,
  } = params;

  const stages = ["initiation", "multiplication", "rooting", "acclimation", "hardening"];
  const points: ForecastPoint[] = [];

  // Current state
  const state = stages.map((s) => currentByStage[s] || 0);

  for (let week = 0; week <= weeksToForecast; week++) {
    const date = new Date();
    date.setDate(date.getDate() + week * 7);

    const point: ForecastPoint = {
      week,
      date: date.toISOString().split("T")[0],
      initiation: Math.round(state[0]),
      multiplication: Math.round(state[1]),
      rooting: Math.round(state[2]),
      acclimation: Math.round(state[3]),
      hardening: Math.round(state[4]),
      total: Math.round(state.reduce((a, b) => a + b, 0)),
    };
    points.push(point);

    if (week < weeksToForecast) {
      // Every subcultureIntervalWeeks, apply multiplication
      if (week > 0 && week % subcultureIntervalWeeks === 0) {
        // Multiplication stage multiplies
        const newFromMultiplication = state[1] * (multiplicationRate - 1);
        state[1] += newFromMultiplication;
      }

      // Apply stage advancement and loss
      const interval = Math.max(1, subcultureIntervalWeeks);
      const advances = stages.map((_, i) => state[i] * advanceRate * (1 / interval));
      const losses = stages.map((_, i) => state[i] * lossRate * (1 / interval));

      // Move vessels forward
      for (let i = stages.length - 1; i >= 0; i--) {
        state[i] -= advances[i] + losses[i];
        if (i < stages.length - 1) {
          state[i + 1] += advances[i];
        }
        state[i] = Math.max(0, state[i]);
      }
    }
  }

  return points;
}
