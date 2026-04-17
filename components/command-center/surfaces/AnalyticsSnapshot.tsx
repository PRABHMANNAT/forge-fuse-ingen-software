"use client"

import type { ReactNode } from "react"
import { Clock3, GitBranch, ShieldCheck, Target, Waypoints } from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import { analytics } from "@/lib/demo-data/analytics"
import { pathways as seededPathways } from "@/lib/demo-data/pathways"
import { talentPools as seededPools } from "@/lib/demo-data/talent-pools"
import type { CompanyPathway, TalentPool, TrustLevel } from "@/lib/demo-data/types"
import {
  AnalyticsSnapshotEmptyState,
  AnalyticsSnapshotErrorState,
  AnalyticsSnapshotLoadingState,
} from "./AnalyticsSnapshot.states"

const funnelSteps = [
  { key: "sourced", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "responded", label: "Responded" },
  { key: "assessed", label: "Assessment" },
  { key: "tryout", label: "Tryout" },
  { key: "interviewed", label: "Interview" },
  { key: "offered", label: "Offer" },
  { key: "hired", label: "Hired" },
] as const

const trustOrder: TrustLevel[] = ["unverified", "self-attested", "peer-endorsed", "employer-verified", "identity-verified"]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function percent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`
}

function points(value: number) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)} pts`
}

function sparklinePath(values: number[], width: number, height: number, minValue?: number, maxValue?: number) {
  if (values.length === 0) return ""
  const min = minValue ?? Math.min(...values)
  const max = maxValue ?? Math.max(...values)
  const range = max - min || 1
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
}

function SegmentedMeter({ score, invert = false }: { score: number; invert?: boolean }) {
  const normalized = Math.max(0, Math.min(100, invert ? 100 - score : score))
  const activeCount = Math.round(normalized / 10)
  return (
    <div className="grid grid-cols-10 gap-px bg-border">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className={cx("h-2 bg-surface", index < activeCount && "bg-accent")}
        />
      ))}
    </div>
  )
}

