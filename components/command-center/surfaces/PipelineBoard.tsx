"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronDown, CircleArrowRight } from "lucide-react"
import { DISABLED_TRANSITION, PIPELINE_SETTLE_TRANSITION, surfaceMotion } from "@/components/command-center/motion"
import { useAgentStore } from "@/lib/agent/store"
import { candidates as allCandidates } from "@/lib/demo-data/candidates"
import type { Candidate, OpenRole, PipelineStage, TrustLevel } from "@/lib/demo-data/types"
import { PipelineBoardEmptyState, PipelineBoardErrorState, PipelineBoardLoadingState } from "./PipelineBoard.states"

type Stage = Exclude<PipelineStage, null>
type FormMode = "offer" | "reject" | null
type OfferDraft = { startDate: string; note: string }
type RejectDraft = { reason: string; nurture: boolean }

const STAGES: Stage[] = ["new", "contacted", "responded", "assessment", "tryout", "interview", "offer", "hired", "nurture", "rejected"]

const SLA_TARGETS: Record<Stage, number> = {
  new: 2,
  contacted: 3,
  responded: 4,
  assessment: 6,
  tryout: 7,
  interview: 5,
  offer: 6,
  hired: 3,
  nurture: 14,
  rejected: 2,
}

const NEXT_ACTIONS: Record<Stage, string> = {
  new: "Review proof",
  contacted: "Send follow-up",
  responded: "Book screen",
  assessment: "Check submission",
  tryout: "Review delivery",
  interview: "Panel decision",
  offer: "Close loop",
  hired: "Prepare start",
  nurture: "Re-engage in 14d",
  rejected: "Archive notes",
}

