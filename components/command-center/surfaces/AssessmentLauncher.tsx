"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, CalendarClock, Check, ChevronDown, Send, ShieldCheck } from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import { candidates as allCandidates } from "@/lib/demo-data/candidates"
import type { Candidate, OpenRole, TalentPool } from "@/lib/demo-data/types"
import {
  AssessmentLauncherEmptyState,
  AssessmentLauncherErrorState,
  AssessmentLauncherLoadingState,
} from "./AssessmentLauncher.states"

type AssessmentType = "screener" | "simulation" | "tryout"
type TargetMode = "shortlist" | "specific" | "pool"
type LauncherStatus = "draft" | "sending" | "sent"
type TrackerStatus = "sent" | "opened" | "in-progress" | "submitted" | "scored"

type TrackerRow = {
  candidateId: string
  status: TrackerStatus
  assessmentName: string
  integrityFlags: number
  score?: number
}

const assessmentTypes: Array<{ id: AssessmentType; label: string; duration: string; detail: string }> = [
  { id: "screener", label: "Screener", duration: "30 min", detail: "Fast capability validation for recruiter-stage proof review." },
  { id: "simulation", label: "Simulation", duration: "2h", detail: "Role-realistic work sample mapped to the active rubric." },
  { id: "tryout", label: "Tryout project", duration: "Paid, 3-5 days", detail: "Compensated late-stage proof project with explicit outcome review." },
]

const trackerStatuses: TrackerStatus[] = ["sent", "opened", "in-progress", "submitted", "scored"]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function byId(candidateId: string) {
  return allCandidates.find((candidate) => candidate.id === candidateId)
}

function initials(candidate: Candidate) {
  return candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function unique(ids: string[]) {
  return Array.from(new Set(ids)).filter(Boolean)
}

function assessmentName(type: AssessmentType, role: OpenRole | null) {
  const roleTitle = role?.title ?? "Open role"
  if (type === "screener") return `${roleTitle} capability screener`
  if (type === "tryout") return `${roleTitle} paid tryout project`
  return `${roleTitle} role simulation`
}

function targetCandidates(mode: TargetMode, ids: string[], poolId: string, pools: TalentPool[]) {
  const targetIds = mode === "pool" ? pools.find((pool) => pool.id === poolId)?.candidateIds ?? [] : ids
  return unique(targetIds).map(byId).filter(Boolean) as Candidate[]
}

function makeRows(candidates: Candidate[], type: AssessmentType, role: OpenRole | null): TrackerRow[] {
  return candidates.map((candidate, index) => {
    const latestAssessment = candidate.assessmentHistory[0]
    const status = trackerStatuses[Math.min(index, trackerStatuses.length - 1)]
    return {
      candidateId: candidate.id,
      status,
      assessmentName: assessmentName(type, role),
      integrityFlags: latestAssessment?.integrityFlags ?? (index % 4 === 0 ? 1 : 0),
      score: status === "scored" ? latestAssessment?.score ?? Math.max(70, candidate.readinessScore.score - 5) : undefined,
    }
  })
}

function StatusBadge({ status }: { status: LauncherStatus }) {
  return (
    <span
      className={cx(
        "border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
        status === "sent"
          ? "border-success bg-success-soft text-text"
          : status === "sending"
            ? "border-info bg-info-soft text-text"
            : "border-border bg-surface-elevated text-text-subtle",
      )}
    >
      {status}
    </span>
  )
}

function ChoiceCard({
  active,
  onClick,
  title,
  meta,
  detail,
}: {
  active: boolean
  onClick: () => void
  title: string
  meta?: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "border p-3 text-left",
        active ? "border-accent bg-accent-muted" : "border-border bg-surface-elevated hover:border-border-strong",
      )}
    >
      <span className="block text-sm font-semibold text-text">{title}</span>
      {meta ? <span className="mt-1 block font-mono text-[10px] uppercase text-text-subtle">{meta}</span> : null}
      <span className="mt-2 block text-xs leading-5 text-text-muted">{detail}</span>
    </button>
  )
}

