"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type CandidateResultsEmptyStateProps = {
  onClearTrustLevel: () => void
  onIncludeStaleProof: () => void
  onRemoveLocation: () => void
}

type CandidateResultsErrorStateProps = {
  message: string
  onRetry: () => void
}

export function CandidateResultsEmptyState({
  onClearTrustLevel,
  onIncludeStaleProof,
  onRemoveLocation,
}: CandidateResultsEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Candidate results"
      title="No candidates match"
      description="The current filter stack removed every ranked profile. Relax one constraint and re-run the result set."
      actions={[
        { label: "Clear trust level", onClick: onClearTrustLevel },
        { label: "Include stale proof", onClick: onIncludeStaleProof },
        { label: "Remove location", onClick: onRemoveLocation },
      ]}
    />
  )
}

export function CandidateResultsLoadingState() {
  return (
    <LoadingState
      eyebrow="Candidate results"
      title="Recomputing ranked candidates"
      description="Applying filters, trust, freshness, and readiness against the current result set."
    >
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="border border-border bg-surface-elevated p-3">
          <LoadingLine className="w-24" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="border border-border bg-surface p-3">
                <LoadingLine className="w-20" />
                <div className="mt-3 space-y-2">
                  <LoadingLine className="w-full" />
                  <LoadingLine className="w-5/6" />
                  <LoadingLine className="w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-0">
          <div className="border border-border bg-surface-elevated p-3">
            <div className="grid grid-cols-[28px_minmax(220px,1.5fr)_120px_120px_130px_110px_90px_88px_144px] gap-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <LoadingLine key={index} className={index === 1 ? "w-28" : "w-full"} />
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-[28px_minmax(220px,1.5fr)_120px_120px_130px_110px_90px_88px_144px] gap-3 border border-border bg-surface-elevated p-3">
                <LoadingBlock className="h-5 w-5" />
                <div className="space-y-2">
                  <LoadingLine className="w-36" />
                  <LoadingLine className="w-56" />
                </div>
                <LoadingBlock className="h-12 w-20" />
                <LoadingLine className="w-20" />
                <LoadingLine className="w-24" />
                <LoadingLine className="w-20" />
                <LoadingLine className="w-16" />
                <LoadingLine className="w-16" />
                <div className="flex gap-2">
                  <LoadingLine className="w-10" />
                  <LoadingLine className="w-12" />
                  <LoadingLine className="w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LoadingState>
  )
}

export function CandidateResultsErrorState({ message, onRetry }: CandidateResultsErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Candidate results"
      title="Result set unavailable"
      description="The local candidate ranking pass did not complete."
      detail={message}
      onRetry={onRetry}
    />
  )
}
