"use client"

import type { ReasoningStep } from "@/lib/agent/types"
import { cn } from "@/lib/utils"

export function ReasoningStream({ steps }: { steps: ReasoningStep[] }) {
  if (steps.length === 0) return null

  return (
    <div className="mt-3 border border-border bg-surface">
      {steps.map((step, index) => (
        <div
          key={`${step.label}-${index}`}
          className="animate-fade-in border-b border-border px-3 py-2 last:border-b-0"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 border border-border-strong",
                step.status === "done" && "bg-success",
                step.status === "running" && "bg-accent",
                step.status === "pending" && "bg-transparent",
              )}
            />
            <span className="font-mono text-[11px] uppercase tracking-wide text-text-muted">{step.label}</span>
            {step.status === "running" && <span className="h-px w-6 animate-pulse bg-accent" aria-hidden="true" />}
          </div>
          {step.detail && <div className="ml-4 mt-1 font-mono text-[10px] text-text-subtle">{step.detail}</div>}
        </div>
      ))}
    </div>
  )
}
