"use client"

import { EmptyState, ErrorState, LoadingBlock, LoadingLine, LoadingState } from "@/components/command-center/states"

type PathwayAuthorEmptyStateProps = {
  onSelectRole?: () => void
  onOpenRoleBuilder?: () => void
  onLoadTemplate?: () => void
}

type PathwayAuthorErrorStateProps = {
  onRetry?: () => void
}

export function PathwayAuthorEmptyState({
  onSelectRole,
  onOpenRoleBuilder,
  onLoadTemplate,
}: PathwayAuthorEmptyStateProps) {
  return (
    <EmptyState
      eyebrow="Pathway author"
      title="No role context loaded"
      description="Select a role before authoring pathway milestones. Capability mapping and evidence rules depend on that role."
      actions={[
        { label: "Select role", onClick: onSelectRole },
        { label: "Open role builder", onClick: onOpenRoleBuilder },
        { label: "Load template", onClick: onLoadTemplate },
      ]}
    />
  )
}

export function PathwayAuthorLoadingState() {
  return (
    <LoadingState
      eyebrow="Pathway author"
      title="Loading pathway draft"
      description="Hydrating milestones, capability mappings, and student preview state for the selected role."
    >
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <LoadingBlock className="h-12" />
            <LoadingBlock className="h-12" />
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingBlock key={index} className="h-48" />
          ))}
        </div>
        <div className="border border-border bg-surface-elevated p-4">
          <LoadingLine className="w-28" />
          <LoadingLine className="mt-4 w-44" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingBlock key={index} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    </LoadingState>
  )
}

export function PathwayAuthorErrorState({ onRetry }: PathwayAuthorErrorStateProps) {
  return (
    <ErrorState
      eyebrow="Pathway author"
      title="Pathway draft unavailable"
      description="The selected role could not be converted into a pathway draft."
      onRetry={onRetry}
    />
  )
}
