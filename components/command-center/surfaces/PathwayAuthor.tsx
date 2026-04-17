"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import type { CompanyPathway, OpenRole } from "@/lib/demo-data/types"
import { PathwayAuthorEmptyState, PathwayAuthorErrorState, PathwayAuthorLoadingState } from "./PathwayAuthor.states"

type AuthorStatus = "idle" | "loading" | "saving" | "saved"
type GatingRule = "required" | "recommended"

type DraftMilestone = {
  id: string
  title: string
  capability: string
  evidenceTypes: string[]
  estimatedWeeks: number
  gatingRule: GatingRule
}

const evidenceOptions = ["artifact", "assessment", "tryout", "endorsement"]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function milestonesForRole(role: OpenRole | null): DraftMilestone[] {
  const rubric = role?.rubric ?? []
  return rubric.slice(0, 4).map((dimension, index) => ({
    id: `mile_draft_${String(index + 1).padStart(3, "0")}`,
    title: `Prove ${dimension.dimension}`,
    capability: dimension.dimension,
    evidenceTypes: dimension.evidenceExpected
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 3),
    estimatedWeeks: index === 0 ? 1 : 2,
    gatingRule: index < 2 ? "required" : "recommended",
  }))
}

function fromPathway(pathway: CompanyPathway): DraftMilestone[] {
  return pathway.milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    capability: milestone.capability,
    evidenceTypes: milestone.evidenceTypes,
    estimatedWeeks: milestone.estimatedWeeks,
    gatingRule: milestone.gatingRule ?? "recommended",
  }))
}

