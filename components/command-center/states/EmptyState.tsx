"use client"

import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

type EmptyStateAction = {
  label: string
  onClick?: () => void
}

type EmptyStateProps = {
  eyebrow: string
  title: string
  description: string
  actions?: EmptyStateAction[]
  meta?: ReactNode
  children?: ReactNode
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function EmptyState({
  eyebrow,
  title,
  description,
  actions = [],
  meta,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx("flex h-full min-h-0 items-center justify-center p-4", className)}>
      <section className="w-full max-w-3xl border border-border bg-surface-elevated p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">{eyebrow}</div>
        <h2 className="mt-3 font-display text-4xl uppercase leading-none text-text">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>
        {meta ? <div className="mt-4">{meta}</div> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {actions.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
              >
                {action.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