const REFERENCE_DATE = new Date("2026-04-17T12:00:00Z")

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function initials(candidate: Candidate) {
  return candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function roleMatchScore(candidate: Candidate, role: OpenRole) {
  const corpus = [
    candidate.headline,
    candidate.readinessScore.role,
    candidate.tags.join(" "),
    candidate.skills.map((skill) => skill.name).join(" "),
    candidate.proofBundles.map((bundle) => bundle.role).join(" "),
  ]
    .join(" ")
    .toLowerCase()

  const terms = Array.from(
    new Set(
      [role.title, ...role.stack, ...role.mustHaves, ...role.niceToHaves, ...role.rubric.map((item) => item.dimension)]
        .join(" ")
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .filter((term) => term.length > 2),
    ),
  )

  return terms.reduce((total, term) => total + (corpus.includes(term) ? 1 : 0), 0)
}

function currentStage(candidate: Candidate, pipeline: Record<string, Stage>): Stage {
  return pipeline[candidate.id] ?? candidate.pipelineStage ?? "new"
}

function trustLevel(candidate: Candidate): TrustLevel {
  return candidate.proofBundles[0]?.trustLevel ?? "unverified"
}

function trustTone(level: TrustLevel) {
  if (level === "identity-verified" || level === "employer-verified") return "border-success bg-success-soft text-text"
  if (level === "peer-endorsed") return "border-info bg-info-soft text-text"
  if (level === "self-attested") return "border-warning bg-warning-soft text-text"
  return "border-border bg-surface text-text-subtle"
}

function latestActivity(candidate: Candidate) {
  const dates = [
    ...candidate.skills.map((skill) => skill.lastEvidence),
    ...candidate.assessmentHistory.map((assessment) => assessment.completedAt),
    candidate.graduationDate,
  ].map((value) => new Date(value))

  return dates.sort((a, b) => b.getTime() - a.getTime())[0] ?? REFERENCE_DATE
}

function daysInStage(candidate: Candidate, stage: Stage) {
  const activityDays = Math.max(1, Math.round((REFERENCE_DATE.getTime() - latestActivity(candidate).getTime()) / 86400000))
  const stageBias: Record<Stage, number> = { new: 1, contacted: 2, responded: 3, assessment: 4, tryout: 5, interview: 4, offer: 3, hired: 1, nurture: 11, rejected: 2 }
  const idBias = Number(candidate.id.split("_")[1] ?? "0") % 4
  const cap = stage === "nurture" ? 28 : 16
  return Math.min(cap, Math.max(1, Math.round(activityDays / 2) + stageBias[stage] + idBias))
}

function slaTone(avgDays: number, target: number) {
  if (avgDays <= target) return "border-success bg-success-soft text-text"
  if (avgDays <= target + 2) return "border-warning bg-warning-soft text-text"
  return "border-danger bg-danger-soft text-text"
}

function CandidateCard({
  candidate,
  stage,
  moved,
  onOpen,
  onMove,
}: {
  candidate: Candidate
  stage: Stage
  moved: boolean
  onOpen: () => void
  onMove: (stage: Stage) => void
}) {
  const shouldReduceMotion = Boolean(useReducedMotion())
  const [mode, setMode] = useState<FormMode>(null)
  const [offerDraft, setOfferDraft] = useState<OfferDraft>({ startDate: "2026-05-03", note: "Paid offer draft ready for approval." })
  const [rejectDraft, setRejectDraft] = useState<RejectDraft>({ reason: "", nurture: false })
  const readiness = candidate.readinessScore.score
  const trust = trustLevel(candidate)
  const age = daysInStage(candidate, stage)

  return (
    <motion.article
      initial={false}
      animate={shouldReduceMotion || !moved ? { y: 0, opacity: 1 } : { y: [4, 0], opacity: [0.9, 1] }}
      transition={shouldReduceMotion ? DISABLED_TRANSITION : PIPELINE_SETTLE_TRANSITION}
      className={cx(
        "border bg-surface-elevated p-3",
        moved ? "border-accent" : "border-border hover:border-border-strong",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={onOpen} className="flex items-center gap-2 text-left">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-strong bg-surface font-mono text-[10px] uppercase text-text-muted">
              {initials(candidate)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-text">{candidate.name}</div>
              <div className="truncate font-mono text-[10px] uppercase text-text-subtle">{candidate.id}</div>
            </div>
          </button>
          <div className="mt-2 line-clamp-2 text-xs leading-5 text-text-muted">{candidate.headline}</div>
        </div>
        <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-subtle">{readiness}</span>
      </div>

      <div className="mt-3 grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-surface p-2">
          <div className="font-mono text-[10px] uppercase text-text-subtle">Days in stage</div>
          <div className="mt-1 text-sm font-semibold text-text">{age}</div>
        </div>
        <div className="bg-surface p-2">
          <div className="font-mono text-[10px] uppercase text-text-subtle">Next action</div>
          <div className="mt-1 text-sm font-semibold text-text">{NEXT_ACTIONS[stage]}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={cx("border px-2 py-1 font-mono text-[10px] uppercase", trustTone(trust))}>{labelize(trust)}</span>
        <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-subtle">{candidate.location}</span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2" onClick={(event) => event.stopPropagation()}>
        <label className="relative">
          <span className="sr-only">Move candidate</span>
          <select
            value={stage}
            onChange={(event) => onMove(event.target.value as Stage)}
            className="h-9 w-full appearance-none border border-border bg-surface pl-3 pr-8 font-mono text-[10px] uppercase tracking-wide text-text outline-none focus:border-accent"
          >
            {STAGES.map((option) => (
              <option key={option} value={option}>{labelize(option)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-text-subtle" />
        </label>
        <button
          type="button"
          onClick={() => setMode(mode === "offer" ? null : "offer")}
          aria-expanded={mode === "offer"}
          aria-controls={`pipeline-offer-${candidate.id}`}
          className="border border-border bg-surface px-2 py-2 font-mono text-[10px] uppercase text-text-muted hover:text-text"
        >
          Offer
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "reject" ? null : "reject")}
          aria-expanded={mode === "reject"}
          aria-controls={`pipeline-reject-${candidate.id}`}
          className="border border-border bg-surface px-2 py-2 font-mono text-[10px] uppercase text-text-muted hover:text-text"
        >
          Reject
        </button>
      </div>

      <AnimatePresence initial={false}>
        {mode === "offer" ? (
          <motion.div
            key="offer"
            {...surfaceMotion(shouldReduceMotion)}
            className="overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div id={`pipeline-offer-${candidate.id}`} className="mt-3 border border-border bg-surface p-3">
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Offer form</div>
              <div className="mt-3 grid gap-3">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase text-text-subtle">Target start date</span>
                  <input
                    type="date"
                    value={offerDraft.startDate}
                    onChange={(event) => setOfferDraft((current) => ({ ...current, startDate: event.target.value }))}
                    className="mt-2 h-9 w-full border border-border bg-surface-elevated px-3 font-mono text-[10px] uppercase text-text outline-none focus:border-accent"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase text-text-subtle">Notes</span>
                  <textarea
                    value={offerDraft.note}
                    onChange={(event) => setOfferDraft((current) => ({ ...current, note: event.target.value }))}
                    className="mt-2 min-h-20 w-full resize-y border border-border bg-surface-elevated p-3 text-sm leading-6 text-text outline-none focus:border-accent"
                  />
                </label>
                <button type="button" onClick={() => { onMove("offer"); setMode(null) }} className="border border-accent bg-accent px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-primary-foreground">
                  Save offer stage
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}

        {mode === "reject" ? (
          <motion.div
            key="reject"
            {...surfaceMotion(shouldReduceMotion)}
            className="overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div id={`pipeline-reject-${candidate.id}`} className="mt-3 border border-border bg-surface p-3">
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Reject form</div>
              <label className="mt-3 block">
                <span className="font-mono text-[10px] uppercase text-text-subtle">Reason</span>
                <textarea
                  value={rejectDraft.reason}
                  onChange={(event) => setRejectDraft((current) => ({ ...current, reason: event.target.value }))}
                  className="mt-2 min-h-20 w-full resize-y border border-border bg-surface-elevated p-3 text-sm leading-6 text-text outline-none focus:border-accent"
                  placeholder="Missing role proof, timing, or team fit notes."
                />
              </label>
              <button
                type="button"
                onClick={() => setRejectDraft((current) => ({ ...current, nurture: !current.nurture }))}
                aria-pressed={rejectDraft.nurture}
                className="mt-3 flex w-full items-center justify-between border border-border bg-surface-elevated px-3 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-text">Move to nurture instead</span>
                  <span className="mt-1 block text-xs text-text-muted">Keep the candidate warm with the rejection reason attached.</span>
                </span>
                <span className={cx("h-5 w-9 border border-border-strong p-0.5", rejectDraft.nurture ? "bg-accent-muted" : "bg-surface")}>
                  <span className={cx("block h-3.5 w-3.5 bg-text-subtle transition-transform", rejectDraft.nurture && "translate-x-4 bg-accent")} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => { onMove(rejectDraft.nurture ? "nurture" : "rejected"); setMode(null) }}
                className="mt-3 w-full border border-accent bg-accent px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-primary-foreground"
              >
                Save {rejectDraft.nurture ? "nurture" : "rejected"} stage
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  )
}

function Column({
  stage,
  candidates,
  movedIds,
  onOpen,
  onMove,
}: {
  stage: Stage
  candidates: Candidate[]
  movedIds: string[]
  onOpen: (candidateId: string) => void
  onMove: (candidateIds: string[], stage: Stage) => void
}) {
  const avgDays = candidates.length > 0 ? candidates.reduce((total, candidate) => total + daysInStage(candidate, stage), 0) / candidates.length : 0
  const target = SLA_TARGETS[stage]

  return (
    <section className="flex h-full min-h-0 w-[290px] shrink-0 flex-col border border-border bg-surface">
      <header className="border-b border-border bg-surface-elevated p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">{labelize(stage)}</div>
            <div className="mt-1 text-2xl font-semibold leading-none text-text">{candidates.length}</div>
          </div>
          <div className={cx("border px-2 py-1 text-right font-mono text-[10px] uppercase tracking-wide", slaTone(avgDays, target))}>
            <div>{avgDays > 0 ? `${Math.round(avgDays)}d avg` : "0d avg"}</div>
            <div>target {target}</div>
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              stage={stage}
              moved={movedIds.includes(candidate.id)}
              onOpen={() => onOpen(candidate.id)}
              onMove={(nextStage) => onMove([candidate.id], nextStage)}
            />
          ))}
          {candidates.length === 0 ? (
            <div className="border border-dashed border-border bg-surface-elevated p-3 text-sm leading-6 text-text-muted">No candidates in {labelize(stage).toLowerCase()}.</div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function PipelineBoard() {
  const {
    messages,
    pipeline,
    roles,
    currentRole,
    selectedCandidates,
    setCurrentRole,
    openSurface,
    openCandidateDrawer,
    moveCandidatesToStage,
  } = useAgentStore()
  const role = currentRole ?? roles[0] ?? null
  const [movedIds, setMovedIds] = useState<string[]>([])
  const error: string | null = null

  const candidates = useMemo(() => {
    if (!role) return allCandidates
    return allCandidates
      .filter((candidate) => roleMatchScore(candidate, role) > 0 || candidate.readinessScore.role.toLowerCase().includes(role.title.split(" ")[0].toLowerCase()))
      .sort((a, b) => b.readinessScore.score - a.readinessScore.score)
  }, [role])

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        STAGES.map((stage) => [
          stage,
          candidates
            .filter((candidate) => currentStage(candidate, pipeline as Record<string, Stage>) === stage)
            .sort((a, b) => b.readinessScore.score - a.readinessScore.score),
        ]),
      ) as Record<Stage, Candidate[]>,
    [candidates, pipeline],
  )
  const fastestColumn = useMemo(() => {
    const ranked = STAGES.map((stage) => ({
      stage,
      avg: grouped[stage].length > 0 ? grouped[stage].reduce((total, candidate) => total + daysInStage(candidate, stage), 0) / grouped[stage].length : Number.MAX_SAFE_INTEGER,
    })).sort((a, b) => a.avg - b.avg)
    return ranked[0]?.avg === Number.MAX_SAFE_INTEGER ? null : ranked[0]?.stage ?? null
  }, [grouped])

  const latestMoveKey = useMemo(() => {
    const latestMove = [...messages].reverse().find((message) => message.actions?.some((action) => action.intent === "move_pipeline"))
    return latestMove ? `${latestMove.id}:${selectedCandidates.join(",")}` : ""
  }, [messages, selectedCandidates])
  const latestPipelineMessage = useMemo(
    () => [...messages].reverse().find((message) => message.actions?.some((action) => action.intent === "move_pipeline")),
    [messages],
  )
  const hasConditionalMove = latestPipelineMessage?.content.toLowerCase().includes("conditional") ?? false
  const selectedNames = useMemo(
    () =>
      selectedCandidates
        .map((candidateId) => allCandidates.find((candidate) => candidate.id === candidateId)?.name)
        .filter(Boolean)
        .join(", "),
    [selectedCandidates],
  )

  useEffect(() => {
    if (!latestMoveKey || selectedCandidates.length === 0) return
    setMovedIds(selectedCandidates.slice(0, 3))
    const timeout = window.setTimeout(() => setMovedIds([]), 1800)
    return () => window.clearTimeout(timeout)
  }, [latestMoveKey, selectedCandidates])

  function moveStage(candidateIds: string[], stage: Stage) {
    moveCandidatesToStage(candidateIds, stage)
    setMovedIds(candidateIds.slice(0, 3))
    window.setTimeout(() => setMovedIds([]), 1800)
  }

  if (error) {
    return <PipelineBoardErrorState onRetry={() => setMovedIds([])} />
  }

  if (roles.length === 0) {
    return <PipelineBoardLoadingState />
  }

  if (candidates.length === 0) {
    return (
      <PipelineBoardEmptyState
        onClearRole={() => setCurrentRole(null)}
        onOpenResults={() => openSurface("results_table")}
        onOpenRoleBuilder={() => openSurface("role_builder")}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-text">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Pipeline board</div>
            <div className="font-display text-3xl uppercase leading-none text-text">Candidate flow</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-64">
              <span className="sr-only">Role filter</span>
              <select
                value={role?.id ?? ""}
                onChange={(event) => setCurrentRole(event.target.value || null)}
                className="h-10 w-full appearance-none border border-border bg-surface-elevated pl-3 pr-8 font-mono text-[10px] uppercase tracking-wide text-text outline-none focus:border-accent"
              >
                {roles.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-text-subtle" />
            </label>
            <span className="border border-border bg-surface-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
              {candidates.length} scoped candidates
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-px bg-border md:grid-cols-4">
          <div className="bg-surface-elevated p-3">
            <div className="font-mono text-[10px] uppercase text-text-subtle">Role context</div>
            <div className="mt-1 text-sm font-semibold text-text">{role?.title ?? "None"}</div>
          </div>
          <div className="bg-surface-elevated p-3">
            <div className="font-mono text-[10px] uppercase text-text-subtle">In motion</div>
            <div className="mt-1 text-sm font-semibold text-text">{selectedCandidates.length} selected</div>
          </div>
          <div className="bg-surface-elevated p-3">
            <div className="font-mono text-[10px] uppercase text-text-subtle">Fastest column</div>
            <div className="mt-1 text-sm font-semibold text-text">{fastestColumn ? labelize(fastestColumn) : "None"}</div>
          </div>
          <div className="bg-surface-elevated p-3">
            <div className="font-mono text-[10px] uppercase text-text-subtle">Agent moves</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-text">
              <CircleArrowRight className="h-4 w-4 text-accent" />
              {movedIds.length > 0 ? `${movedIds.length} cards highlighted` : "Awaiting command"}
            </div>
          </div>
        </div>
        {hasConditionalMove ? (
          <div className="mt-3 border border-accent bg-accent-muted px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Conditional action queued</div>
            <div className="mt-1 text-sm font-semibold text-text">
              Move {selectedNames || "selected candidates"} to interview after simulation pass and zero critical integrity flags.
            </div>
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex h-full min-h-0 gap-3">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              candidates={grouped[stage]}
              movedIds={movedIds}
              onOpen={openCandidateDrawer}
              onMove={moveStage}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
