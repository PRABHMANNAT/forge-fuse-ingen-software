"use client"

import type { ReactNode } from "react"
import { RotateCcw } from "lucide-react"

type ErrorStateProps = {
  eyebrow: string
  title: string
  description: string
  retryLabel?: string
  onRetry?: () => void
  detail?: ReactNode
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function ErrorState({
  eyebrow,
  title,
  description,
  retryLabel = "Retry",
  onRetry,
  detail,
  className,
}: ErrorStateProps) {
  return (
    <div className={cx("flex h-full min-h-0 items-center justify-center p-4", className)}>
      <section className="w-full max-w-3xl border border-danger bg-surface-elevated p-5">
        <div className="inline-flex border border-danger bg-danger-soft px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text">
          {eyebrow}
        </div>
        <h2 className="mt-3 font-display text-4xl uppercase leading-none text-text">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>
        {detail ? <div className="mt-4 text-xs leading-5 text-text-subtle">{detail}</div> : null}
        {onRetry ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 border border-danger bg-danger-soft px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text hover:border-border-strong"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {retryLabel}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
