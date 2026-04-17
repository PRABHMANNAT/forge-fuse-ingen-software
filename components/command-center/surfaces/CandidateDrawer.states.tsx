"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type CandidateDrawerEmptyStateProps = {
  onOpenResults?: () => void
  onOpenCompare?: () => void
  onLoadRole?: () => void
}

type CandidateDrawerErrorStateProps = {
  onRetry?: () => void
}

export function CandidateDrawerEmptyState({
  onOpenResults,
  onOpenCompare,
  onLoadRole,
}: CandidateDrawerEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Candidate drawer"
      title="No candidate loaded"
      description="Open a ranked profile to inspect readiness, trust, proof, and pathway coverage."
      actions={[
        { label: "Open results", onClick: onOpenResults },
        { label: "Open compare", onClick: onOpenCompare },
        { label: "Load role context", onClick: onLoadRole },
      ]}
      className="h-full p-3"
    />
  )
}

export function CandidateDrawerLoadingState() {
  return (
    <LoadingState
      eyebrow="Candidate drawer"
      title="Loading candidate record"
      description="Hydrating proof bundles, pathway fit, trust, and activity history."
      className="h-full p-3"
    >
      <div className="space-y-3">
        <div className="border border-border bg-surface-elevated p-4">
          <div className="flex gap-4">
            <LoadingBlock className="h-14 w-14 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <LoadingLine className="w-52" />
              <LoadingLine className="w-72" />
              <div className="flex flex-wrap gap-2">
                <LoadingLine className="w-20" />
                <LoadingLine className="w-24" />
                <LoadingLine className="w-28" />
              </div>
            </div>
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border border-border bg-surface-elevated p-4">
            <LoadingLine className="w-28" />
            <LoadingLine className="mt-3 w-48" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <LoadingBlock className="h-24" />
              <LoadingBlock className="h-24" />
            </div>
          </div>
        ))}
      </div>
    </LoadingState>
  )
}

export function CandidateDrawerErrorState({ onRetry }: CandidateDrawerErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Candidate drawer"
      title="Candidate record unavailable"
      description="The selected profile could not be resolved from the local result set."
      onRetry={onRetry}
      className="h-full p-3"
    />
  )
}
