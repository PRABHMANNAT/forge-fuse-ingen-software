"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { CommandCenterShell } from "@/components/command-center/CommandCenterShell"
import { isEditableTarget } from "@/components/command-center/events"
import { AgentProvider, initialAgentState, useAgentStore } from "@/lib/agent/store"
import type { AgentMessage, AgentState, ReasoningStep } from "@/lib/agent/types"
import { candidates } from "@/lib/demo-data/candidates"
import { roles } from "@/lib/demo-data/roles"
import type { TalentPool } from "@/lib/demo-data/types"

const rustRole = roles.find((role) => role.id === "role_001") ?? roles[0]
const rustCandidates = candidates
  .filter((candidate) => candidate.tags.includes("rust-backend"))
  .sort((a, b) => b.readinessScore.score - a.readinessScore.score)
  .slice(0, 7)
const rustCandidateIds = rustCandidates.map((candidate) => candidate.id)
const topThreeIds = rustCandidateIds.slice(0, 3)
const alex = candidates.find((candidate) => candidate.name.startsWith("Alex"))
const priya = candidates.find((candidate) => candidate.name.startsWith("Priya"))
const conditionalCandidateIds = [alex?.id, priya?.id].filter(Boolean) as string[]

const searchCommand = "Find me senior Rust developers with backend systems proof and strong GitHub signal"
const compareCommand = "Compare the top 3"
const saveCommand = "Save these as Rust Backend shortlist"
const assessmentCommand = "Launch a 2-hour simulation for this pool"
const pipelineCommand = "Move Alex and Priya to interview once they pass"
const analyticsCommand = "Show funnel health for Rust Backend role"

const demoPool: TalentPool = {
  id: "pool_demo_rust_backend",
  name: "Rust Backend Shortlist",
  description: "Demo shortlist created from seven Rust backend candidates with proof and GitHub signal.",
  candidateIds: rustCandidateIds,
  filterCriteria: {
    skills: ["Rust", "Distributed Systems", "Backend Systems"],
    minReadinessScore: 78,
    pipelineStages: ["contacted", "assessment", "tryout", "interview"],
    tags: ["rust-backend", "github-signal"],
  },
}

const reasoningSteps: ReasoningStep[] = [
  { label: "Parse seniority, Rust, and backend systems constraints", status: "done", detail: "Entities: seniority, skills, proofFocus" },
  { label: "Scan proof bundles for production backend evidence", status: "done" },
  { label: "Score GitHub signal across commits, stars, and shipped projects", status: "done" },
  { label: "Cross-check trust layer and integrity metadata", status: "done" },
  { label: "Rank seven candidates for recruiter review", status: "done" },
]

const baseTime = Date.UTC(2026, 3, 17, 9, 0, 0)

function timestamp(offsetMinutes: number) {
  return new Date(baseTime + offsetMinutes * 60_000).toISOString()
}

function userMessage(id: string, content: string, offsetMinutes: number): AgentMessage {
  return {
    id,
    role: "user",
    content,
    timestamp: timestamp(offsetMinutes),
  }
}

function agentMessage(input: Omit<AgentMessage, "role" | "timestamp"> & { offsetMinutes: number }): AgentMessage {
  const { offsetMinutes, ...message } = input
  return {
    ...message,
    role: "agent",
    timestamp: timestamp(offsetMinutes),
  }
}

