"use client"

import { useMemo, useState } from "react"
import { Copy, GitBranch, Pencil, Trash2, X, type LucideIcon } from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import { candidates as allCandidates } from "@/lib/demo-data/candidates"
import type { Candidate, TalentPool } from "@/lib/demo-data/types"
import {
  TalentPoolBuilderEmptyState,
  TalentPoolBuilderErrorState,
  TalentPoolBuilderLoadingState,
} from "./TalentPoolBuilder.states"
import { CandidateResults } from "./CandidateResults"

type Visibility = "private" | "team" | "org"

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function candidateById(candidateId: string) {
  return allCandidates.find((candidate) => candidate.id === candidateId)
}

function initialName(candidates: Candidate[]) {
  const topSkill = candidates[0]?.skills[0]?.name ?? "Candidate"
  const role = candidates[0]?.proofBundles[0]?.role ?? "Shortlist"
  return `${topSkill} ${role} Pool`
}

function filtersToCriteria(filters: ReturnType<typeof useAgentStore>["filters"]): TalentPool["filterCriteria"] {
  return {
    skills: filters.skills.length > 0 ? filters.skills : undefined,
    workRights: filters.workRights.length > 0 ? (filters.workRights as TalentPool["filterCriteria"]["workRights"]) : undefined,
    locations: filters.location ? [filters.location] : undefined,
    minReadinessScore: filters.minReadinessScore,
    tags: filters.proofFreshness ? [`proof-${filters.proofFreshness}`] : undefined,
  }
}

function savedQueryText(criteria: TalentPool["filterCriteria"]) {
  const parts = [
    criteria.skills?.length ? `skills in ${criteria.skills.join(", ")}` : "",
    criteria.locations?.length ? `location in ${criteria.locations.join(", ")}` : "",
    criteria.workRights?.length ? `work rights in ${criteria.workRights.map(labelize).join(", ")}` : "",
    criteria.minReadinessScore ? `readiness >= ${criteria.minReadinessScore}` : "",
    criteria.tags?.length ? `tags include ${criteria.tags.join(", ")}` : "",
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" AND ") : "current ranked result set"
}

function poolMembers(pool: TalentPool) {
  return pool.candidateIds.map(candidateById).filter(Boolean) as Candidate[]
}

