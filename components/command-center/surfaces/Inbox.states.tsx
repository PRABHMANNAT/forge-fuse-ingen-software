"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type InboxEmptyStateProps = {
  onClearFilters?: () => void
  onOpenResults?: () => void
  onOpenCandidates?: () => void
}

type InboxErrorStateProps = {
  onRetry?: () => void
}

export function InboxEmptyState({
  onClearFilters,
  onOpenResults,
  onOpenCandidates,
}: InboxEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Inbox"
      title="No threads in scope"
      description="The current inbox filter returned no recruiter threads. Clear the filter or seed new outreach from ranked candidates."
      actions={[
        { label: "Clear filters", onClick: onClearFilters },
        { label: "Open results", onClick: onOpenResults },
        { label: "Open candidates", onClick: onOpenCandidates },
      ]}
    />
  )
}

export function InboxLoadingState() {
  return (
    <LoadingState
      eyebrow="Inbox"
      title="Loading recruiter threads"
      description="Assembling thread list, candidate context, and draft replies for the active stage."
    >
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)_280px]">
        <div className="row-span-2 border border-border bg-surface-elevated p-4">
          <LoadingLine className="w-20" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingBlock key={index} className="h-24" />
            ))}
          </div>
        </div>
        <div className="border border-border bg-surface-elevated p-4">
          <LoadingLine className="w-32" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[112px_1fr] gap-3">
                <LoadingBlock className="h-16" />
                <LoadingBlock className="h-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="border border-border bg-surface-elevated p-4">
          <LoadingLine className="w-24" />
          <div className="mt-4 space-y-3">
            <LoadingBlock className="h-10" />
            <LoadingBlock className="h-32" />
            <LoadingBlock className="h-10" />
          </div>
        </div>
      </div>
    </LoadingState>
  )
}

export function InboxErrorState({ onRetry }: InboxErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Inbox"
      title="Inbox unavailable"
      description="The thread index could not be projected into the current inbox view."
      onRetry={onRetry}
    />
  )
}
