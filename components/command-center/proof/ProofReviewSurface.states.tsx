"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type ProofReviewSurfaceEmptyStateProps = {
  onOpenDrawer?: () => void
  onOpenBundle?: () => void
  onCompareRole?: () => void
}

type ProofReviewSurfaceErrorStateProps = {
  onRetry?: () => void
}

export function ProofReviewSurfaceEmptyState({
  onOpenDrawer,
  onOpenBundle,
  onCompareRole,
}: ProofReviewSurfaceEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Proof review"
      title="No proof selected"
      description="Open a proof card from the candidate drawer to review the artifact against the active rubric."
      actions={[
        { label: "Open drawer", onClick: onOpenDrawer },
        { label: "Open bundle", onClick: onOpenBundle },
        { label: "Compare to role", onClick: onCompareRole },
      ]}
      className="h-full"
    />
  )
}

export function ProofReviewSurfaceLoadingState() {
  return (
    <LoadingState
      eyebrow="Proof review"
      title="Loading proof review"
      description="Binding the artifact and rubric checklist into review mode."
      className="h-full"
    >
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LoadingBlock className="h-full min-h-[420px]" />
        <div className="space-y-3 border border-border bg-surface-elevated p-4">
          <LoadingLine className="w-28" />
          <LoadingLine className="w-52" />
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingBlock key={index} className="h-32" />
          ))}
        </div>
      </div>
    </LoadingState>
  )
}

export function ProofReviewSurfaceErrorState({ onRetry }: ProofReviewSurfaceErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Proof review"
      title="Proof review unavailable"
      description="The selected proof artifact could not be resolved into review mode."
      onRetry={onRetry}
      className="h-full"
    />
  )
}
