"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import {
  Check,
  ChevronDown,
  Filter,
  Grid2X2,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Rows3,
  X,
} from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import { candidates as allCandidates } from "@/lib/demo-data/candidates"
import type { Candidate, CandidateProofBundle } from "@/lib/demo-data/types"
import {
  CandidateResultsEmptyState,
  CandidateResultsErrorState,
  CandidateResultsLoadingState,
} from "./CandidateResults.states"

type SortOption = "readiness" | "trust" | "freshness" | "last-active"
type ViewMode = "table" | "grid"
type FilterKey =
  | "skill"
  | "role"
  | "location"
  | "workRights"
  | "proofType"
  | "trustLevel"
  | "institution"
  | "pathwayFit"
  | "assessmentStatus"
  | "proofFreshness"

type FilterState = Record<FilterKey, string[]>

const emptyFilters: FilterState = {
  skill: [],
  role: [],
  location: [],
  workRights: [],
  proofType: [],
  trustLevel: [],
  institution: [],
  pathwayFit: [],
  assessmentStatus: [],
  proofFreshness: [],
}

const filterLabels: Record<FilterKey, string> = {
  skill: "Skill",
  role: "Role",
  location: "Location",
  workRights: "Work rights",
  proofType: "Proof type",
  trustLevel: "Trust level",
  institution: "Institution",
  pathwayFit: "Pathway fit",
  assessmentStatus: "Assessment",
  proofFreshness: "Proof freshness",
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "readiness", label: "Readiness" },
  { value: "trust", label: "Trust" },
  { value: "freshness", label: "Freshness" },
  { value: "last-active", label: "Last active" },
]

const trustRank: Record<string, number> = {
  "identity-verified": 5,
  "employer-verified": 4,
  "peer-endorsed": 3,
  "self-attested": 2,
  unverified: 1,
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function latestCandidateDate(candidate: Candidate) {
  const dates = [
    ...candidate.skills.map((skill) => skill.lastEvidence),
    ...candidate.assessmentHistory.map((assessment) => assessment.completedAt),
  ]
  return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? candidate.graduationDate
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(new Date(value))
}

function pathwayFit(candidate: Candidate) {
  if (candidate.readinessScore.score >= 85) return "strong"
  if (candidate.readinessScore.score >= 78) return "qualified"
  return "developing"
}

function assessmentStatus(candidate: Candidate) {
  if (candidate.assessmentHistory.length === 0) return "not-assessed"
  if (candidate.assessmentHistory.some((assessment) => assessment.integrityFlags > 0)) return "flagged"
  return "complete"
}

function primaryBundle(candidate: Candidate): CandidateProofBundle {
  return [...candidate.proofBundles].sort((a, b) => (trustRank[b.trustLevel] ?? 0) - (trustRank[a.trustLevel] ?? 0))[0]
}

function primaryEvidence(candidate: Candidate) {
  const skill = candidate.skills.find((item) => item.verified) ?? candidate.skills[0]
  const bundle = primaryBundle(candidate)
  return {
    label: `${skill?.name ?? bundle.role} proof`,
    proofId: bundle.id,
    detail: `${bundle.artifactCount} artifacts - ${labelize(bundle.trustLevel)}`,
  }
}

function matchExplanation(candidate: Candidate) {
  return `${candidate.name} ranks on ${candidate.skills[0]?.name ?? candidate.readinessScore.role} evidence, ${candidate.readinessScore.score}/100 readiness, and ${labelize(primaryBundle(candidate).trustLevel)} proof.`
}

function explanationDimensions(candidate: Candidate) {
  const bundle = primaryBundle(candidate)
  const verifiedSkills = candidate.skills.filter((skill) => skill.verified)
  const latestAssessment = [...candidate.assessmentHistory].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )[0]

  return [
    {
      label: "Skills",
      score: candidate.readinessScore.breakdown.skills,
      evidence: verifiedSkills.slice(0, 3).map((skill) => ({
        text: `${skill.name} verified at level ${skill.proficiency}`,
        proofId: bundle.id,
      })),
    },
    {
      label: "Proof",
      score: candidate.readinessScore.breakdown.proof,
      evidence: [
        { text: `${bundle.artifactCount} artifacts for ${bundle.role}`, proofId: bundle.id },
        { text: `${labelize(bundle.freshness)} proof bundle`, proofId: bundle.id },
      ],
    },
    {
      label: "Integrity",
      score: candidate.readinessScore.breakdown.integrity,
      evidence: [
        {
          text: latestAssessment
            ? `${latestAssessment.name}: ${latestAssessment.integrityFlags} integrity flags`
            : "No assessment integrity flags recorded",
          proofId: bundle.id,
        },
      ],
    },
    {
      label: "Depth",
      score: candidate.readinessScore.breakdown.depth,
      evidence: [
        {
          text: candidate.githubSignal
            ? `${candidate.githubSignal.shippedProjects} shipped projects, ${candidate.githubSignal.commits90d} commits in 90d`
            : `${candidate.degree} plus ${bundle.artifactCount} reviewed artifacts`,
          proofId: bundle.id,
        },
      ],
    },
  ]
}

