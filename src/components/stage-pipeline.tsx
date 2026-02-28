"use client";

import { STAGES, STAGE_LABELS } from "@/lib/constants";

interface StagePipelineProps {
  currentStage: string;
  className?: string;
}

const stageColors: Record<string, string> = {
  initiation: "bg-blue-500",
  multiplication: "bg-green-500",
  rooting: "bg-amber-500",
  acclimation: "bg-purple-500",
  hardening: "bg-teal-500",
};

export function StagePipeline({ currentStage, className }: StagePipelineProps) {
  const currentIndex = STAGES.indexOf(currentStage as typeof STAGES[number]);

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;

          return (
            <div key={stage} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-center">
                {i > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                    isCurrent
                      ? `${stageColors[stage]} text-white ring-2 ring-offset-2 ring-primary`
                      : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs text-center ${
                  isCurrent ? "font-semibold text-foreground" : isFuture ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
