"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type TalentPoolBuilderEmptyStateProps = {
  onOpenResults?: () => void
  onUseShortlist?: () => void
  onOpenPipeline?: () => void
}

type TalentPoolBuilderErrorStateProps = {
  onRetry?: () => void
}

export function TalentPoolBuilderEmptyState({
  onOpenResults,
  onUseShortlist,
  onOpenPipeline,
}: TalentPoolBuilderEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Talent pool builder"
      title="No selection loaded"
      description="Pool creation needs a candidate set. Use selected rows, a shortlist, or the current ranked results."
      actions={[
        { label: "Open results", onClick: onOpenResults },
        { label: "Use shortlist", onClick: onUseShortlist },
        { label: "Open pipeline", onClick: onOpenPipeline },
      ]}
    />
  )
}

export function TalentPoolBuilderLoadingState() {
  return (
    <LoadingState
      eyebrow="Talent pool builder"
      title="Preparing pool draft"
      description="Loading candidate members, saved query criteria, and pool metadata."
    >
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <div key={columnIndex} className="border border-border bg-surface-elevated p-4">
            <LoadingLine className="w-24" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: columnIndex === 1 ? 5 : 4 }).map((__, index) => (
                <LoadingBlock key={index} className={columnIndex === 1 ? "h-16" : "h-12"} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </LoadingState>
  )
}

export function TalentPoolBuilderErrorState({ onRetry }: TalentPoolBuilderErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Talent pool builder"
      title="Pool draft unavailable"
      description="The current selection could not be converted into a saved pool."
      onRetry={onRetry}
    />
  )
}