function getFilterValues(candidate: Candidate, key: FilterKey) {
  switch (key) {
    case "skill":
      return candidate.skills.map((skill) => skill.name)
    case "role":
      return [candidate.readinessScore.role, ...candidate.proofBundles.map((bundle) => bundle.role)]
    case "location":
      return [candidate.location]
    case "workRights":
      return [candidate.workRights]
    case "proofType":
      return candidate.proofBundles.map((bundle) => bundle.role)
    case "trustLevel":
      return candidate.proofBundles.map((bundle) => bundle.trustLevel)
    case "institution":
      return [candidate.institution]
    case "pathwayFit":
      return [pathwayFit(candidate)]
    case "assessmentStatus":
      return [assessmentStatus(candidate)]
    case "proofFreshness":
      return candidate.proofBundles.map((bundle) => bundle.freshness)
    default:
      return []
  }
}

function matchesFilters(candidate: Candidate, filters: FilterState) {
  return (Object.keys(filters) as FilterKey[]).every((key) => {
    const selected = filters[key]
    if (selected.length === 0) return true
    const values = getFilterValues(candidate, key).map((value) => value.toLowerCase())
    return selected.some((value) => values.includes(value.toLowerCase()))
  })
}

function sortCandidates(candidates: Candidate[], sortOption: SortOption) {
  const sorted = [...candidates]
  switch (sortOption) {
    case "trust":
      return sorted.sort((a, b) => (trustRank[primaryBundle(b).trustLevel] ?? 0) - (trustRank[primaryBundle(a).trustLevel] ?? 0))
    case "freshness":
      return sorted.sort((a, b) => {
        const aFresh = a.proofBundles.some((bundle) => bundle.freshness === "fresh") ? 1 : 0
        const bFresh = b.proofBundles.some((bundle) => bundle.freshness === "fresh") ? 1 : 0
        return bFresh - aFresh || b.readinessScore.score - a.readinessScore.score
      })
    case "last-active":
      return sorted.sort((a, b) => new Date(latestCandidateDate(b)).getTime() - new Date(latestCandidateDate(a)).getTime())
    default:
      return sorted.sort((a, b) => b.readinessScore.score - a.readinessScore.score)
  }
}

