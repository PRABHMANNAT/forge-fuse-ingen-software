"use client"

import type { StructuredOutput as StructuredOutputType } from "@/lib/agent/types"
import { useAgentStore } from "@/lib/agent/store"
import { candidates } from "@/lib/demo-data/candidates"

function candidateById(candidateId: string) {
  return candidates.find((candidate) => candidate.id === candidateId)
}

function trustLabel(candidateId: string) {
  return candidateById(candidateId)?.proofBundles[0]?.trustLevel.replace(/-/g, " ") ?? "unverified"
}

export function StructuredOutput({ output }: { output: StructuredOutputType }) {
  const { openSurface } = useAgentStore()

  if (output.kind === "shortlist_preview") {
    const previewCandidates = output.candidateIds.map(candidateById).filter(Boolean)

    return (
      <div className="mt-3 border border-border bg-surface">
        <div className="border-b border-border px-3 py-2">
          <div className="font-sans text-sm font-semibold text-text">{output.title}</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{output.summary}</div>
        </div>
        <div className="grid gap-px bg-border md:grid-cols-3">
          {previewCandidates.map((candidate) =>
            candidate ? (
              <button
                key={candidate.id}
                type="button"
                onClick={() => openSurface("results_table")}
                className="bg-surface-elevated p-3 text-left transition-colors hover:bg-accent-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{candidate.id}</div>
                <div className="mt-1 text-sm font-semibold text-text">{candidate.name}</div>
                <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide">
                  <span className="border border-border-strong px-1.5 py-0.5 text-text">{candidate.readinessScore.score}</span>
                  <span className="text-text-muted">{trustLabel(candidate.id)}</span>
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  {candidate.skills[0]?.name} proof · {candidate.proofBundles[0]?.artifactCount} artifacts
                </div>
              </button>
            ) : null,
          )}
        </div>
      </div>
    )
  }

  if (output.kind === "pool_summary") {
    return (
      <button
        type="button"
        onClick={() => openSurface("pool_builder")}
        className="mt-3 w-full border border-border bg-surface p-3 text-left transition-colors hover:bg-accent-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Pool summary</div>
        <div className="mt-1 text-sm font-semibold text-text">{output.name}</div>
        <div className="mt-1 text-xs text-text-muted">{output.summary}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {output.candidateIds.slice(0, 6).map((candidateId) => {
            const candidate = candidateById(candidateId)
            return (
              <span key={candidateId} className="border border-border bg-surface-elevated px-2 py-1 font-mono text-[10px] uppercase text-text-muted">
                {candidate?.name ?? candidateId}
              </span>
            )
          })}
        </div>
      </button>
    )
  }

  if (output.kind === "explanation_card") {
    return (
      <button
        type="button"
        onClick={() => openSurface("candidate_drawer")}
        className="mt-3 w-full border border-border bg-surface p-3 text-left transition-colors hover:bg-accent-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Explanation card</div>
        <div className="mt-1 text-sm font-semibold text-text">{output.title}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center border border-success bg-success-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text">
              Rank drivers
            </div>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              {output.rankDrivers.map((driver) => (
                <li key={driver}>- {driver}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="inline-flex items-center border border-warning bg-warning-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text">
              Risks to inspect
            </div>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              {output.riskNotes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => openSurface(output.surface)}
      className="mt-3 w-full border border-border bg-surface p-3 text-left transition-colors hover:bg-accent-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{output.surface}</div>
      <div className="mt-1 text-sm font-semibold text-text">{output.title}</div>
      <div className="mt-1 text-xs text-text-muted">{output.summary}</div>
    </button>
  )
}
