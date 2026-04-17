"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type PipelineBoardEmptyStateProps = {
  onClearRole?: () => void
  onOpenResults?: () => void
  onOpenRoleBuilder?: () => void
}

type PipelineBoardErrorStateProps = {
  onRetry?: () => void
}

export function PipelineBoardEmptyState({
  onClearRole,
  onOpenResults,
  onOpenRoleBuilder,
}: PipelineBoardEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Pipeline board"
      title="No scoped pipeline"
      description="The current role filter does not map to any local candidates. Load another role or re-run candidate search."
      actions={[
        { label: "Clear role filter", onClick: onClearRole },
        { label: "Open results", onClick: onOpenResults },
        { label: "Open role builder", onClick: onOpenRoleBuilder },
      ]}
    />
  )
}

export function PipelineBoardLoadingState() {
  return (
    <LoadingState
      eyebrow="Pipeline board"
      title="Loading pipeline lanes"
      description="Scoping candidates to the active role and computing SLA health by stage."
    >
      <div className="grid grid-cols-4 gap-px bg-border">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingBlock key={index} className="h-20" />
        ))}
      </div>
      <div className="mt-4 flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="w-[290px] shrink-0 border border-border bg-surface-elevated p-3">
            <LoadingLine className="w-20" />
            <LoadingLine className="mt-3 w-12" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <LoadingBlock key={cardIndex} className="h-40" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </LoadingState>
  )
}

export function PipelineBoardErrorState({ onRetry }: PipelineBoardErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Pipeline board"
      title="Pipeline board unavailable"
      description="The local pipeline state could not be projected into board columns."
      onRetry={onRetry}
    />
  )
}