const messages = {
  searchUser: userMessage("demo_user_search", searchCommand, 1),
  searchReasoning: agentMessage({
    id: "demo_agent_search_reasoning",
    content: "Working the command.",
    reasoning: reasoningSteps,
    offsetMinutes: 2,
  }),
  searchDone: agentMessage({
    id: "demo_agent_search_done",
    content: "I found 7 senior Rust backend candidates with production systems proof, strong GitHub signal, and reviewable trust metadata.",
    reasoning: reasoningSteps,
    actions: [
      {
        intent: "search_candidates",
        payload: {
          query: searchCommand,
          skills: ["rust", "backend"],
          seniority: "senior",
          proofFocus: "backend",
          limit: 7,
        },
      },
    ],
    output: {
      kind: "shortlist_preview",
      candidateIds: topThreeIds,
      title: "Rust backend shortlist preview",
      summary: "7 candidates ranked by backend proof, GitHub signal, readiness, and trust.",
    },
    offsetMinutes: 3,
  }),
  compareUser: userMessage("demo_user_compare", compareCommand, 4),
  compareDone: agentMessage({
    id: "demo_agent_compare_done",
    content: "I compared the top 3. Aristotle recommends Anika Rao: highest backend readiness, employer-verified Rust proof, and the cleanest integrity record.",
    actions: [{ intent: "compare_candidates", payload: { count: 3 } }],
    output: {
      kind: "explanation_card",
      candidateId: topThreeIds[0],
      title: "Recommended candidate: Anika Rao",
      rankDrivers: ["92/100 readiness for Senior Rust Backend Engineer", "Employer-verified backend proof bundle", "Fresh Rust and distributed systems evidence"],
      riskNotes: ["Work-rights timing requires recruiter review", "Compare Alex's GitHub depth before final interview slate"],
    },
    offsetMinutes: 5,
  }),
  saveUser: userMessage("demo_user_save", saveCommand, 6),
  saveDone: agentMessage({
    id: "demo_agent_save_done",
    content: "Saved Rust Backend Shortlist with 7 candidates, auto-refresh criteria, and the active role rubric attached.",
    actions: [{ intent: "save_pool", payload: { name: "Rust Backend Shortlist", candidateIds: rustCandidateIds } }],
    output: {
      kind: "pool_summary",
      poolId: demoPool.id,
      name: demoPool.name,
      candidateIds: rustCandidateIds,
      summary: "7 candidates captured with Rust/backend proof, GitHub signal, and trust metadata.",
    },
    offsetMinutes: 7,
  }),
  assessmentUser: userMessage("demo_user_assessment", assessmentCommand, 8),
  assessmentDone: agentMessage({
    id: "demo_agent_assessment_done",
    content: "The 2-hour Rust backend simulation is pre-filled for Rust Backend Shortlist with rubric, deadline, integrity checks, and candidate-facing copy.",
    actions: [{ intent: "launch_assessment", payload: { target: "pool", assessmentName: "Senior Rust Backend Engineer role simulation", count: rustCandidateIds.length } }],
    output: {
      kind: "surface_notice",
      surface: "assessment_launcher",
      title: "Assessment launcher ready",
      summary: "Simulation configured for the saved pool with proctoring and tab-switch detection enabled.",
    },
    offsetMinutes: 9,
  }),
  pipelineUser: userMessage("demo_user_pipeline", pipelineCommand, 10),
  pipelineDone: agentMessage({
    id: "demo_agent_pipeline_done",
    content: "Conditional action queued: move Alex Morgan and Priya Nair to interview after they pass the simulation and clear integrity checks.",
    actions: [{ intent: "move_pipeline", payload: { names: ["Alex", "Priya"], stage: "interview" } }],
    output: {
      kind: "surface_notice",
      surface: "pipeline_board",
      title: "Conditional pipeline action",
      summary: "The board is tracking Alex and Priya against pass criteria before interview movement.",
    },
    offsetMinutes: 11,
  }),
  analyticsUser: userMessage("demo_user_analytics", analyticsCommand, 12),
  analyticsDone: agentMessage({
    id: "demo_agent_analytics_done",
    content: "Opened funnel health scoped to the Senior Rust Backend Engineer role: sourced-to-offer conversion, proof trust, pool health, and pathway lift.",
    actions: [{ intent: "show_analytics", payload: { rangeDays: 90, segment: "Senior Rust Backend Engineer" } }],
    output: {
      kind: "surface_notice",
      surface: "analytics_panel",
      title: "Rust Backend role analytics",
      summary: "90-day funnel, assessment completion, trust distribution, and company-authored pathway effectiveness.",
    },
    offsetMinutes: 13,
  }),
}

type DemoStep = {
  title: string
  cue: string
  command?: string
}

