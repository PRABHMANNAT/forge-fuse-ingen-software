"use client"

import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from "react"
import { candidates } from "@/lib/demo-data/candidates"
import { outreachThreads } from "@/lib/demo-data/messages"
import { pathways as demoPathways } from "@/lib/demo-data/pathways"
import { roles as demoRoles } from "@/lib/demo-data/roles"
import { talentPools } from "@/lib/demo-data/talent-pools"
import type { CompanyPathway, OpenRole, PipelineStage, TalentPool } from "@/lib/demo-data/types"
import { actionForIntent, execute } from "./executor"
import { draftForTemplate, messageStageForTemplate } from "./outreach-templates"
import { parseIntent } from "./intent-parser"
import { streamReasoning } from "./reasoning-stream"
import type { AgentAction, AgentFilters, AgentMessage, AgentState, InboxDraft, OutreachTemplateKind, ReasoningStep, Surface, StructuredOutput } from "./types"

type AgentStore = AgentState & {
  sendMessage: (content: string) => Promise<void>
  process: (content: string) => Promise<void>
  setActiveSurfaces: (surfaces: Surface[]) => void
  openSurface: (surface: Surface) => void
  closeSurface: (surface: Surface) => void
  openCandidateDrawer: (candidateId: string) => void
  collapseRail: () => void
  setFilters: (filters: Partial<AgentFilters>) => void
  selectCandidate: (candidateId: string) => void
  toggleCandidateSelection: (candidateId: string) => void
  setSelectedCandidates: (candidateIds: string[]) => void
  createPool: (input: { name: string; description: string; candidateIds: string[]; filterCriteria: TalentPool["filterCriteria"] }) => void
  setActivePool: (poolId: string | null) => void
  renamePool: (poolId: string, name: string) => void
  duplicatePool: (poolId: string) => void
  deletePool: (poolId: string) => void
  moveCandidatesToStage: (candidateIds: string[], stage: Exclude<PipelineStage, null>) => void
  setActiveInboxThread: (threadId: string | null) => void
  setInboxDraft: (threadId: string, draft: InboxDraft) => void
  sendInboxDraft: (threadId: string) => void
  sendInboxQueue: (threadIds: string[]) => void
  setInboxQueueThreadIds: (threadIds: string[]) => void
  createRole: (role: Omit<OpenRole, "id">) => void
  setCurrentRole: (roleId: string | null) => void
  createPathway: (pathway: Omit<CompanyPathway, "id">) => void
  setCurrentPathway: (pathwayId: string | null) => void
  replaceState: (state: AgentState) => void
}

type StoreAction =
  | { type: "add_message"; message: AgentMessage }
  | { type: "update_message"; id: string; patch: Partial<AgentMessage> }
  | { type: "replace_state"; state: AgentState }
  | { type: "set_surfaces"; surfaces: Surface[] }
  | { type: "open_surface"; surface: Surface }
  | { type: "close_surface"; surface: Surface }
  | { type: "open_candidate_drawer"; candidateId: string }
  | { type: "set_filters"; filters: Partial<AgentFilters> }
  | { type: "select_candidate"; candidateId: string }
  | { type: "toggle_candidate_selection"; candidateId: string }
  | { type: "set_selected_candidates"; candidateIds: string[] }
  | { type: "create_pool"; pool: TalentPool }
  | { type: "set_active_pool"; poolId: string | null }
  | { type: "rename_pool"; poolId: string; name: string }
  | { type: "duplicate_pool"; sourcePoolId: string; poolId: string }
  | { type: "delete_pool"; poolId: string }
  | { type: "move_candidates_to_stage"; candidateIds: string[]; stage: Exclude<PipelineStage, null> }
  | { type: "set_active_inbox_thread"; threadId: string | null }
  | { type: "set_inbox_draft"; threadId: string; draft: InboxDraft }
  | { type: "send_inbox_draft"; threadId: string }
  | { type: "set_inbox_queue"; threadIds: string[] }
  | { type: "create_role"; role: OpenRole }
  | { type: "set_current_role"; roleId: string | null }
  | { type: "create_pathway"; pathway: CompanyPathway }
  | { type: "set_current_pathway"; pathwayId: string | null }

const initialPipeline = Object.fromEntries(
  candidates.flatMap((candidate) => (candidate.pipelineStage ? [[candidate.id, candidate.pipelineStage]] : [])),
)

export const initialAgentState: AgentState = {
  messages: [],
  activeSurfaces: ["results_table"],
  shortlist: candidates.slice(0, 5).map((candidate) => candidate.id),
  selectedCandidates: [],
  filters: {
    skills: [],
    workRights: [],
  },
  pools: talentPools,
  activePoolId: talentPools[0]?.id ?? null,
  roles: demoRoles,
  pathways: demoPathways,
  pipeline: initialPipeline,
  currentRole: demoRoles[0] ?? null,
  currentPathway: demoPathways[0] ?? null,
  outreachThreads,
  activeInboxThreadId: outreachThreads[0]?.id ?? null,
  inboxDrafts: {},
  inboxQueueThreadIds: [],
  theme: "system",
  results: candidates.slice(0, 8),
}

