"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type RoleBuilderEmptyStateProps = {
  onParseJd?: () => void
  onUseTemplate?: () => void
  onOpenPathway?: () => void
}

type RoleBuilderErrorStateProps = {
  onRetry?: () => void
}

export function RoleBuilderEmptyState({
  onParseJd,
  onUseTemplate,
  onOpenPathway,
}: RoleBuilderEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Role builder"
      title="No role draft loaded"
      description="Start from a job description or a known role template. The rubric and pathway surfaces depend on this context."
      actions={[
        { label: "Parse JD", onClick: onParseJd },
        { label: "Use template", onClick: onUseTemplate },
        { label: "Open pathway", onClick: onOpenPathway },
      ]}
    />
  )
}

export function RoleBuilderLoadingState() {
  return (
    <LoadingState
      eyebrow="Role builder"
      title="Parsing role context"
      description="Extracting capabilities, evidence expectations, and rubric weights from the draft job description."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-px bg-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingBlock key={index} className="h-16" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <LoadingBlock className="min-h-[360px]" />
          <div className="border border-border bg-surface-elevated p-3">
            <LoadingLine className="w-32" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingBlock key={index} className="h-16" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </LoadingState>
  )
}

export function RoleBuilderErrorState({ onRetry }: RoleBuilderErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Role builder"
      title="Role draft unavailable"
      description="The job description parse did not yield a valid capability graph."
      onRetry={onRetry}
    />
  )
}