function Tile({
  title,
  eyebrow,
  icon: Icon,
  className,
  children,
}: {
  title: string
  eyebrow: string
  icon?: typeof Clock3
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cx("border border-border bg-surface-elevated p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">{eyebrow}</div>
          <h2 className="mt-1 font-display text-3xl uppercase leading-none text-text">{title}</h2>
        </div>
        {Icon ? <Icon className="h-4 w-4 text-text-subtle" /> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Sparkline({
  primary,
  secondary,
}: {
  primary: number[]
  secondary?: number[]
}) {
  const width = 280
  const height = 64
  const bounds = [...primary, ...(secondary ?? [])]
  const min = Math.min(...bounds)
  const max = Math.max(...bounds)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full overflow-visible">
      <path d={`M 0 ${height - 1} L ${width} ${height - 1}`} fill="none" stroke="var(--border)" strokeWidth="1" />
      <path d={`M 0 ${height / 2} L ${width} ${height / 2}`} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
      {secondary ? (
        <path
          d={sparklinePath(secondary, width, height, min, max)}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="1.5"
          opacity="0.7"
        />
      ) : null}
      <path
        d={sparklinePath(primary, width, height, min, max)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
      />
    </svg>
  )
}

function FunnelTile() {
  const values = funnelSteps.map((step) => analytics.funnelCounts[step.key])
  const max = Math.max(...values)
  return (
    <Tile title="Hiring funnel" eyebrow="90-day funnel" icon={GitBranch} className="col-span-7">
      <div className="grid grid-cols-8 gap-3">
        {funnelSteps.map((step, index) => {
          const count = analytics.funnelCounts[step.key]
          const previous = index === 0 ? null : analytics.funnelCounts[funnelSteps[index - 1].key]
          const conversion = previous ? count / previous : 1
          return (
            <div key={step.key} className="flex min-h-52 flex-col justify-end">
              <div className="font-mono text-[10px] uppercase text-text-subtle">{step.label}</div>
              <div className="mt-1 text-xl font-semibold leading-none text-text">{count}</div>
              <div className="mt-2 flex h-36 items-end border border-border bg-surface p-2">
                <div
                  className="w-full bg-accent"
                  style={{ height: `${Math.max(10, (count / max) * 100)}%` }}
                />
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase text-text-subtle">
                {index === 0 ? "100%" : percent(conversion)}
              </div>
            </div>
          )
        })}
      </div>
    </Tile>
  )
}

function TimeToContactTile() {
  const p50Series = analytics.timeToContactSeries90d.map((point) => point.p50)
  const p90Series = analytics.timeToContactSeries90d.map((point) => point.p90)
  return (
    <Tile title="Time to contact" eyebrow="Speed" icon={Clock3} className="col-span-5">
      <div className="grid grid-cols-[1fr_280px] gap-4">
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-surface p-3">
            <div className="font-mono text-[10px] uppercase text-text-subtle">P50</div>
            <div className="mt-2 font-display text-5xl uppercase leading-none text-text">{analytics.timeToContactPercentiles.p50.toFixed(1)}h</div>
          </div>
          <div className="bg-surface p-3">
            <div className="font-mono text-[10px] uppercase text-text-subtle">P90</div>
            <div className="mt-2 font-display text-5xl uppercase leading-none text-text">{analytics.timeToContactPercentiles.p90.toFixed(1)}h</div>
          </div>
        </div>
        <div className="border border-border bg-surface p-3">
          <Sparkline primary={p50Series} secondary={p90Series} />
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase text-text-subtle">
            <span>90d</span>
            <span>60d</span>
            <span>30d</span>
          </div>
        </div>
      </div>
    </Tile>
  )
}

function RateTile({
  eyebrow,
  title,
  value,
  primaryLabel,
  secondary,
  footer,
}: {
  eyebrow: string
  title: string
  value: string
  primaryLabel: string
  secondary?: string
  footer: string
}) {
  return (
    <Tile title={title} eyebrow={eyebrow} className="col-span-2">
      <div className="font-display text-6xl uppercase leading-none text-text">{value}</div>
      <div className="mt-3 font-mono text-[10px] uppercase text-text-subtle">{primaryLabel}</div>
      {secondary ? <div className="mt-2 text-sm font-semibold text-text-muted">{secondary}</div> : null}
      <div className="mt-4 border-t border-border pt-3 font-mono text-[10px] uppercase text-text-subtle">{footer}</div>
    </Tile>
  )
}

function PoolHealthTile() {
  const { pools } = useAgentStore()
  return (
    <Tile title="Pool health" eyebrow="Saved pools" icon={Target} className="col-span-5">
      <div className="space-y-3">
        {analytics.poolHealth.map((metric) => {
          const pool =
            pools.find((item: TalentPool) => item.id === metric.poolId) ??
            seededPools.find((item: TalentPool) => item.id === metric.poolId)
          return (
            <div key={metric.poolId} className="border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-text">{pool?.name ?? metric.poolId}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">Refreshed {new Date(metric.refreshedAt).toLocaleDateString("en", { month: "short", day: "2-digit" })}</div>
                </div>
                <div className="font-mono text-[10px] uppercase text-text-subtle">{pool?.candidateIds.length ?? 0} members</div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase text-text-subtle">
                    <span>Refresh freshness</span>
                    <span>{metric.freshnessScore}</span>
                  </div>
                  <SegmentedMeter score={metric.freshnessScore} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase text-text-subtle">
                    <span>Match decay</span>
                    <span>{metric.matchDecayScore}</span>
                  </div>
                  <SegmentedMeter score={metric.matchDecayScore} invert />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Tile>
  )
}

function TrustDistributionTile() {
  const total = Object.values(analytics.trustDistribution).reduce((sum, count) => sum + count, 0)
  return (
    <Tile title="Proof trust" eyebrow="Current shortlist" icon={ShieldCheck} className="col-span-5">
      <div className="grid gap-px bg-border">
        {trustOrder.map((level) => {
          const count = analytics.trustDistribution[level]
          const share = total > 0 ? count / total : 0
          return (
            <div key={level} className="grid grid-cols-[1fr_64px_72px] items-center gap-3 bg-surface p-3">
              <div>
                <div className="text-sm font-semibold text-text">{labelize(level)}</div>
                <div className="mt-2"><SegmentedMeter score={share * 100} /></div>
              </div>
              <div className="text-right font-display text-3xl uppercase leading-none text-text">{count}</div>
              <div className="text-right font-mono text-[10px] uppercase text-text-subtle">{percent(share)}</div>
            </div>
          )
        })}
      </div>
    </Tile>
  )
}

function PathwayEffectivenessTile() {
  const { pathways } = useAgentStore()
  return (
    <Tile title="Pathway effectiveness" eyebrow="Completed vs not completed" icon={Waypoints} className="col-span-7">
      <div className="space-y-3">
        {analytics.pathwayEffectiveness.map((metric) => {
          const pathway =
            pathways.find((item: CompanyPathway) => item.id === metric.pathwayId) ??
            seededPathways.find((item: CompanyPathway) => item.id === metric.pathwayId)
          const delta = metric.completedHireRate - metric.incompleteHireRate
          return (
            <div key={metric.pathwayId} className="grid grid-cols-[1.1fr_120px_120px_96px] gap-3 border border-border bg-surface p-3">
              <div>
                <div className="text-sm font-semibold text-text">{pathway?.title ?? metric.pathwayId}</div>
                <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">{pathway?.role ?? "Pathway"}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase text-text-subtle">Completed</div>
                <div className="mt-2 text-2xl font-semibold leading-none text-text">{percent(metric.completedHireRate, 1)}</div>
                <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">{metric.completedCount} candidates</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase text-text-subtle">Not completed</div>
                <div className="mt-2 text-2xl font-semibold leading-none text-text">{percent(metric.incompleteHireRate, 1)}</div>
                <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">{metric.incompleteCount} candidates</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase text-text-subtle">Lift</div>
                <div
                  className={cx(
                    "mt-2 inline-flex border px-2 py-1 text-2xl font-semibold leading-none",
                    delta >= 0
                      ? "border-success bg-success-soft text-text"
                      : "border-danger bg-danger-soft text-text",
                  )}
                >
                  {points(delta)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Tile>
  )
}

export function AnalyticsSnapshot() {
  const { currentRole, openSurface } = useAgentStore()
  const completedAssessments = Math.round(analytics.funnelCounts.assessed * analytics.assessmentCompletionRate)
  const isLoading = false
  const error: string | null = null

  if (error) {
    return <AnalyticsSnapshotErrorState onRetry={() => openSurface("analytics_panel")} />
  }

  if (isLoading) {
    return <AnalyticsSnapshotLoadingState />
  }

  if (analytics.timeToContactSeries90d.length === 0) {
    return (
      <AnalyticsSnapshotEmptyState
        onOpenPipeline={() => openSurface("pipeline_board")}
        onOpenPools={() => openSurface("pool_builder")}
        onOpenResults={() => openSurface("results_table")}
      />
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-bg p-4">
      <div className="mb-4 border border-border bg-surface px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Analytics snapshot</div>
        <div className="mt-1 font-display text-3xl uppercase leading-none text-text">
          {currentRole ? `${currentRole.title} funnel health` : "Funnel health"}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-3">
        <FunnelTile />
        <TimeToContactTile />

        <RateTile
          eyebrow="Reply velocity"
          title="Response rate"
          value={percent(analytics.responseRate, 1)}
          primaryLabel={`${analytics.funnelCounts.responded}/${analytics.funnelCounts.contacted} replied`}
          footer="Contacted -> responded"
        />

        <Tile title="Assessment completion" eyebrow="Execution quality" className="col-span-3">
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div>
              <div className="font-display text-6xl uppercase leading-none text-text">{percent(analytics.assessmentCompletionRate, 1)}</div>
              <div className="mt-3 font-mono text-[10px] uppercase text-text-subtle">{completedAssessments}/{analytics.funnelCounts.assessed} completed</div>
            </div>
            <div className="border border-border bg-surface p-3 text-right">
              <div className="font-mono text-[10px] uppercase text-text-subtle">Integrity</div>
              <div className="mt-2 inline-flex border border-warning bg-warning-soft px-2 py-1 text-2xl font-semibold leading-none text-text">
                {percent(analytics.integrityFlagRate, 1)}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">flag rate</div>
            </div>
          </div>
        </Tile>

        <RateTile
          eyebrow="Late-stage yield"
          title="Offer rate"
          value={percent(analytics.offerRate, 1)}
          primaryLabel={`${analytics.funnelCounts.offered}/${analytics.funnelCounts.interviewed} offered`}
          footer="Interview -> offer"
        />

        <TrustDistributionTile />
        <PoolHealthTile />
        <PathwayEffectivenessTile />
      </div>
    </div>
  )
}
