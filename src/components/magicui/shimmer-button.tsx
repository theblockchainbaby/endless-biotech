"use client";

import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export function ShimmerButton({
  shimmerColor = "rgba(255, 255, 255, 0.3)",
  shimmerSize = "0.1em",
  shimmerDuration = "2s",
  borderRadius = "100px",
  background = "linear-gradient(135deg, oklch(0.45 0.12 170), oklch(0.35 0.12 170))",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--shimmer-duration": shimmerDuration,
          "--border-radius": borderRadius,
          "--bg": background,
        } as React.CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-8 py-3 text-white font-medium",
        "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
        "[border-radius:var(--border-radius)]",
        "[background:var(--bg)]",
        className,
      )}
      {...props}
    >
      {/* Shimmer layer */}
      <div
        className="absolute inset-0 overflow-hidden [border-radius:var(--border-radius)]"
      >
        <div className="absolute inset-[-100%] animate-[shimmer_var(--shimmer-duration)_linear_infinite] bg-[linear-gradient(90deg,transparent_30%,var(--shimmer-color)_50%,transparent_70%)]" />
      </div>

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2 text-base">
        {children}
      </span>

      {/* Bottom highlight */}
      <div
        className="absolute bottom-0 left-1/2 h-1/2 w-3/4 -translate-x-1/2 bg-white/10 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100"
      />
    </button>
  );
}