function CandidatePick({
  candidate,
  selected,
  onToggle,
}: {
  candidate: Candidate
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cx(
        "flex items-center gap-2 border px-2 py-2 text-left",
        selected ? "border-accent bg-accent-muted" : "border-border bg-surface-elevated hover:border-border-strong",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-strong bg-surface font-mono text-[10px] uppercase text-text-muted">
        {initials(candidate)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-text">{candidate.name}</span>
        <span className="block truncate font-mono text-[10px] uppercase text-text-subtle">{candidate.id}</span>
      </span>
    </button>
  )
}

function RubricBox({ role }: { role: OpenRole | null }) {
  return (
    <div className="border border-border bg-surface-elevated">
      <div className="border-b border-border p-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Rubric pulled from role</div>
        <div className="mt-1 text-sm font-semibold text-text">{role?.title ?? "No active role loaded"}</div>
      </div>
      {role?.rubric.length ? (
        <div className="divide-y divide-border">
          {role.rubric.map((item) => (
            <div key={item.dimension} className="grid grid-cols-[1fr_56px] gap-3 p-3">
              <div>
                <div className="text-sm font-semibold text-text">{item.dimension}</div>
                <div className="mt-1 text-xs leading-5 text-text-muted">{item.evidenceExpected}</div>
              </div>
              <div className="self-start border border-border bg-surface px-2 py-1 text-center font-mono text-[10px] uppercase text-text-subtle">
                {item.weight}%
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 text-sm leading-6 text-text-muted">Select or create a role to bind assessment criteria.</div>
      )}
    </div>
  )
}

function InvitationPreview({
  type,
  role,
  deadline,
  candidates,
  proctoring,
  tabSwitchDetection,
  compensationAud,
}: {
  type: AssessmentType
  role: OpenRole | null
  deadline: string
  candidates: Candidate[]
  proctoring: boolean
  tabSwitchDetection: boolean
  compensationAud: number
}) {
  return (
    <div className="border border-border bg-surface-elevated p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Candidate-facing invitation</div>
      <div className="mt-3 border border-border bg-surface p-3">
        <div className="font-mono text-[10px] uppercase text-text-subtle">Subject</div>
        <p className="mt-1 text-sm font-semibold text-text">iNGEN assessment invitation: {assessmentName(type, role)}</p>
        <div className="mt-4 font-mono text-[10px] uppercase text-text-subtle">Body</div>
        <p className="mt-1 text-sm leading-6 text-text-muted">
          Hi {"{candidate_first_name}"}, Aristotle matched your proof portfolio to {role?.company ?? "the hiring team"} for{" "}
          {role?.title ?? "the active role"}. This assessment verifies work evidence against the role rubric.
        </p>
        <div className="mt-3 grid gap-px bg-border md:grid-cols-2">
          <div className="bg-surface-elevated p-2">
            <div className="font-mono text-[10px] uppercase text-text-subtle">Deadline</div>
            <div className="mt-1 text-xs font-semibold text-text">{deadline}</div>
          </div>
          <div className="bg-surface-elevated p-2">
            <div className="font-mono text-[10px] uppercase text-text-subtle">Integrity</div>
            <div className="mt-1 text-xs font-semibold text-text">
              {proctoring ? "Proctoring on" : "Proctoring off"} / {tabSwitchDetection ? "tab-switch on" : "tab-switch off"}
            </div>
          </div>
          {type === "tryout" ? (
            <div className="bg-surface-elevated p-2 md:col-span-2">
              <div className="font-mono text-[10px] uppercase text-text-subtle">Compensation</div>
              <div className="mt-1 text-xs font-semibold text-text">${compensationAud} AUD paid tryout honorarium</div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-subtle">
          {candidates.length} recipients
        </span>
        <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-subtle">
          {role?.rubric.length ?? 0} rubric dimensions
        </span>
      </div>
    </div>
  )
}

function StatusSteps({ status }: { status: TrackerStatus }) {
  const activeIndex = trackerStatuses.indexOf(status)
  return (
    <div className="grid grid-cols-5 gap-px bg-border">
      {trackerStatuses.map((step, index) => (
        <div key={step} className="bg-surface px-2 py-1.5">
          <div className={cx("mx-auto h-2 w-2 border border-border-strong", index <= activeIndex ? "bg-accent" : "bg-surface-elevated")} />
          <div className="mt-1 text-center font-mono text-[9px] uppercase leading-tight text-text-subtle">{labelize(step)}</div>
        </div>
      ))}
    </div>
  )
}

function TrackerView({
  rows,
  role,
  onOpenHistory,
  onReturn,
}: {
  rows: TrackerRow[]
  role: OpenRole | null
  onOpenHistory: (candidateId: string) => void
  onReturn: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-text">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Assessment tracker</div>
            <div className="font-display text-3xl uppercase leading-none text-text">{role?.title ?? "Assessment launch"}</div>
          </div>
          <button type="button" onClick={onReturn} className="border border-border bg-surface-elevated px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text">
            Return to draft
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid gap-px bg-border md:grid-cols-5">
          {trackerStatuses.map((status) => (
            <div key={status} className="bg-surface-elevated p-3">
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{labelize(status)}</div>
              <div className="mt-2 font-display text-4xl uppercase leading-none text-text">{rows.filter((row) => row.status === status).length}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 border border-border">
          <div className="grid grid-cols-[1.35fr_1fr_120px_124px_140px] gap-3 border-b border-border bg-surface px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
            <div>Candidate</div>
            <div>Assessment</div>
            <div>Status</div>
            <div>Integrity</div>
            <div>History</div>
          </div>
          <div className="divide-y divide-border">
            {rows.map((row) => {
              const candidate = byId(row.candidateId)
              if (!candidate) return null
              return (
                <div key={row.candidateId} className="grid grid-cols-[1.35fr_1fr_120px_124px_140px] items-center gap-3 bg-surface-elevated px-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-strong bg-surface font-mono text-[10px] uppercase text-text-muted">{initials(candidate)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text">{candidate.name}</span>
                        <span className="block truncate font-mono text-[10px] uppercase text-text-subtle">{candidate.id}</span>
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-text">{row.assessmentName}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">Sent Apr 17, 2026</div>
                  </div>
                  <div>
                    <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-muted">{labelize(row.status)}</span>
                    {row.score ? (
                      <div className="mt-1 inline-flex border border-success bg-success-soft px-2 py-1 font-mono text-[10px] uppercase text-text">
                        Score {row.score}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <span
                      className={cx(
                        "inline-flex items-center gap-1 border px-2 py-1 font-mono text-[10px] uppercase",
                        row.integrityFlags > 0
                          ? "border-warning bg-warning-soft text-text"
                          : "border-success bg-success-soft text-text",
                      )}
                    >
                      {row.integrityFlags > 0 ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                      {row.integrityFlags} flags
                    </span>
                  </div>
                  <button type="button" onClick={() => onOpenHistory(candidate.id)} className="border border-border bg-surface px-2 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text">
                    Open history
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {rows.slice(0, 4).map((row) => {
            const candidate = byId(row.candidateId)
            if (!candidate) return null
            return (
              <div key={`${row.candidateId}-steps`} className="border border-border bg-surface-elevated p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-text">{candidate.name}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">{candidate.id}</div>
                  </div>
                  <span className="font-mono text-[10px] uppercase text-text-subtle">{labelize(row.status)}</span>
                </div>
                <div className="mt-3"><StatusSteps status={row.status} /></div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export function AssessmentLauncher() {
  const { selectedCandidates, shortlist, results, pools, activePoolId, currentRole, openCandidateDrawer } = useAgentStore()
  const [error, setError] = useState<string | null>(null)
  const baseIds = useMemo(() => {
    const ids = selectedCandidates.length > 0 ? selectedCandidates : shortlist.length > 0 ? shortlist : results.slice(0, 5).map((candidate) => candidate.id)
    return unique(ids).slice(0, 8)
  }, [results, selectedCandidates, shortlist])
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("simulation")
  const [targetMode, setTargetMode] = useState<TargetMode>(selectedCandidates.length > 0 ? "specific" : "shortlist")
  const [selectedIds, setSelectedIds] = useState(baseIds)
  const [poolId, setPoolId] = useState(activePoolId ?? pools[0]?.id ?? "")
  const [deadline, setDeadline] = useState("2026-04-24")
  const [proctoring, setProctoring] = useState(true)
  const [tabSwitchDetection, setTabSwitchDetection] = useState(true)
  const [compensationAud, setCompensationAud] = useState(150)
  const [status, setStatus] = useState<LauncherStatus>("draft")
  const [rows, setRows] = useState<TrackerRow[]>([])
  const [mode, setMode] = useState<"launcher" | "tracker">("launcher")

  const candidates = useMemo(() => targetCandidates(targetMode, selectedIds, poolId, pools), [pools, poolId, selectedIds, targetMode])
  const availableCandidates = useMemo(() => {
    const ranked = results.length > 0 ? results : allCandidates
    return unique([...ranked.map((candidate) => candidate.id), ...baseIds, ...allCandidates.map((candidate) => candidate.id)])
      .map(byId)
      .filter(Boolean) as Candidate[]
  }, [baseIds, results])
  const selectedPool = pools.find((pool) => pool.id === poolId)
  const selectedType = assessmentTypes.find((type) => type.id === assessmentType) ?? assessmentTypes[0]

  function toggleCandidate(candidateId: string) {
    setSelectedIds((current) => (current.includes(candidateId) ? current.filter((id) => id !== candidateId) : [...current, candidateId]))
  }

  function sendAssessment() {
    if (candidates.length === 0 || status === "sending") return
    setError(null)
    setStatus("sending")
    window.setTimeout(() => {
      setRows(makeRows(candidates, assessmentType, currentRole))
      setStatus("sent")
      setMode("tracker")
    }, 650)
  }

  function openHistory(candidateId: string) {
    openCandidateDrawer(candidateId)
    window.setTimeout(() => {
      document.getElementById("assessment-history")?.scrollIntoView({ block: "start" })
    }, 160)
  }

  if (mode === "tracker") {
    return (
      <TrackerView
        rows={rows}
        role={currentRole}
        onOpenHistory={openHistory}
        onReturn={() => {
          setMode("launcher")
          setStatus("draft")
        }}
      />
    )
  }

  if (error) {
    return <AssessmentLauncherErrorState onRetry={() => setStatus("draft")} />
  }

  if (status === "sending") {
    return <AssessmentLauncherLoadingState />
  }

  if (candidates.length === 0) {
    return (
      <AssessmentLauncherEmptyState
        onUseShortlist={() => setTargetMode("shortlist")}
        onSelectCandidates={() => setTargetMode("specific")}
        onOpenPools={() => setTargetMode("pool")}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-text">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Assessment launcher</div>
            <div className="font-display text-3xl uppercase leading-none text-text">Launch proof assessment</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="border border-border bg-surface-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
              {candidates.length} targets
            </span>
          </div>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[280px_minmax(360px,1fr)_340px] overflow-hidden">
        <section className="overflow-y-auto border-r border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Assessment type</div>
          <div className="mt-3 grid gap-2">
            {assessmentTypes.map((type) => (
              <ChoiceCard key={type.id} active={assessmentType === type.id} onClick={() => setAssessmentType(type.id)} title={type.label} meta={type.duration} detail={type.detail} />
            ))}
          </div>

          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Target</div>
          <div className="mt-3 grid gap-2">
            <ChoiceCard active={targetMode === "shortlist"} onClick={() => setTargetMode("shortlist")} title="Current shortlist" detail={`${baseIds.length} candidates from the active shortlist and ranked results.`} />
            <ChoiceCard active={targetMode === "specific"} onClick={() => setTargetMode("specific")} title="Specific candidates" detail="Pick exact recipients from the current ranked set." />
            <ChoiceCard active={targetMode === "pool"} onClick={() => setTargetMode("pool")} title="Talent pool" detail={selectedPool ? `${selectedPool.name}, ${selectedPool.candidateIds.length} members.` : "Select a saved talent pool."} />
          </div>
          {targetMode === "pool" ? (
            <label className="relative mt-3 block">
              <span className="sr-only">Talent pool</span>
              <select value={poolId} onChange={(event) => setPoolId(event.target.value)} className="h-10 w-full appearance-none border border-border bg-surface-elevated pl-3 pr-8 font-mono text-[10px] uppercase tracking-wide text-text outline-none focus:border-accent">
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>{pool.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-text-subtle" />
            </label>
          ) : null}
        </section>

        <section className="min-h-0 overflow-y-auto bg-bg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Configure</div>
              <h2 className="font-display text-4xl uppercase leading-none text-text">{selectedType.label}</h2>
            </div>
            <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-subtle">{selectedType.duration}</span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Deadline</span>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className="mt-2 h-10 w-full border border-border bg-surface-elevated px-3 font-mono text-xs uppercase text-text outline-none focus:border-accent"
                  />
                </label>
                {assessmentType === "tryout" ? (
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Compensation</span>
                    <div className="mt-2 grid grid-cols-[1fr_64px]">
                      <input
                        type="number"
                        min={0}
                        value={compensationAud}
                        onChange={(event) => setCompensationAud(Number(event.target.value))}
                        className="h-10 border border-border bg-surface-elevated px-3 font-mono text-xs uppercase text-text outline-none focus:border-accent"
                      />
                      <span className="flex h-10 items-center justify-center border-y border-r border-border bg-surface font-mono text-[10px] uppercase text-text-subtle">
                        AUD
                      </span>
                    </div>
                  </label>
                ) : (
                  <div className="border border-border bg-surface-elevated p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Compensation</div>
                    <div className="mt-2 text-sm font-semibold text-text">Not required for {selectedType.label.toLowerCase()}</div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setProctoring((value) => !value)}
                  aria-pressed={proctoring}
                  className={cx("flex items-start gap-3 border p-3 text-left", proctoring ? "border-accent bg-accent-muted" : "border-border bg-surface-elevated hover:border-border-strong")}
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-text-subtle" />
                  <span>
                    <span className="block text-sm font-semibold text-text">Proctoring {proctoring ? "on" : "off"}</span>
                    <span className="mt-1 block text-xs leading-5 text-text-muted">Identity and session checks are recorded with the submission.</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTabSwitchDetection((value) => !value)}
                  aria-pressed={tabSwitchDetection}
                  className={cx("flex items-start gap-3 border p-3 text-left", tabSwitchDetection ? "border-accent bg-accent-muted" : "border-border bg-surface-elevated hover:border-border-strong")}
                >
                  <CalendarClock className="mt-0.5 h-4 w-4 text-text-subtle" />
                  <span>
                    <span className="block text-sm font-semibold text-text">Tab-switch detection {tabSwitchDetection ? "on" : "off"}</span>
                    <span className="mt-1 block text-xs leading-5 text-text-muted">Integrity flags stay visible without blocking submission.</span>
                  </span>
                </button>
              </div>

              {targetMode === "specific" ? (
                <div className="border border-border bg-surface p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Specific recipients</div>
                      <div className="mt-1 text-sm font-semibold text-text">{selectedIds.length} selected</div>
                    </div>
                    <button type="button" onClick={() => setSelectedIds(baseIds)} className="border border-border bg-surface-elevated px-2 py-1.5 font-mono text-[10px] uppercase text-text-muted hover:text-text">
                      Reset
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {availableCandidates.slice(0, 12).map((candidate) => (
                      <CandidatePick key={candidate.id} candidate={candidate} selected={selectedIds.includes(candidate.id)} onToggle={() => toggleCandidate(candidate.id)} />
                    ))}
                  </div>
                </div>
              ) : null}

              <RubricBox role={currentRole} />
            </div>

            <div className="space-y-4">
              <div className="border border-border bg-surface-elevated p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Launch queue</div>
                <div className="mt-3 divide-y divide-border border border-border">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-start gap-2 bg-surface px-2 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border-strong bg-surface-elevated font-mono text-[10px] uppercase text-text-muted">
                        {initials(candidate)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-text">{candidate.name}</span>
                        <span className="block truncate font-mono text-[10px] uppercase text-text-subtle">{candidate.readinessScore.score} readiness</span>
                      </span>
                    </div>
                  ))}
                  {candidates.length === 0 ? <div className="bg-surface p-3 text-sm leading-6 text-text-muted">No recipients selected.</div> : null}
                </div>
              </div>
              <InvitationPreview
                type={assessmentType}
                role={currentRole}
                deadline={deadline}
                candidates={candidates}
                proctoring={proctoring}
                tabSwitchDetection={tabSwitchDetection}
                compensationAud={compensationAud}
              />
            </div>
          </div>
        </section>

        <section className="overflow-y-auto border-l border-border bg-surface p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Review</div>
          <div className="mt-3 grid gap-px bg-border">
            {[
              ["Type", selectedType.label],
              ["Duration", selectedType.duration],
              ["Target", targetMode === "pool" ? selectedPool?.name ?? "Talent pool" : labelize(targetMode)],
              ["Recipients", String(candidates.length)],
              ["Deadline", deadline],
              ["Role", currentRole?.title ?? "No role context"],
              ["Integrity", `${proctoring ? "proctoring" : "no proctoring"} / ${tabSwitchDetection ? "tab-switch" : "no tab-switch"}`],
              ["Compensation", assessmentType === "tryout" ? `$${compensationAud} AUD` : "Not applicable"],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[112px_1fr] gap-3 bg-surface-elevated px-3 py-2 text-xs">
                <span className="font-mono uppercase text-text-subtle">{label}</span>
                <span className="text-text-muted">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border border-border bg-surface-elevated p-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Pre-send checks</div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-text-muted">
              {[
                "Rubric dimensions travel with each invitation.",
                "Integrity settings are attached to tracker rows.",
                "Candidate tracker rows link back to assessment history.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={sendAssessment}
            disabled={candidates.length === 0}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-accent bg-accent px-3 py-3 font-mono text-[10px] uppercase tracking-wide text-primary-foreground disabled:border-border disabled:bg-surface-elevated disabled:text-text-subtle"
          >
            <Send className="h-3.5 w-3.5" />
            Send assessment
          </button>
        </section>
      </main>
    </div>
  )
}
