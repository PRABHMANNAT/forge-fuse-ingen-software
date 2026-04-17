"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReasoningStep } from "@/lib/agent/types"
import { cn } from "@/lib/utils"
import { DISABLED_TRANSITION, REASONING_STEP_TRANSITION } from "@/components/command-center/motion"

export function ReasoningStream({ steps }: { steps: ReasoningStep[] }) {
  const shouldReduceMotion = Boolean(useReducedMotion())

  if (steps.length === 0) return null

  return (
    <div className="mt-3 border border-border bg-surface">
      {steps.map((step, index) => (
        <motion.div
          key={`${step.label}-${index}`}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? DISABLED_TRANSITION
              : { ...REASONING_STEP_TRANSITION, delay: index * 0.08 }
          }
          className="border-b border-border px-3 py-2 last:border-b-0"
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
            {step.status === "running" && (
              <span className={cn("h-px w-6 bg-accent", !shouldReduceMotion && "animate-pulse")} aria-hidden="true" />
            )}
          </div>
          {step.detail && <div className="ml-4 mt-1 font-mono text-[10px] text-text-subtle">{step.detail}</div>}
        </motion.div>
      ))}
    </div>
  )
}