function reducer(state: AgentState, action: StoreAction): AgentState {
  switch (action.type) {
    case "add_message":
      return { ...state, messages: [...state.messages, action.message] }
    case "update_message":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.id ? { ...message, ...action.patch } : message,
        ),
      }
    case "replace_state":
      return action.state
    case "set_surfaces":
      return { ...state, activeSurfaces: action.surfaces }
    case "open_surface":
      return { ...state, activeSurfaces: [action.surface] }
    case "close_surface":
      return { ...state, activeSurfaces: state.activeSurfaces.filter((surface) => surface !== action.surface) }
    case "open_candidate_drawer": {
      const baseSurfaces = state.activeSurfaces.filter((surface) => surface !== "candidate_drawer")
      const surfaces = baseSurfaces.length > 0 ? [...baseSurfaces, "candidate_drawer" as Surface] : ["candidate_drawer" as Surface]
      return { ...state, selectedCandidates: [action.candidateId], activeSurfaces: surfaces }
    }
    case "set_filters":
      return { ...state, filters: { ...state.filters, ...action.filters } }
    case "select_candidate":
      return { ...state, selectedCandidates: [action.candidateId] }
    case "toggle_candidate_selection": {
      const isSelected = state.selectedCandidates.includes(action.candidateId)
      return {
        ...state,
        selectedCandidates: isSelected
          ? state.selectedCandidates.filter((candidateId) => candidateId !== action.candidateId)
          : [...state.selectedCandidates, action.candidateId],
      }
    }
    case "set_selected_candidates":
      return { ...state, selectedCandidates: action.candidateIds }
    case "create_pool":
      return { ...state, pools: [...state.pools, action.pool], activePoolId: action.pool.id, activeSurfaces: ["pool_builder"] }
    case "set_active_pool":
      return { ...state, activePoolId: action.poolId, activeSurfaces: ["pool_builder"] }
    case "rename_pool":
      return {
        ...state,
        pools: state.pools.map((pool) => (pool.id === action.poolId ? { ...pool, name: action.name } : pool)),
      }
    case "duplicate_pool": {
      const source = state.pools.find((pool) => pool.id === action.sourcePoolId)
      if (!source) return state
      const pool = { ...source, id: action.poolId, name: `${source.name} Copy` }
      return { ...state, pools: [...state.pools, pool], activePoolId: pool.id, activeSurfaces: ["pool_builder"] }
    }
    case "delete_pool": {
      const pools = state.pools.filter((pool) => pool.id !== action.poolId)
      return {
        ...state,
        pools,
        activePoolId: state.activePoolId === action.poolId ? pools[0]?.id ?? null : state.activePoolId,
      }
    }
    case "move_candidates_to_stage": {
      const pipeline = { ...state.pipeline }
      action.candidateIds.forEach((candidateId) => {
        pipeline[candidateId] = action.stage
      })
      return {
        ...state,
        pipeline,
        selectedCandidates: action.candidateIds,
      }
    }
    case "set_active_inbox_thread":
      return { ...state, activeInboxThreadId: action.threadId }
    case "set_inbox_draft":
      return {
        ...state,
        inboxDrafts: {
          ...state.inboxDrafts,
          [action.threadId]: action.draft,
        },
      }
    case "send_inbox_draft": {
      const draft = state.inboxDrafts[action.threadId]
      if (!draft || !draft.body.trim()) return state

      const thread = state.outreachThreads.find((item) => item.id === action.threadId)
      if (!thread) return state

      const candidate = candidates.find((item) => item.id === thread.candidateId)
      const role = state.roles.find((item) => item.id === thread.roleId) ?? demoRoles.find((item) => item.id === thread.roleId) ?? state.currentRole
      const sentAt = new Date().toISOString()
      const nextMessageIndex = state.outreachThreads.flatMap((item) => item.messages).length + 1
      const subject = draft.subject.trim() || thread.subject
      const nextThreads = state.outreachThreads.map((item) =>
        item.id === action.threadId
          ? {
              ...item,
              subject,
              stage: messageStageForTemplate(draft.template),
              lastActivityAt: sentAt,
              messages: [
                ...item.messages,
                {
                  id: `msg_${String(nextMessageIndex).padStart(3, "0")}`,
                  sender: "recruiter" as const,
                  sentAt,
                  body: draft.body.trim(),
                },
              ],
            }
          : item,
      )

      return {
        ...state,
        outreachThreads: nextThreads,
        inboxDrafts: {
          ...state.inboxDrafts,
          [action.threadId]:
            candidate && role
              ? { ...draftForTemplate(draft.template, candidate, role), subject, body: "", updatedAt: sentAt }
              : { ...draft, subject, body: "", updatedAt: sentAt },
        },
        inboxQueueThreadIds: state.inboxQueueThreadIds.filter((threadId) => threadId !== action.threadId),
      }
    }
    case "set_inbox_queue":
      return { ...state, inboxQueueThreadIds: action.threadIds }
    case "create_role":
      return { ...state, roles: [...state.roles, action.role], currentRole: action.role, activeSurfaces: ["role_builder"] }
    case "set_current_role": {
      const role = action.roleId ? state.roles.find((item) => item.id === action.roleId) ?? null : null
      return { ...state, currentRole: role }
    }
    case "create_pathway":
      return {
        ...state,
        pathways: [...state.pathways, action.pathway],
        currentPathway: action.pathway,
        activeSurfaces: ["pathway_builder"],
      }
    case "set_current_pathway": {
      const pathway = action.pathwayId ? state.pathways.find((item) => item.id === action.pathwayId) ?? null : null
      return { ...state, currentPathway: pathway }
    }
    default:
      return state
  }
}

