"use client"

import type { ReactNode } from "react"

type LoadingStateProps = {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
  className?: string
}

type LoadingBlockProps = {
  className?: string
}

type LoadingLineProps = {
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function LoadingBlock({ className }: LoadingBlockProps) {
  return <div className={cx("border border-border bg-surface", className)} aria-hidden="true" />
}

export function LoadingLine({ className }: LoadingLineProps) {
  return <div className={cx("h-2.5 border border-border bg-surface", className)} aria-hidden="true" />
}

export function LoadingState({
  eyebrow,
  title,
  description,
  children,
  className,
}: LoadingStateProps) {
  return (
    <div className={cx("flex h-full min-h-0 flex-col bg-bg p-4", className)}>
      <section className="border border-border bg-surface-elevated p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">{eyebrow}</div>
        <h2 className="mt-3 font-display text-4xl uppercase leading-none text-text">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>
      </section>
      <div className="mt-4 min-h-0 flex-1">{children}</div>
    </div>
  )
}