export function PathwayAuthor() {
  const { roles, currentRole, currentPathway, pathways, setCurrentRole, createPathway, setCurrentPathway, openSurface } = useAgentStore()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthorStatus>("loading")
  const [selectedRoleId, setSelectedRoleId] = useState(currentRole?.id ?? roles[0]?.id ?? "")
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? currentRole ?? roles[0] ?? null
  const existingPathway = useMemo(
    () => pathways.find((pathway) => pathway.id === currentPathway?.id) ?? pathways.find((pathway) => pathway.id === selectedRole?.pathwayId),
    [currentPathway?.id, pathways, selectedRole?.pathwayId],
  )
  const [title, setTitle] = useState(existingPathway?.title ?? `${selectedRole?.title ?? "Role"} Company Pathway`)
  const [milestones, setMilestones] = useState<DraftMilestone[]>(() =>
    existingPathway ? fromPathway(existingPathway) : milestonesForRole(selectedRole),
  )

  useEffect(() => {
    setStatus("loading")
    const timeout = window.setTimeout(() => {
      setTitle(existingPathway?.title ?? `${selectedRole?.title ?? "Role"} Company Pathway`)
      setMilestones(existingPathway ? fromPathway(existingPathway) : milestonesForRole(selectedRole))
      setStatus("idle")
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [existingPathway, selectedRole])

  function updateMilestone(id: string, patch: Partial<DraftMilestone>) {
    setMilestones((current) => current.map((milestone) => (milestone.id === id ? { ...milestone, ...patch } : milestone)))
  }

  function moveMilestone(index: number, direction: -1 | 1) {
    setMilestones((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function addMilestone() {
    setMilestones((current) => [
      ...current,
      {
        id: `mile_draft_${String(current.length + 1).padStart(3, "0")}`,
        title: "New pathway milestone",
        capability: selectedRole?.rubric[0]?.dimension ?? "Role capability",
        evidenceTypes: ["artifact"],
        estimatedWeeks: 1,
        gatingRule: "recommended",
      },
    ])
  }

  function savePathway() {
    if (!selectedRole || milestones.length === 0) return
    setError(null)
    setStatus("saving")
    window.setTimeout(() => {
      createPathway({
        title: title.trim() || `${selectedRole.title} Company Pathway`,
        company: selectedRole.company,
        role: selectedRole.title,
        milestones: milestones.map((milestone, index) => ({
          id: `mile_runtime_${String(index + 1).padStart(3, "0")}`,
          title: milestone.title,
          capability: milestone.capability,
          evidenceTypes: milestone.evidenceTypes,
          estimatedWeeks: milestone.estimatedWeeks,
          gatingRule: milestone.gatingRule,
          status: index === 0 ? "submitted" : "not-started",
        })),
      })
      setStatus("saved")
    }, 550)
  }

  if (error) {
    return <PathwayAuthorErrorState onRetry={() => setStatus("idle")} />
  }

  if (!selectedRole) {
    return (
      <PathwayAuthorEmptyState
        onSelectRole={() => setSelectedRoleId(roles[0]?.id ?? "")}
        onOpenRoleBuilder={() => openSurface("role_builder")}
      />
    )
  }

  if (status === "loading") {
    return <PathwayAuthorLoadingState />
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(480px,1fr)_360px] bg-bg text-text">
      <section className="flex min-h-0 flex-col border-r border-border">
        <header className="border-b border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Pathway author</div>
              <div className="font-display text-3xl uppercase leading-none text-text">Company-authored pathway</div>
            </div>
            <span
              className={cx(
                "border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
                status === "saved"
                  ? "border-success bg-success-soft text-text"
                  : status === "saving"
                    ? "border-info bg-info-soft text-text"
                    : "border-border bg-surface-elevated text-text-subtle",
              )}
            >
              {status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Idle"}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label>
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Selected role</span>
              <select
                value={selectedRoleId}
                onChange={(event) => {
                  setSelectedRoleId(event.target.value)
                  setCurrentRole(event.target.value)
                }}
                className="mt-2 h-10 w-full border border-border bg-surface-elevated px-3 text-sm text-text outline-none focus:border-accent"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.title}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Pathway title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 h-10 w-full border border-border bg-surface-elevated px-3 text-sm text-text outline-none focus:border-accent"
              />
            </label>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <article key={milestone.id} className="border border-border bg-surface-elevated p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Milestone {index + 1}</div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveMilestone(index, -1)} className="flex h-7 w-7 items-center justify-center border border-border text-text-subtle hover:text-text" aria-label="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveMilestone(index, 1)} className="flex h-7 w-7 items-center justify-center border border-border text-text-subtle hover:text-text" aria-label="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setMilestones((current) => current.filter((item) => item.id !== milestone.id))} className="flex h-7 w-7 items-center justify-center border border-border text-text-subtle hover:text-text" aria-label="Remove milestone">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Title</span>
                    <input value={milestone.title} onChange={(event) => updateMilestone(milestone.id, { title: event.target.value })} className="mt-1 h-9 w-full border border-border bg-surface px-2 text-sm text-text outline-none focus:border-accent" />
                  </label>
                  <label>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Capability mapped</span>
                    <select value={milestone.capability} onChange={(event) => updateMilestone(milestone.id, { capability: event.target.value })} className="mt-1 h-9 w-full border border-border bg-surface px-2 text-sm text-text outline-none focus:border-accent">
                      {selectedRole.rubric.map((dimension) => (
                        <option key={dimension.dimension} value={dimension.dimension}>{dimension.dimension}</option>
                      ))}
                      <option value={milestone.capability}>{milestone.capability}</option>
                    </select>
                  </label>
                  <label>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Estimated weeks</span>
                    <input type="number" min={1} value={milestone.estimatedWeeks} onChange={(event) => updateMilestone(milestone.id, { estimatedWeeks: Number(event.target.value) })} className="mt-1 h-9 w-full border border-border bg-surface px-2 font-mono text-sm text-text outline-none focus:border-accent" />
                  </label>
                  <label>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Gating rule</span>
                    <select value={milestone.gatingRule} onChange={(event) => updateMilestone(milestone.id, { gatingRule: event.target.value as GatingRule })} className="mt-1 h-9 w-full border border-border bg-surface px-2 font-mono text-[10px] uppercase text-text outline-none focus:border-accent">
                      <option value="required">Required</option>
                      <option value="recommended">Recommended</option>
                    </select>
                  </label>
                </div>
                <div className="mt-3">
                  <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Evidence accepted</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {evidenceOptions.map((evidence) => {
                      const active = milestone.evidenceTypes.includes(evidence)
                      return (
                        <button
                          key={evidence}
                          type="button"
                          onClick={() =>
                            updateMilestone(milestone.id, {
                              evidenceTypes: active ? milestone.evidenceTypes.filter((item) => item !== evidence) : [...milestone.evidenceTypes, evidence],
                            })
                          }
                          className={cx("border px-2 py-1 font-mono text-[10px] uppercase", active ? "border-accent text-text" : "border-border text-text-subtle")}
                        >
                          {evidence}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </article>
            ))}
            <button type="button" onClick={addMilestone} className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] uppercase text-text-muted hover:text-text">
              <Plus className="h-3.5 w-3.5" />
              Add milestone
            </button>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-border bg-surface px-4 py-3">
          <button
            type="button"
            onClick={savePathway}
            disabled={milestones.length === 0 || status === "saving"}
            className="border border-accent bg-accent px-3 py-3 font-mono text-[10px] uppercase tracking-wide text-primary-foreground disabled:border-border disabled:bg-surface-elevated disabled:text-text-subtle"
          >
            Save pathway
          </button>
          {status === "saved" ? (
            <button type="button" onClick={() => setCurrentPathway(pathways[pathways.length - 1]?.id ?? null)} className="border border-border px-3 py-3 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text">
              Select published pathway
            </button>
          ) : null}
        </footer>
      </section>

      <aside className="min-h-0 overflow-y-auto bg-surface p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Student preview</div>
        <h3 className="mt-2 font-display text-3xl uppercase leading-none text-text">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Sample progress state for {selectedRole?.title ?? "selected role"}.
        </p>
        <div className="mt-4 space-y-3">
          {milestones.map((milestone, index) => {
            const progress = index === 0 ? "verified" : index === 1 ? "in progress" : "missing"
            return (
              <div key={milestone.id} className="border border-border bg-surface-elevated p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text">{milestone.title}</div>
                    <div className="mt-1 text-xs leading-5 text-text-muted">{milestone.capability}</div>
                  </div>
                  <span
                    className={cx(
                      "border px-2 py-1 font-mono text-[10px] uppercase",
                      progress === "verified"
                        ? "border-success bg-success-soft text-text"
                        : progress === "in progress"
                          ? "border-info bg-info-soft text-text"
                          : "border-border bg-surface text-text-subtle",
                    )}
                  >
                    {progress}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {milestone.evidenceTypes.map((evidence) => (
                    <span key={evidence} className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-subtle">{evidence}</span>
                  ))}
                  <span className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-subtle">{milestone.estimatedWeeks}w</span>
                  <span className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-subtle">{labelize(milestone.gatingRule)}</span>
                </div>
              </div>
            )
          })}
        </div>
        {status === "saved" ? (
          <div className="mt-4 border border-success bg-success-soft p-3 text-sm text-text">
            <Check className="mr-2 inline h-4 w-4" />
            Published pathway into runtime pathway data.
          </div>
        ) : null}
      </aside>
    </div>
  )
}
