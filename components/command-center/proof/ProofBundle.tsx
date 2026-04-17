"use client"

import { Check, Circle, Minus } from "lucide-react"
import type { OpenRole } from "@/lib/demo-data/types"
import { ProofCard, type ProofItem } from "./ProofCard"

type ProofBundleProps = {
  role: string
  proofs: ProofItem[]
  currentRole?: OpenRole | null
  readinessMatch?: number
  onOpenProof?: (proof: ProofItem) => void
  onEndorseProof?: (proof: ProofItem) => void
  onFlagProof?: (proof: ProofItem) => void
  onCompareToRole?: (proof: ProofItem) => void
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function evidenceText(proofs: ProofItem[]) {
  return proofs
    .flatMap((proof) => [
      proof.title,
      proof.problem,
      proof.contribution,
      proof.outcome,
      proof.role,
      proof.stack.join(" "),
      proof.artifact.title,
      proof.artifact.description ?? "",
    ])
    .join(" ")
    .toLowerCase()
}

function rubricCoverage(proofs: ProofItem[], currentRole?: OpenRole | null) {
  if (!currentRole) return []
  const corpus = evidenceText(proofs)
  return currentRole.rubric.map((dimension) => {
    const dimensionTerms = dimension.dimension.toLowerCase().split(/\s+/)
    const evidenceTerms = dimension.evidenceExpected.toLowerCase().split(/\s+/)
    const dimensionHit = dimensionTerms.some((term) => term.length > 3 && corpus.includes(term))
    const evidenceHit = evidenceTerms.some((term) => term.length > 4 && corpus.includes(term))
    const state: "check" | "partial" | "missing" = dimensionHit && evidenceHit ? "check" : dimensionHit || evidenceHit ? "partial" : "missing"
    return { ...dimension, state }
  })
}

function computedReadiness(proofs: ProofItem[], currentRole?: OpenRole | null) {
  const coverage = rubricCoverage(proofs, currentRole)
  if (coverage.length === 0) return Math.min(98, 60 + proofs.length * 8)
  return Math.round(
    coverage.reduce((total, dimension) => {
      const multiplier = dimension.state === "check" ? 1 : dimension.state === "partial" ? 0.55 : 0.15
      return total + dimension.weight * multiplier
    }, 0),
  )
}

function CoverageGlyph({ state }: { state: "check" | "partial" | "missing" }) {
  if (state === "check") return <Check className="h-3.5 w-3.5 text-success" />
  if (state === "partial") return <Circle className="h-2.5 w-2.5 fill-info text-info" />
  return <Minus className="h-3.5 w-3.5 text-text-subtle" />
}

export function ProofBundle({
  role,
  proofs,
  currentRole,
  readinessMatch,
  onOpenProof,
  onEndorseProof,
  onFlagProof,
  onCompareToRole,
}: ProofBundleProps) {
  const coverage = rubricCoverage(proofs, currentRole)
  const score = readinessMatch ?? computedReadiness(proofs, currentRole)
  const freshCount = proofs.filter((proof) => proof.freshness === "fresh").length
  const verifiedCount = proofs.filter((proof) => proof.trust.state.includes("verified")).length

  return (
    <section className="border border-border bg-surface">
      <header className="border-b border-border bg-surface-elevated p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Proof bundle</div>
            <h3 className="font-display text-3xl uppercase leading-none text-text">{role}</h3>
            <p className="mt-2 text-sm text-text-muted">
              {proofs.length} proof cards, {freshCount} fresh, {verifiedCount} verified against {currentRole?.title ?? "loaded role"}.
            </p>
          </div>
          <div className="border border-border bg-surface px-3 py-2 text-right">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Readiness match</div>
            <div className="font-display text-4xl uppercase leading-none text-text">{score}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-px bg-border md:grid-cols-4">
          {(coverage.length > 0 ? coverage : []).map((dimension) => (
            <div key={dimension.dimension} className="bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{dimension.dimension}</div>
                <CoverageGlyph state={dimension.state} />
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase text-text-subtle">{dimension.weight}% weight</div>
            </div>
          ))}
          {coverage.length === 0 ? (
            <div className="bg-surface p-3 text-sm text-text-muted md:col-span-4">
              Load a role rubric to calculate bundle readiness coverage.
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex gap-3 overflow-x-auto p-4">
        {proofs.map((proof) => (
          <ProofCard
            key={proof.id}
            proof={proof}
            onOpen={onOpenProof}
            onEndorse={onEndorseProof}
            onFlag={onFlagProof}
            onCompareToRole={onCompareToRole}
          />
        ))}
      </div>

      <footer className="border-t border-border bg-surface-elevated px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
          <span className={cx("inline-flex items-center gap-1", score >= 80 && "border border-success bg-success-soft px-2 py-1 text-text")}>
            <Check className="h-3 w-3" />
            Role evidence mapped
          </span>
          <span>{proofs.reduce((total, proof) => total + (proof.metrics?.length ?? 0), 0)} metrics attached</span>
          <span>{proofs.flatMap((proof) => proof.stack).length} stack signals</span>
        </div>
      </footer>
    </section>
  )
}