const AgentContext = createContext<AgentStore | null>(null)

function now() {
  return new Date().toISOString()
}

function messageId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

function outputForAction(action: AgentAction, state: AgentState, surfaces: Surface[]): StructuredOutput {
  if (action.intent === "search_candidates" || action.intent === "filter_results") {
    return {
      kind: "shortlist_preview",
      candidateIds: state.results.slice(0, 3).map((candidate) => candidate.id),
      title: "Shortlist preview",
      summary: `${state.results.length} candidates ranked by readiness, proof, and trust.`,
    }
  }

  if (action.intent === "save_pool") {
    return {
      kind: "pool_summary",
      name: action.payload.name,
      candidateIds: state.shortlist,
      summary: `${state.shortlist.length} candidates captured with current proof and readiness ordering.`,
    }
  }

  if (action.intent === "explain_match" || action.intent === "open_candidate") {
    const requestedName = action.intent === "explain_match" ? action.payload.candidate : action.payload.candidate
    const candidate =
      state.results.find((item) => item.name.toLowerCase().includes((requestedName ?? "").toLowerCase())) ??
      state.results[0]

    return {
      kind: "explanation_card",
      candidateId: candidate?.id,
      title: candidate ? `${candidate.name} match explanation` : "Match explanation",
      rankDrivers: candidate
        ? [
            `${candidate.readinessScore.score}/100 readiness for ${candidate.readinessScore.role}`,
            `${candidate.proofBundles[0]?.artifactCount ?? 0} artifacts in ${candidate.proofBundles[0]?.trustLevel.replace(/-/g, " ") ?? "unverified"} bundle`,
            `${candidate.skills.filter((skill) => skill.verified).length} verified skills with recent evidence`,
          ]
        : ["No active candidate was resolved."],
      riskNotes: candidate
        ? [
            candidate.workRights.includes("sponsorship") ? "Work-rights timing needs recruiter review." : "No work-rights blocker in fixture.",
            candidate.assessmentHistory.some((assessment) => assessment.integrityFlags > 0)
              ? "Assessment has integrity flags to inspect."
              : "No assessment integrity flags in latest record.",
          ]
        : ["Ask for a candidate by name to generate a stronger explanation."],
    }
  }

  return {
    kind: "surface_notice",
    surface: surfaces[0] ?? "results_table",
    title: `Surface: ${surfaces[0] ?? "results_table"}`,
    summary: "The full structured surface is stubbed for this phase.",
  }
}

function contentForAction(action: AgentAction, state: AgentState) {
  switch (action.intent) {
    case "search_candidates":
      return `I found ${state.results.length} candidates and opened the ranked results surface.`
    case "compare_candidates":
      return `I prepared a comparison set with ${state.selectedCandidates.length || 3} candidates.`
    case "save_pool":
      return `Saved the current shortlist as "${action.payload.name}".`
    case "contact_candidates":
      return `I opened ${state.inboxQueueThreadIds.length || state.selectedCandidates.length || 1} outreach drafts in the inbox.`
    case "move_pipeline":
      return `Pipeline update ready for ${action.payload.names.join(", ") || "the selected candidates"}.`
    case "show_analytics":
      return "I opened the analytics panel with the 90-day funnel."
    case "unknown":
      return "I could not map that to a recruiter command yet. Try search, compare, save, contact, pipeline, assessment, or analytics."
    default:
      return "I routed the command and opened the relevant operating surface."
  }
}

