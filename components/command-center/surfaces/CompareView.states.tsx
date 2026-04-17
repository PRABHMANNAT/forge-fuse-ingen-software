"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type CompareViewEmptyStateProps = {
  onCompareTopThree?: () => void
  onOpenResults?: () => void
  onLoadRole?: () => void
}

type CompareViewErrorStateProps = {
  onRetry?: () => void
}

export function CompareViewEmptyState({
  onCompareTopThree,
  onOpenResults,
  onLoadRole,
}: CompareViewEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Compare view"
      title="No comparison set"
      description="Select up to five candidates or issue a compare command. Aristotle will keep the role rubric in scope."
      actions={[
        { label: "Compare top 3", onClick: onCompareTopThree },
        { label: "Open results", onClick: onOpenResults },
        { label: "Load role context", onClick: onLoadRole },
      ]}
    />
  )
}

export function CompareViewLoadingState() {
  return (
    <LoadingState
      eyebrow="Compare view"
      title="Preparing comparison matrix"
      description="Normalizing proof, integrity, work-rights, availability, and pathway fit across the selected set."
    >
      <div className="overflow-auto border border-border bg-surface-elevated">
        <div className="grid min-w-max" style={{ gridTemplateColumns: "180px repeat(4, minmax(250px, 1fr))" }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-r border-b border-border p-3">
              <LoadingLine className="w-20" />
              <LoadingLine className="mt-3 w-36" />
              <LoadingLine className="mt-3 w-16" />
            </div>
          ))}
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="contents">
              <div className="border-r border-b border-border bg-surface p-3">
                <LoadingLine className="w-24" />
              </div>
              {Array.from({ length: 4 }).map((__, columnIndex) => (
                <div key={columnIndex} className="border-r border-b border-border bg-surface-elevated p-3">
                  <LoadingBlock className="h-20" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </LoadingState>
  )
}

export function CompareViewErrorState({ onRetry }: CompareViewErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Compare view"
      title="Comparison matrix unavailable"
      description="The selected candidate set could not be ranked against the active rubric."
      onRetry={onRetry}
    />
  )
}