function filterCounts(baseCandidates: Candidate[], key: FilterKey) {
  const counts = new Map<string, number>()
  baseCandidates.forEach((candidate) => {
    getFilterValues(candidate, key).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, key === "institution" ? 20 : 12)
    .map(([value, count]) => ({ value, count }))
}

function ReadinessBreakdown({ candidate }: { candidate: Candidate }) {
  const breakdown = candidate.readinessScore.breakdown
  const segments = [
    ["SK", breakdown.skills],
    ["PR", breakdown.proof],
    ["IN", breakdown.integrity],
    ["DP", breakdown.depth],
  ] as const

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-lg font-semibold tabular-nums text-text">{candidate.readinessScore.score}</span>
      <div className="grid grid-rows-4 gap-0.5" aria-label="Readiness breakdown">
        {segments.map(([label, score]) => (
          <div key={label} className="flex items-center gap-1">
            <span
              className={cx(
                "h-1.5 w-5 border border-border-strong",
                score >= 88 ? "bg-success" : score >= 78 ? "bg-accent" : score >= 68 ? "bg-warning" : "bg-danger",
              )}
            />
            <span className="font-mono text-[8px] text-text-subtle">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Avatar({ candidate }: { candidate: Candidate }) {
  const initials = candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-accent bg-surface font-mono text-[10px] font-semibold uppercase text-text">
      {initials}
    </div>
  )
}

function FilterGroup({
  filterKey,
  options,
  selected,
  onToggle,
}: {
  filterKey: FilterKey
  options: Array<{ value: string; count: number }>
  selected: string[]
  onToggle: (filterKey: FilterKey, value: string) => void
}) {
  return (
    <section className="border-b border-border pb-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">{filterLabels[filterKey]}</div>
      <div className="space-y-1">
        {options.map((option) => {
          const active = selected.includes(option.value)
          return (
            <button
              key={`${filterKey}-${option.value}`}
              type="button"
              onClick={() => onToggle(filterKey, option.value)}
              className={cx(
                "flex w-full items-center justify-between border px-2 py-1.5 text-left text-xs transition-colors",
                active
                  ? "border-accent bg-accent-muted text-text"
                  : "border-transparent text-text-muted hover:border-border hover:bg-surface-elevated hover:text-text",
              )}
            >
              <span className="truncate">{labelize(option.value)}</span>
              <span className="ml-2 font-mono text-[10px] text-text-subtle">{option.count}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LoadingRows() {
  return (
    <div className="divide-y divide-border border border-border">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[28px_minmax(220px,1.5fr)_120px_120px_130px_110px_90px_88px_144px] items-center gap-3 bg-surface-elevated px-3 py-3">
          <div className="h-4 w-4 border border-border-strong" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-border-strong bg-surface" />
            <div className="space-y-1.5">
              <div className="h-2 w-24 bg-border" />
              <div className="h-2 w-40 bg-border" />
            </div>
          </div>
          <div className="grid gap-0.5">
            <div className="h-1.5 w-10 bg-border" />
            <div className="h-1.5 w-8 bg-border" />
            <div className="h-1.5 w-9 bg-border" />
            <div className="h-1.5 w-7 bg-border" />
          </div>
          <div className="h-5 w-20 border border-border bg-surface" />
          <div className="h-5 w-24 border border-border bg-surface" />
          <div className="h-4 w-20 bg-border" />
          <div className="h-4 w-16 bg-border" />
          <div className="h-4 w-14 bg-border" />
          <div className="h-5 w-28 border border-border bg-surface" />
        </div>
      ))}
    </div>
  )
}

type CandidateResultsProps = {
  candidatesOverride?: Candidate[]
  headerStrip?: ReactNode
  title?: string
}

export function CandidateResults({ candidatesOverride, headerStrip, title = "Candidate results" }: CandidateResultsProps) {
  const {
    results,
    filters: storeFilters,
    selectedCandidates,
    openSurface,
    openCandidateDrawer,
    toggleCandidateSelection,
    setSelectedCandidates,
  } = useAgentStore()
  const [draftFilters, setDraftFilters] = useState<FilterState>(() => ({
    ...emptyFilters,
    skill: storeFilters.skills ?? [],
    workRights: storeFilters.workRights ?? [],
    location: storeFilters.location ? [storeFilters.location] : [],
    proofFreshness: storeFilters.proofFreshness ? [storeFilters.proofFreshness] : [],
  }))
  const [debouncedFilters, setDebouncedFilters] = useState(draftFilters)
  const [sortOption, setSortOption] = useState<SortOption>("readiness")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const baseResults = candidatesOverride ?? (results.length > 0 ? results : allCandidates)

  useEffect(() => {
    setIsLoading(true)
    const timeout = window.setTimeout(() => {
      setDebouncedFilters(draftFilters)
      setIsLoading(false)
    }, 220)
    return () => window.clearTimeout(timeout)
  }, [draftFilters])

  const filterOptions = useMemo(() => {
    return (Object.keys(emptyFilters) as FilterKey[]).reduce(
      (acc, key) => {
        acc[key] = filterCounts(baseResults, key)
        return acc
      },
      {} as Record<FilterKey, Array<{ value: string; count: number }>>,
    )
  }, [baseResults])

  const filteredResults = useMemo(() => {
    return sortCandidates(baseResults.filter((candidate) => matchesFilters(candidate, debouncedFilters)), sortOption)
  }, [baseResults, debouncedFilters, sortOption])

  useEffect(() => {
    setFocusedIndex((index) => Math.min(index, Math.max(filteredResults.length - 1, 0)))
  }, [filteredResults.length])

  const activeFilterChips = (Object.keys(draftFilters) as FilterKey[]).flatMap((key) =>
    draftFilters[key].map((value) => ({ key, value })),
  )

  function toggleFilter(filterKey: FilterKey, value: string) {
    setDraftFilters((current) => {
      const selected = current[filterKey]
      const nextSelected = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
      return { ...current, [filterKey]: nextSelected }
    })
  }

  function removeFilter(filterKey: FilterKey, value: string) {
    setDraftFilters((current) => ({ ...current, [filterKey]: current[filterKey].filter((item) => item !== value) }))
  }

  function openCandidate(candidateId: string) {
    openCandidateDrawer(candidateId)
  }

  function compareCandidate(candidateId: string) {
    setSelectedCandidates(Array.from(new Set([...selectedCandidates, candidateId])).slice(0, 4))
    openSurface("compare_view")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
      return
    }

    const focused = filteredResults[focusedIndex]
    if (event.key === "j") {
      event.preventDefault()
      setFocusedIndex((index) => Math.min(index + 1, filteredResults.length - 1))
    }
    if (event.key === "k") {
      event.preventDefault()
      setFocusedIndex((index) => Math.max(index - 1, 0))
    }
    if (event.key === "x" && focused) {
      event.preventDefault()
      toggleCandidateSelection(focused.id)
    }
    if (event.key === "o" && focused) {
      event.preventDefault()
      openCandidate(focused.id)
    }
    if (event.key === "c" && focused) {
      event.preventDefault()
      compareCandidate(focused.id)
    }
  }

  const selectedVisible = selectedCandidates.filter((candidateId) =>
    filteredResults.some((candidate) => candidate.id === candidateId),
  )

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={handleKeyDown} className="flex h-full min-h-0 flex-col bg-bg outline-none">
      {headerStrip}
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">{title}</div>
              <div className="font-display text-3xl uppercase leading-none text-text">{filteredResults.length} matches</div>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex h-8 items-center gap-2 border border-border px-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
              Filters
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Sort candidates</span>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="h-8 appearance-none border border-border bg-surface-elevated pl-3 pr-8 font-mono text-[10px] uppercase tracking-wide text-text outline-none focus:border-accent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-text-subtle" />
            </label>
            <div className="flex border border-border">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cx(
                  "flex h-8 w-8 items-center justify-center",
                  viewMode === "table" ? "bg-accent text-primary-foreground" : "text-text-muted hover:text-text",
                )}
                aria-label="Table view"
              >
                <Rows3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cx(
                  "flex h-8 w-8 items-center justify-center border-l border-border",
                  viewMode === "grid" ? "bg-accent text-primary-foreground" : "text-text-muted hover:text-text",
                )}
                aria-label="Grid view"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2">
          {activeFilterChips.length === 0 ? (
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">No active filters</span>
          ) : (
            activeFilterChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                onClick={() => removeFilter(chip.key, chip.value)}
                className="inline-flex items-center gap-1 border border-border bg-surface-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
              >
                {filterLabels[chip.key]}: {labelize(chip.value)}
                <X className="h-3 w-3" />
              </button>
            ))
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {filtersOpen ? (
          <aside className="w-56 shrink-0 overflow-y-auto border-r border-border bg-surface px-3 py-3 xl:w-64">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">
                <Filter className="h-3.5 w-3.5" />
                Filter drawer
              </div>
              <button
                type="button"
                onClick={() => setDraftFilters(emptyFilters)}
                className="font-mono text-[10px] uppercase tracking-wide text-text-subtle hover:text-text"
              >
                Clear
              </button>
            </div>
            <div className="space-y-3">
              {(Object.keys(emptyFilters) as FilterKey[]).map((key) => (
                <FilterGroup
                  key={key}
                  filterKey={key}
                  options={filterOptions[key] ?? []}
                  selected={draftFilters[key]}
                  onToggle={toggleFilter}
                />
              ))}
            </div>
          </aside>
        ) : null}

        <main className="relative min-w-0 flex-1 overflow-auto bg-bg">
          {selectedVisible.length > 0 ? (
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">{selectedVisible.length} selected</div>
              <div className="flex flex-wrap gap-1.5">
                {["Save to pool", "Compare", "Contact", "Launch assessment", "Move to pipeline", "Export"].map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      if (action === "Compare") openSurface("compare_view")
                      if (action === "Contact") openSurface("inbox")
                      if (action === "Save to pool") openSurface("pool_builder")
                      if (action === "Launch assessment") openSurface("assessment_launcher")
                      if (action === "Move to pipeline") openSurface("pipeline_board")
                    }}
                    className="border border-border bg-surface-elevated px-2 py-1 font-mono text-[10px] uppercase text-text-muted hover:border-border-strong hover:text-text"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <CandidateResultsErrorState
              message={error}
              onRetry={() => {
                setDraftFilters((current) => ({ ...current }))
                setDebouncedFilters((current) => ({ ...current }))
              }}
            />
          ) : isLoading ? (
            <CandidateResultsLoadingState />
          ) : filteredResults.length === 0 ? (
            <CandidateResultsEmptyState
              onClearTrustLevel={() => setDraftFilters((current) => ({ ...current, trustLevel: [] }))}
              onIncludeStaleProof={() => setDraftFilters((current) => ({ ...current, proofFreshness: [] }))}
              onRemoveLocation={() => setDraftFilters((current) => ({ ...current, location: [] }))}
            />
          ) : viewMode === "grid" ? (
            <div className="grid gap-px bg-border p-px md:grid-cols-2 2xl:grid-cols-3">
              {filteredResults.map((candidate) => {
                const evidence = primaryEvidence(candidate)
                const selected = selectedCandidates.includes(candidate.id)
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => openCandidate(candidate.id)}
                    className="bg-surface-elevated p-3 text-left hover:bg-accent-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar candidate={candidate} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-text">{candidate.name}</div>
                          <div className="line-clamp-2 text-xs text-text-muted">{candidate.headline}</div>
                        </div>
                      </div>
                      <span className={cx("border px-1.5 py-0.5 font-mono text-[10px]", selected ? "border-accent text-accent" : "border-border text-text-subtle")}>
                        {candidate.readinessScore.score}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-muted">{labelize(primaryBundle(candidate).trustLevel)}</span>
                      <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-muted">{evidence.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="min-w-[1120px] p-3">
              <div className="grid grid-cols-[28px_minmax(220px,1.5fr)_120px_120px_130px_110px_90px_88px_144px] gap-3 border border-border bg-surface px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                <span />
                <span>Candidate</span>
                <span>Readiness</span>
                <span>Trust</span>
                <span>Primary proof</span>
                <span>Work rights</span>
                <span>Location</span>
                <span>Last active</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-border border-x border-b border-border">
                {filteredResults.map((candidate, index) => {
                  const selected = selectedCandidates.includes(candidate.id)
                  const focused = focusedIndex === index
                  const expanded = expandedRows.includes(candidate.id)
                  const evidence = primaryEvidence(candidate)
                  const bundle = primaryBundle(candidate)

                  return (
                    <div key={candidate.id} className={cx("bg-surface-elevated", focused && "outline outline-1 outline-accent")}>
                      <div
                        role="button"
                        tabIndex={-1}
                        onClick={() => openCandidate(candidate.id)}
                        onMouseEnter={() => setFocusedIndex(index)}
                        className="group grid cursor-pointer grid-cols-[28px_minmax(220px,1.5fr)_120px_120px_130px_110px_90px_88px_144px] items-center gap-3 px-3 py-3 text-sm hover:bg-accent-muted"
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            toggleCandidateSelection(candidate.id)
                          }}
                          className="flex h-5 w-5 items-center justify-center border border-border-strong bg-surface text-accent"
                          aria-label={`Select ${candidate.name}`}
                        >
                          {selected ? <Check className="h-3.5 w-3.5" /> : null}
                        </button>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar candidate={candidate} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold text-text">{candidate.name}</span>
                              <span className="font-mono text-[10px] uppercase text-text-subtle">{candidate.id}</span>
                            </div>
                            <div className="truncate text-xs text-text-muted">{candidate.headline}</div>
                          </div>
                        </div>
                        <ReadinessBreakdown candidate={candidate} />
                        <span className="w-fit border border-border-strong bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-muted">
                          {labelize(bundle.trustLevel)}
                        </span>
                        <a
                          href={`#${evidence.proofId}`}
                          onClick={(event) => event.stopPropagation()}
                          className="w-fit border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-accent hover:border-accent"
                        >
                          {evidence.label}
                        </a>
                        <span className="font-mono text-[10px] uppercase text-text-muted">{labelize(candidate.workRights)}</span>
                        <span className="text-xs text-text-muted">{candidate.location}</span>
                        <span className="font-mono text-[10px] uppercase text-text-muted">{formatDate(latestCandidateDate(candidate))}</span>
                        <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openCandidate(candidate.id)
                            }}
                            className="font-mono text-[10px] uppercase text-text-subtle hover:text-text"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              compareCandidate(candidate.id)
                            }}
                            className="font-mono text-[10px] uppercase text-text-subtle hover:text-text"
                          >
                            Compare
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openSurface("pool_builder")
                            }}
                            className="font-mono text-[10px] uppercase text-text-subtle hover:text-text"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openSurface("inbox")
                            }}
                            className="font-mono text-[10px] uppercase text-text-subtle hover:text-text"
                          >
                            Contact
                          </button>
                          <button
                            type="button"
                            title={matchExplanation(candidate)}
                            onClick={(event) => {
                              event.stopPropagation()
                              setExpandedRows((current) =>
                                current.includes(candidate.id)
                                  ? current.filter((candidateId) => candidateId !== candidate.id)
                                  : [...current, candidate.id],
                              )
                            }}
                            className="ml-1 flex h-5 w-5 items-center justify-center text-text-subtle hover:text-accent"
                            aria-label={`Explain ${candidate.name} match`}
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {expanded ? (
                        <div className="border-t border-border bg-surface px-12 py-4">
                          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Match explanation</div>
                          <div className="grid gap-3 lg:grid-cols-4">
                            {explanationDimensions(candidate).map((dimension) => (
                              <div key={dimension.label} className="border border-border bg-surface-elevated p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{dimension.label}</div>
                                  <div className="font-mono text-sm font-semibold text-text">{dimension.score}</div>
                                </div>
                                <ul className="mt-3 space-y-2">
                                  {dimension.evidence.map((item) => (
                                    <li key={item.text} className="text-xs text-text-muted">
                                      <a href={`#${item.proofId}`} className="text-accent hover:underline" onClick={(event) => event.stopPropagation()}>
                                        {item.text}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