const demoSteps: DemoStep[] = [
  { title: "Aristotle Greeting", cue: "Start on the real command center. The presenter frames Aristotle as the operating layer for proof-first hiring." },
  { title: "Search Command", cue: "Recruiter types the Rust/backend search request.", command: searchCommand },
  { title: "Reasoning Stream", cue: "Show the five-step reasoning trace before any result is trusted." },
  { title: "Ranked Results", cue: "Open the results rail with seven candidates ranked by proof, GitHub signal, trust, and readiness." },
  { title: "Compare Command", cue: "Recruiter asks Aristotle to compare the top three.", command: compareCommand },
  { title: "Recommendation", cue: "Compare view opens and Aristotle explains the recommended candidate." },
  { title: "Save Command", cue: "Recruiter saves the result set as a reusable shortlist.", command: saveCommand },
  { title: "Pool Created", cue: "The pool becomes a system-of-record object with refresh criteria and attached candidates." },
  { title: "Simulation Command", cue: "Recruiter launches a role-realistic simulation for the pool.", command: assessmentCommand },
  { title: "Assessment Launcher", cue: "The launcher is pre-filled with pool, role rubric, integrity checks, and invitation copy." },
  { title: "Pipeline Command", cue: "Recruiter queues conditional movement for candidates who pass.", command: pipelineCommand },
  { title: "Conditional Pipeline", cue: "The pipeline board shows the queued move for Alex and Priya after pass criteria are met." },
  { title: "Analytics Command", cue: "Recruiter asks for funnel health scoped to Rust Backend.", command: analyticsCommand },
  { title: "Funnel Health", cue: "Analytics opens scoped to the role with trust, auditability, and pathway effectiveness." },
  { title: "End Card", cue: "Close on the system-of-record message." },
]

function withPool(state: AgentState): AgentState {
  const pools = state.pools.some((pool) => pool.id === demoPool.id) ? state.pools : [...state.pools, demoPool]
  return {
    ...state,
    pools,
    activePoolId: demoPool.id,
  }
}

function baseState(): AgentState {
  return {
    ...initialAgentState,
    messages: [],
    activeSurfaces: [],
    results: rustCandidates,
    shortlist: rustCandidateIds,
    selectedCandidates: [],
    currentRole: rustRole,
    activePoolId: null,
  }
}

function buildDemoState(stepIndex: number): AgentState {
  const state = baseState()

  if (stepIndex === 0) return state
  if (stepIndex === 1) return { ...state, messages: [messages.searchUser] }
  if (stepIndex === 2) return { ...state, messages: [messages.searchUser, messages.searchReasoning] }
  if (stepIndex === 3) return { ...state, messages: [messages.searchUser, messages.searchDone], activeSurfaces: ["results_table"] }
  if (stepIndex === 4) return { ...state, messages: [messages.searchUser, messages.searchDone, messages.compareUser], activeSurfaces: ["results_table"] }
  if (stepIndex === 5) {
    return {
      ...state,
      messages: [messages.searchUser, messages.searchDone, messages.compareUser, messages.compareDone],
      activeSurfaces: ["compare_view"],
      selectedCandidates: topThreeIds,
    }
  }
  if (stepIndex === 6) {
    return {
      ...state,
      messages: [messages.searchUser, messages.searchDone, messages.compareUser, messages.compareDone, messages.saveUser],
      activeSurfaces: ["compare_view"],
      selectedCandidates: topThreeIds,
    }
  }
  if (stepIndex === 7) {
    return withPool({
      ...state,
      messages: [messages.searchUser, messages.searchDone, messages.compareUser, messages.compareDone, messages.saveUser, messages.saveDone],
      activeSurfaces: ["pool_builder"],
      selectedCandidates: rustCandidateIds,
    })
  }
  if (stepIndex === 8) {
    return withPool({
      ...state,
      messages: [messages.searchUser, messages.searchDone, messages.compareUser, messages.compareDone, messages.saveUser, messages.saveDone, messages.assessmentUser],
      activeSurfaces: ["pool_builder"],
      selectedCandidates: [],
    })
  }
  if (stepIndex === 9) {
    return withPool({
      ...state,
      messages: [messages.searchUser, messages.searchDone, messages.compareUser, messages.compareDone, messages.saveUser, messages.saveDone, messages.assessmentUser, messages.assessmentDone],
      activeSurfaces: ["assessment_launcher"],
      selectedCandidates: [],
    })
  }
  if (stepIndex === 10) {
    return withPool({
      ...state,
      messages: [
        messages.searchUser,
        messages.searchDone,
        messages.compareUser,
        messages.compareDone,
        messages.saveUser,
        messages.saveDone,
        messages.assessmentUser,
        messages.assessmentDone,
        messages.pipelineUser,
      ],
      activeSurfaces: ["assessment_launcher"],
      selectedCandidates: [],
    })
  }
  if (stepIndex === 11) {
    return withPool({
      ...state,
      messages: [
        messages.searchUser,
        messages.searchDone,
        messages.compareUser,
        messages.compareDone,
        messages.saveUser,
        messages.saveDone,
        messages.assessmentUser,
        messages.assessmentDone,
        messages.pipelineUser,
        messages.pipelineDone,
      ],
      activeSurfaces: ["pipeline_board"],
      selectedCandidates: conditionalCandidateIds,
    })
  }
  if (stepIndex === 12) {
    return withPool({
      ...state,
      messages: [
        messages.searchUser,
        messages.searchDone,
        messages.compareUser,
        messages.compareDone,
        messages.saveUser,
        messages.saveDone,
        messages.assessmentUser,
        messages.assessmentDone,
        messages.pipelineUser,
        messages.pipelineDone,
        messages.analyticsUser,
      ],
      activeSurfaces: ["pipeline_board"],
      selectedCandidates: conditionalCandidateIds,
    })
  }

  return withPool({
    ...state,
    messages: [
      messages.searchUser,
      messages.searchDone,
      messages.compareUser,
      messages.compareDone,
      messages.saveUser,
      messages.saveDone,
      messages.assessmentUser,
      messages.assessmentDone,
      messages.pipelineUser,
      messages.pipelineDone,
      messages.analyticsUser,
      messages.analyticsDone,
    ],
    activeSurfaces: ["analytics_panel"],
    selectedCandidates: conditionalCandidateIds,
  })
}

