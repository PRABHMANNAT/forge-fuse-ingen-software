"use client"

import { ExternalLink, Flag, GitCompare, Play, ShieldCheck, ThumbsUp, type LucideIcon } from "lucide-react"
import type { Freshness, TrustLevel } from "@/lib/demo-data/types"

export type ProofArtifactType = "thumbnail" | "code" | "link" | "video"

export type ProofArtifact = {
  artifactType: ProofArtifactType
  title: string
  description?: string
  url?: string
  thumbnailUrl?: string
  code?: string
  language?: string
  domain?: string
}

export type ProofMetric = {
  label: string
  value: string | number
}

export type ProofTrust = {
  state: TrustLevel
  verifierSource: string
}

export type ProofItem = {
  id: string
  title: string
  role: string
  freshness: Freshness
  artifact: ProofArtifact
  problem: string
  contribution: string
  outcome: string
  stack: string[]
  metrics?: ProofMetric[]
  trust: ProofTrust
  rubricEvidence?: Record<string, "check" | "partial" | "missing">
}

type ProofCardProps = {
  proof: ProofItem
  onOpen?: (proof: ProofItem) => void
  onEndorse?: (proof: ProofItem) => void
  onFlag?: (proof: ProofItem) => void
  onCompareToRole?: (proof: ProofItem) => void
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function truncate(value: string, max = 140) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3).trim()}...`
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function ArtifactPreview({ artifact }: { artifact: ProofArtifact }) {
  if (artifact.artifactType === "code") {
    return (
      <div className="h-36 border border-border bg-bg p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10px] uppercase tracking-wide text-text-subtle">{artifact.title}</span>
          <span className="font-mono text-[10px] uppercase text-text-subtle">{artifact.language ?? "code"}</span>
        </div>
        <pre className="h-24 overflow-hidden whitespace-pre-wrap break-words font-mono text-[10px] leading-4 text-text-muted">
          {artifact.code ?? "// Code artifact unavailable in demo fixture"}
        </pre>
      </div>
    )
  }

  if (artifact.artifactType === "link") {
    return (
      <div className="flex h-36 flex-col justify-between border border-border bg-bg p-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{artifact.domain ?? "artifact link"}</div>
          <div className="mt-2 text-sm font-semibold leading-5 text-text">{artifact.title}</div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">{artifact.description}</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-accent">
          <ExternalLink className="h-3 w-3" />
          Review source
        </div>
      </div>
    )
  }

  if (artifact.artifactType === "video") {
    return (
      <div className="relative flex h-36 items-center justify-center border border-border bg-bg">
        {artifact.thumbnailUrl ? (
          <img src={artifact.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        ) : null}
        <div className="relative flex h-10 w-10 items-center justify-center border border-border-strong bg-surface-elevated text-accent">
          <Play className="h-4 w-4 fill-current" />
        </div>
        <div className="absolute bottom-2 left-2 right-2 truncate bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-muted">
          {artifact.title}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-36 flex-col justify-end border border-border bg-bg">
      {artifact.thumbnailUrl ? (
        <img src={artifact.thumbnailUrl} alt="" className="min-h-0 flex-1 object-cover" />
      ) : (
        <div className="flex flex-1 items-center justify-center px-4 text-center font-mono text-[10px] uppercase tracking-wide text-text-subtle">
          Artifact thumbnail
        </div>
      )}
      <div className="border-t border-border bg-surface px-3 py-2">
        <div className="truncate text-sm font-semibold text-text">{artifact.title}</div>
      </div>
    </div>
  )
}

export function ProofCard({ proof, onOpen, onEndorse, onFlag, onCompareToRole }: ProofCardProps) {
  return (
    <article className="w-[320px] shrink-0 border border-border bg-surface-elevated text-text">
      <div className="border-b border-border p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-text">{proof.title}</h4>
            <div className="mt-2 w-fit border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-muted">
              {proof.role}
            </div>
          </div>
          <span
            className={cx(
              "mt-1 h-2.5 w-2.5 shrink-0 border border-border-strong",
              proof.freshness === "fresh" ? "bg-success" : "bg-warning",
            )}
            aria-label={`Proof is ${proof.freshness}`}
          />
        </div>
      </div>

      <div className="p-3">
        <ArtifactPreview artifact={proof.artifact} />

        <div className="mt-3 grid gap-2">
          {[
            ["Problem", proof.problem],
            ["Contribution", proof.contribution],
            ["Outcome", proof.outcome],
          ].map(([label, value]) => (
            <div key={label} className="border border-border bg-surface px-2 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{label}</div>
              <p className="mt-1 text-xs leading-5 text-text-muted">{truncate(value)}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {proof.stack.map((item) => (
            <span key={item} className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-subtle">
              {item}
            </span>
          ))}
        </div>

        {proof.metrics && proof.metrics.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-px bg-border">
            {proof.metrics.slice(0, 3).map((metric) => (
              <div key={metric.label} className="bg-surface p-2">
                <div className="font-mono text-[10px] uppercase text-text-subtle">{metric.label}</div>
                <div className="mt-1 font-mono text-sm font-semibold text-text">{metric.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <footer className="border-t border-border bg-surface p-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text">{labelize(proof.trust.state)}</div>
            <div className="mt-1 text-xs leading-5 text-text-muted">{proof.trust.verifierSource}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-px bg-border">
          {([
            { label: "Open", Icon: ExternalLink, action: onOpen },
            { label: "Endorse", Icon: ThumbsUp, action: onEndorse },
            { label: "Flag", Icon: Flag, action: onFlag },
            { label: "Rubric", Icon: GitCompare, action: onCompareToRole },
          ] satisfies Array<{ label: string; Icon: LucideIcon; action?: (proof: ProofItem) => void }>).map(({ label, Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => action?.(proof)}
              aria-label={`${label} ${proof.title}`}
              className="flex items-center justify-center gap-1 bg-surface-elevated px-1 py-2 font-mono text-[9px] uppercase text-text-subtle hover:bg-accent-muted hover:text-text"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </footer>
    </article>
  )
}
