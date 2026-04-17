"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingState } from "@/components/command-center/states"

type AnalyticsSnapshotEmptyStateProps = {
  onOpenPipeline?: () => void
  onOpenPools?: () => void
  onOpenResults?: () => void
}

type AnalyticsSnapshotErrorStateProps = {
  onRetry?: () => void
}

export function AnalyticsSnapshotEmptyState({
  onOpenPipeline,
  onOpenPools,
  onOpenResults,
}: AnalyticsSnapshotEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Analytics snapshot"
      title="No analytics window"
      description="The 90-day hiring sample is empty. Load pipeline activity or recruiter outreach to restore reporting."
      actions={[
        { label: "Open pipeline", onClick: onOpenPipeline },
        { label: "Open pools", onClick: onOpenPools },
        { label: "Open results", onClick: onOpenResults },
      ]}
    />
  )
}

export function AnalyticsSnapshotLoadingState() {
  return (
    <LoadingState
      eyebrow="Analytics snapshot"
      title="Loading operating metrics"
      description="Computing funnel conversion, response velocity, proof trust, and pathway effectiveness from the fixture window."
    >
      <div className="grid grid-cols-12 gap-3">
        <LoadingBlock className="col-span-7 h-72" />
        <LoadingBlock className="col-span-5 h-72" />
        <LoadingBlock className="col-span-2 h-48" />
        <LoadingBlock className="col-span-3 h-48" />
        <LoadingBlock className="col-span-2 h-48" />
        <LoadingBlock className="col-span-5 h-64" />
        <LoadingBlock className="col-span-5 h-64" />
        <LoadingBlock className="col-span-7 h-64" />
      </div>
    </LoadingState>
  )
}

export function AnalyticsSnapshotErrorState({ onRetry }: AnalyticsSnapshotErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Analytics snapshot"
      title="Analytics snapshot unavailable"
      description="The fixture metrics could not be reduced into the current reporting tiles."
      onRetry={onRetry}
    />
  )
}