function DemoDirector() {
  const store = useAgentStore()
  const [stepIndex, setStepIndex] = useState(0)
  const step = demoSteps[stepIndex]
  const isEnd = stepIndex === demoSteps.length - 1
  const progress = useMemo(() => `${stepIndex + 1}/${demoSteps.length}`, [stepIndex])

  useEffect(() => {
    store.replaceState(buildDemoState(stepIndex))
    // Intentionally keyed only by stepIndex so manual UI interactions remain possible between demo advances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.code !== "Space") return
      if (isEditableTarget(event.target)) return
      if ((event.target as HTMLElement | null)?.closest("[data-demo-control]")) return
      event.preventDefault()
      setStepIndex((current) => Math.min(current + 1, demoSteps.length - 1))
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]">
      {isEnd ? (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/92 px-6 text-center backdrop-blur-sm">
          <div className="border border-border bg-surface px-8 py-7 shadow-2xl">
            <div className="font-display text-6xl uppercase leading-none text-text md:text-8xl">iNGEN</div>
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.28em] text-text-muted">
              Proof-first hiring
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-[0.28em] text-accent">
              System of record for software delivery truth
            </div>
          </div>
        </div>
      ) : null}

      <section
        data-demo-control
        className="pointer-events-auto absolute bottom-4 left-4 w-[420px] border border-border bg-surface/96 p-4 text-text shadow-2xl backdrop-blur"
        aria-label="Scripted demo controls"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-subtle">IBM / investor demo</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-text-muted">{progress}</div>
        </div>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-text">{step.title}</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">{step.cue}</p>
        {step.command ? (
          <div className="mt-3 border border-border bg-surface-elevated p-3">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Recruiter types</div>
            <div className="mt-1 text-sm font-semibold leading-6 text-text">"{step.command}"</div>
          </div>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            className="inline-flex items-center gap-1 border border-border bg-surface-elevated px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={() => setStepIndex(0)}
            className="inline-flex items-center gap-1 border border-border bg-surface-elevated px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setStepIndex((current) => Math.min(current + 1, demoSteps.length - 1))}
            className="inline-flex items-center gap-1 border border-accent bg-accent px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-primary-foreground"
          >
            Next / Space
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>
  )
}

function ChatDemoExperience() {
  return (
    <>
      <CommandCenterShell />
      <DemoDirector />
    </>
  )
}

export default function ChatDemoPage() {
  return (
    <AgentProvider initialState={buildDemoState(0)}>
      <Suspense fallback={<div className="h-screen bg-bg" />}>
        <ChatDemoExperience />
      </Suspense>
    </AgentProvider>
  )
}