export function AgentProvider({ children, initialState = initialAgentState }: { children: React.ReactNode; initialState?: AgentState }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    const userMessage: AgentMessage = {
      id: messageId("user"),
      role: "user",
      content: trimmed,
      timestamp: now(),
    }
    dispatch({ type: "add_message", message: userMessage })

    const parsed = parseIntent(trimmed)
    const agentId = messageId("agent")
    const agentMessage: AgentMessage = {
      id: agentId,
      role: "agent",
      content: "Working the command.",
      timestamp: now(),
      reasoning: [],
    }
    dispatch({ type: "add_message", message: agentMessage })

    const completedSteps = new Map<string, ReasoningStep>()
    for await (const step of streamReasoning(parsed.intent, parsed.entities)) {
      completedSteps.set(step.label, step)
      dispatch({ type: "update_message", id: agentId, patch: { reasoning: Array.from(completedSteps.values()) } })
    }

    const action = actionForIntent(parsed.intent, parsed.entities, trimmed)
    const executed = execute(action, stateRef.current)
    const output = outputForAction(action, executed.newState, executed.surfaces)
    const nextState = {
      ...executed.newState,
      messages: stateRef.current.messages.map((message) =>
        message.id === agentId
          ? {
              ...message,
              content: contentForAction(action, executed.newState),
              actions: [action],
              output,
            }
          : message,
      ),
    }
    dispatch({ type: "replace_state", state: nextState })
  }, [])

  const store = useMemo<AgentStore>(
    () => ({
      ...state,
      sendMessage,
      process: sendMessage,
      setActiveSurfaces: (surfaces) => dispatch({ type: "set_surfaces", surfaces }),
      openSurface: (surface) => dispatch({ type: "open_surface", surface }),
      closeSurface: (surface) => dispatch({ type: "close_surface", surface }),
      openCandidateDrawer: (candidateId) => dispatch({ type: "open_candidate_drawer", candidateId }),
      collapseRail: () => dispatch({ type: "set_surfaces", surfaces: [] }),
      setFilters: (filters) => dispatch({ type: "set_filters", filters }),
      selectCandidate: (candidateId) => dispatch({ type: "select_candidate", candidateId }),
      toggleCandidateSelection: (candidateId) => dispatch({ type: "toggle_candidate_selection", candidateId }),
      setSelectedCandidates: (candidateIds) => dispatch({ type: "set_selected_candidates", candidateIds }),
      createPool: (input) => {
        const id = `pool_${String(state.pools.length + 1).padStart(3, "0")}`
        dispatch({
          type: "create_pool",
          pool: {
            id,
            name: input.name,
            description: input.description,
            candidateIds: input.candidateIds,
            filterCriteria: input.filterCriteria,
          },
        })
      },
      setActivePool: (poolId) => dispatch({ type: "set_active_pool", poolId }),
      renamePool: (poolId, name) => dispatch({ type: "rename_pool", poolId, name }),
      duplicatePool: (poolId) =>
        dispatch({
          type: "duplicate_pool",
          sourcePoolId: poolId,
          poolId: `pool_${String(state.pools.length + 1).padStart(3, "0")}`,
        }),
      deletePool: (poolId) => dispatch({ type: "delete_pool", poolId }),
      moveCandidatesToStage: (candidateIds, stage) => dispatch({ type: "move_candidates_to_stage", candidateIds, stage }),
      setActiveInboxThread: (threadId) => dispatch({ type: "set_active_inbox_thread", threadId }),
      setInboxDraft: (threadId, draft) => dispatch({ type: "set_inbox_draft", threadId, draft }),
      sendInboxDraft: (threadId) => dispatch({ type: "send_inbox_draft", threadId }),
      sendInboxQueue: (threadIds) => threadIds.forEach((threadId) => dispatch({ type: "send_inbox_draft", threadId })),
      setInboxQueueThreadIds: (threadIds) => dispatch({ type: "set_inbox_queue", threadIds }),
      createRole: (role) =>
        dispatch({
          type: "create_role",
          role: { ...role, id: `role_${String(state.roles.length + 1).padStart(3, "0")}` },
        }),
      setCurrentRole: (roleId) => dispatch({ type: "set_current_role", roleId }),
      createPathway: (pathway) =>
        dispatch({
          type: "create_pathway",
          pathway: { ...pathway, id: `path_${String(state.pathways.length + 1).padStart(3, "0")}` },
        }),
      setCurrentPathway: (pathwayId) => dispatch({ type: "set_current_pathway", pathwayId }),
      replaceState: (nextState) => dispatch({ type: "replace_state", state: nextState }),
    }),
    [sendMessage, state],
  )

  return React.createElement(AgentContext.Provider, { value: store }, children)
}

export function useAgentStore() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error("useAgentStore must be used inside AgentProvider")
  }
  return context
}
