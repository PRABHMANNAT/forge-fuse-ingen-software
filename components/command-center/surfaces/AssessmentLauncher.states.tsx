"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type AssessmentLauncherEmptyStateProps = {
  onUseShortlist?: () => void
  onSelectCandidates?: () => void
  onOpenPools?: () => void
}

type AssessmentLauncherErrorStateProps = {
  onRetry?: () => void
}

export function AssessmentLauncherEmptyState({
  onUseShortlist,
  onSelectCandidates,
  onOpenPools,
}: AssessmentLauncherEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Assessment launcher"
      title="No launch target"
      description="Load a shortlist, explicit candidate set, or talent pool before sending an assessment."
      actions={[
        { label: "Use shortlist", onClick: onUseShortlist },
        { label: "Select candidates", onClick: onSelectCandidates },
        { label: "Open pools", onClick: onOpenPools },
      ]}
    />
  )
}

export function AssessmentLauncherLoadingState() {
  return (
    <LoadingState
      eyebrow="Assessment launcher"
      title="Preparing assessment run"
      description="Binding the launch target, rubric, integrity settings, and tracker rows."
    >
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className="space-y-3 border border-border bg-surface-elevated p-4">
          <LoadingLine className="w-24" />
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingBlock key={index} className="h-20" />
          ))}
        </div>
        <div className="space-y-3">
          <LoadingBlock className="h-20" />
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              <LoadingBlock className="h-40" />
              <LoadingBlock className="h-48" />
              <LoadingBlock className="h-44" />
            </div>
            <div className="space-y-3">
              <LoadingBlock className="h-48" />
              <LoadingBlock className="h-56" />
            </div>
          </div>
        </div>
        <div className="space-y-3 border border-border bg-surface-elevated p-4">
          <LoadingLine className="w-20" />
          {Array.from({ length: 6 }).map((_, index) => (
            <LoadingBlock key={index} className="h-10" />
          ))}
          <LoadingBlock className="h-12" />
        </div>
      </div>
    </LoadingState>
  )
}

export function AssessmentLauncherErrorState({ onRetry }: AssessmentLauncherErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Assessment launcher"
      title="Assessment launch unavailable"
      description="The current launch payload could not be assembled from the selected role and targets."
      onRetry={onRetry}
    />
  )
}