function PoolHeaderStrip({
  pool,
  onRename,
  onDuplicate,
  onDelete,
  onPipeline,
}: {
  pool: TalentPool
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
  onPipeline: () => void
}) {
  return (
    <div className="border-b border-border bg-surface-elevated px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Pool detail</div>
          <div className="font-display text-3xl uppercase leading-none text-text">{pool.name}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
            {pool.candidateIds.length} members - last auto-refresh Apr 17, 2026 09:00
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([
            { label: "Rename", Icon: Pencil, action: onRename },
            { label: "Duplicate", Icon: Copy, action: onDuplicate },
            { label: "Export", Icon: GitBranch, action: () => undefined },
            { label: "Delete", Icon: Trash2, action: onDelete },
            { label: "Open in Pipeline", Icon: GitBranch, action: onPipeline },
          ] satisfies Array<{ label: string; Icon: LucideIcon; action: () => void }>).map(({ label, Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="inline-flex items-center gap-1 border border-border bg-surface px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TalentPoolBuilder() {
  const {
    selectedCandidates,
    shortlist,
    results,
    filters,
    pools,
    activePoolId,
    createPool,
    renamePool,
    duplicatePool,
    deletePool,
    setActivePool,
    setSelectedCandidates,
    openSurface,
  } = useAgentStore()

  const initialCandidateIds = useMemo(() => {
    const ids = selectedCandidates.length > 0 ? selectedCandidates : shortlist.length > 0 ? shortlist : results.slice(0, 5).map((candidate) => candidate.id)
    return Array.from(new Set(ids)).slice(0, 20)
  }, [results, selectedCandidates, shortlist])

  const initialCandidates = initialCandidateIds.map(candidateById).filter(Boolean) as Candidate[]
  const activePool = activePoolId ? pools.find((pool) => pool.id === activePoolId) : null
  const [mode, setMode] = useState<"builder" | "detail">(activePool ? "detail" : "builder")
  const [name, setName] = useState(initialName(initialCandidates))
  const [description, setDescription] = useState("Recruiter-curated pool from Aristotle command center results.")
  const [tags, setTags] = useState("high-proof, active-review")
  const [visibility, setVisibility] = useState<Visibility>("team")
  const [candidateIds, setCandidateIds] = useState(initialCandidateIds)
  const [autoAdd, setAutoAdd] = useState(true)
  const isLoading = false
  const error: string | null = null

  const criteria = filtersToCriteria(filters)
  const candidates = candidateIds.map(candidateById).filter(Boolean) as Candidate[]

  if (error) {
    return <TalentPoolBuilderErrorState onRetry={() => setCandidateIds(initialCandidateIds)} />
  }

  if (isLoading) {
    return <TalentPoolBuilderLoadingState />
  }

  function removeCandidate(candidateId: string) {
    setCandidateIds((current) => current.filter((id) => id !== candidateId))
  }

  function confirmPool() {
    if (candidateIds.length === 0) return
    createPool({
      name: name.trim() || "Saved Talent Pool",
      description: `${description.trim()} Visibility: ${visibility}. Tags: ${tags}. Auto-add: ${autoAdd ? "on" : "off"}.`,
      candidateIds,
      filterCriteria: {
        ...criteria,
        tags: Array.from(new Set([...(criteria.tags ?? []), ...tags.split(",").map((tag) => tag.trim()).filter(Boolean)])),
      },
    })
    setSelectedCandidates(candidateIds)
    setMode("detail")
  }

  if (mode === "detail" && activePool) {
    const members = poolMembers(activePool)
    return (
      <CandidateResults
        title="Talent pool results"
        candidatesOverride={members}
        headerStrip={
          <PoolHeaderStrip
            pool={activePool}
            onRename={() => {
              const next = window.prompt("Rename pool", activePool.name)
              if (next?.trim()) renamePool(activePool.id, next.trim())
            }}
            onDuplicate={() => duplicatePool(activePool.id)}
            onDelete={() => {
              deletePool(activePool.id)
              setMode("builder")
            }}
            onPipeline={() => openSurface("pipeline_board")}
          />
        }
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-text">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Talent pool builder</div>
            <div className="font-display text-3xl uppercase leading-none text-text">Save selection as a pool</div>
          </div>
          {activePool ? (
            <button
              type="button"
              onClick={() => setMode("detail")}
              className="border border-border bg-surface-elevated px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
            >
              Return to detail
            </button>
          ) : null}
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[280px_minmax(320px,1fr)_320px] overflow-hidden">
        <section className="overflow-y-auto border-r border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Pool setup</div>
          <label className="mt-4 block">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Pool name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-10 w-full border border-border bg-surface-elevated px-3 text-sm text-text outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 block">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-28 w-full resize-y border border-border bg-surface-elevated p-3 text-sm leading-6 text-text outline-none focus:border-accent"
            />
          </label>
          <label className="mt-4 block">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="mt-2 h-10 w-full border border-border bg-surface-elevated px-3 text-sm text-text outline-none focus:border-accent"
            />
          </label>
          <div className="mt-4">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Visibility</div>
            <div className="mt-2 grid grid-cols-3 gap-px bg-border">
              {(["private", "team", "org"] as Visibility[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVisibility(option)}
                  className={cx(
                    "bg-surface-elevated px-2 py-2 font-mono text-[10px] uppercase tracking-wide",
                    visibility === option ? "text-accent" : "text-text-muted hover:text-text",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto bg-bg p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Selection</div>
              <div className="text-sm font-semibold text-text">{candidates.length} candidates</div>
            </div>
            <button
              type="button"
              onClick={() => setCandidateIds(initialCandidateIds)}
              className="border border-border bg-surface px-2 py-1.5 font-mono text-[10px] uppercase text-text-muted hover:text-text"
            >
              Reset
            </button>
          </div>
          <div className="mt-4 divide-y divide-border border border-border">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="flex items-start justify-between gap-3 bg-surface-elevated p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">{candidate.name}</span>
                    <span className="font-mono text-[10px] uppercase text-text-subtle">{candidate.id}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">{candidate.headline}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-subtle">{candidate.readinessScore.score}</span>
                    <span className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-subtle">{candidate.location}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCandidate(candidate.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-text-subtle hover:text-text"
                  aria-label={`Remove ${candidate.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {candidates.length === 0 ? (
              <TalentPoolBuilderEmptyState
                onOpenResults={() => openSurface("results_table")}
                onUseShortlist={() => setCandidateIds(shortlist)}
                onOpenPipeline={() => openSurface("pipeline_board")}
              />
            ) : null}
          </div>
        </section>

        <section className="overflow-y-auto border-l border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Auto-refresh criteria</div>
          <div className="mt-4 border border-border bg-surface-elevated p-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Saved query</div>
            <p className="mt-2 text-sm leading-6 text-text">{savedQueryText(criteria)}</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoAdd((value) => !value)}
            className="mt-4 flex w-full items-center justify-between border border-border bg-surface-elevated px-3 py-3 text-left"
            aria-pressed={autoAdd}
          >
            <span>
              <span className="block text-sm font-semibold text-text">Auto-add new matching candidates</span>
              <span className="mt-1 block text-xs text-text-muted">New results matching this query join the pool automatically.</span>
            </span>
            <span className={cx("h-5 w-9 border border-border-strong p-0.5", autoAdd ? "bg-accent-muted" : "bg-surface")}>
              <span className={cx("block h-3.5 w-3.5 bg-text-subtle transition-transform", autoAdd && "translate-x-4 bg-accent")} />
            </span>
          </button>
          <div className="mt-4 grid gap-px bg-border">
            {Object.entries(criteria).map(([key, value]) =>
              value ? (
                <div key={key} className="grid grid-cols-[112px_1fr] gap-3 bg-surface-elevated px-3 py-2 text-xs">
                  <span className="font-mono uppercase text-text-subtle">{key}</span>
                  <span className="text-text-muted">{Array.isArray(value) ? value.map(String).join(", ") : String(value)}</span>
                </div>
              ) : null,
            )}
          </div>
          <button
            type="button"
            onClick={confirmPool}
            disabled={candidateIds.length === 0}
            className="mt-5 w-full border border-accent bg-accent px-3 py-3 font-mono text-[10px] uppercase tracking-wide text-primary-foreground disabled:border-border disabled:bg-surface-elevated disabled:text-text-subtle"
          >
            Confirm pool
          </button>
          {pools.length > 0 ? (
            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Saved pools</div>
              <div className="mt-2 space-y-1">
                {pools.map((pool) => (
                  <button
                    key={pool.id}
                    type="button"
                    onClick={() => {
                      setActivePool(pool.id)
                      setMode("detail")
                    }}
                    className="flex w-full items-center justify-between border border-border bg-surface-elevated px-2 py-2 text-left text-xs text-text-muted hover:border-border-strong hover:text-text"
                  >
                    <span>{pool.name}</span>
                    <span className="font-mono text-[10px] uppercase">{pool.candidateIds.length}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
