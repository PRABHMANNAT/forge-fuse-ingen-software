import { analytics } from "@/lib/demo-data/analytics"
import { candidates } from "@/lib/demo-data/candidates"
import { outreachThreads } from "@/lib/demo-data/messages"
import { pathways } from "@/lib/demo-data/pathways"
import { roles } from "@/lib/demo-data/roles"
import { talentPools } from "@/lib/demo-data/talent-pools"
import { draftForTemplate } from "./outreach-templates"
import type { AgentAction, AgentState, Surface } from "./types"

function scoreCandidate(candidate: (typeof candidates)[number], skills: string[] = []) {
  const skillBoost = skills.reduce((total, skill) => {
    const hasSkill = candidate.skills.some((candidateSkill) => candidateSkill.name.toLowerCase().includes(skill.toLowerCase()))
    return total + (hasSkill ? 6 : 0)
  }, 0)
  const trustBoost = candidate.proofBundles.some((bundle) => bundle.trustLevel.includes("verified")) ? 4 : 0
  return candidate.readinessScore.score + skillBoost + trustBoost
}

function byName(names: string[] = []) {
  const lowered = names.map((name) => name.toLowerCase())
  return candidates.filter((candidate) => lowered.some((name) => candidate.name.toLowerCase().includes(name)))
}

function nextThreadId(existingIds: string[]) {
  return `thread_${String(existingIds.length + 1).padStart(3, "0")}`
}

function nextMessageId(existingIds: string[]) {
  return `msg_${String(existingIds.length + 1).padStart(3, "0")}`
}

export function actionForIntent(intent: AgentAction["intent"], entities: Record<string, any>, input: string): AgentAction {
  switch (intent) {
    case "search_candidates":
      return { intent, payload: { query: input, ...entities } }
    case "filter_results":
      return { intent, payload: entities }
    case "compare_candidates":
      return { intent, payload: entities }
    case "save_pool":
      return { intent, payload: { name: entities.name || "Saved Pool" } }
    case "contact_candidates":
      return { intent, payload: entities }
    case "create_role":
      return { intent, payload: entities }
    case "build_pathway":
      return { intent, payload: entities }
    case "launch_assessment":
      return { intent, payload: entities }
    case "move_pipeline":
      return { intent, payload: { names: entities.names || [], stage: entities.stage || "interview" } }
    case "explain_match":
      return { intent, payload: entities }
    case "export_shortlist":
      return { intent, payload: entities }
    case "show_analytics":
      return { intent, payload: entities }
    case "open_candidate":
      return { intent, payload: entities }
    default:
      return { intent: "unknown", payload: { input } }
  }
}

export function execute(action: AgentAction, state: AgentState): { newState: AgentState; surfaces: Surface[] } {
  switch (action.intent) {
    case "search_candidates": {
      const skills = action.payload.skills ?? []
      const results = [...candidates]
        .filter((candidate) => skills.length === 0 || skills.some((skill) => candidate.skills.some((candidateSkill) => candidateSkill.name.toLowerCase().includes(skill.toLowerCase())) || candidate.tags.some((tag) => tag.includes(skill.toLowerCase()))))
        .sort((a, b) => scoreCandidate(b, skills) - scoreCandidate(a, skills))
        .slice(0, action.payload.limit ?? 8)
      return { newState: { ...state, results, shortlist: results.slice(0, 5).map((candidate) => candidate.id), activeSurfaces: ["results_table"] }, surfaces: ["results_table"] }
    }
    case "filter_results": {
      const skills = action.payload.skills ?? []
      const results = state.results.filter((candidate) => {
        const skillMatch = skills.length === 0 || skills.some((skill) => candidate.skills.some((candidateSkill) => candidateSkill.name.toLowerCase().includes(skill)))
        const scoreMatch = !action.payload.minReadinessScore || candidate.readinessScore.score >= action.payload.minReadinessScore
        const freshnessMatch = !action.payload.proofFreshness || candidate.proofBundles.some((bundle) => bundle.freshness === action.payload.proofFreshness)
        return skillMatch && scoreMatch && freshnessMatch
      })
      return { newState: { ...state, results, activeSurfaces: ["results_table"] }, surfaces: ["results_table"] }
    }
    case "compare_candidates": {
      const selected = state.shortlist.slice(0, action.payload.count ?? 3)
      return { newState: { ...state, selectedCandidates: selected, activeSurfaces: ["compare_view"] }, surfaces: ["compare_view"] }
    }
    case "save_pool": {
      const pool = {
        id: `pool_${String(state.pools.length + 1).padStart(3, "0")}`,
        name: action.payload.name,
        description: "Recruiter-saved shortlist from Aristotle command center.",
        candidateIds: state.shortlist,
        filterCriteria: { minReadinessScore: 75 },
      }
      return { newState: { ...state, pools: [...state.pools, pool], activePoolId: pool.id, activeSurfaces: ["pool_builder"] }, surfaces: ["pool_builder"] }
    }
    case "contact_candidates": {
      const baseRole = state.currentRole ?? state.roles[0] ?? roles[0]
      const targetCandidates =
        action.payload.names?.length
          ? byName(action.payload.names)
          : action.payload.candidateIds?.length
            ? candidates.filter((candidate) => action.payload.candidateIds?.includes(candidate.id))
            : state.results.slice(0, action.payload.count ?? 3)

      const nextThreads = [...(state.outreachThreads.length > 0 ? state.outreachThreads : outreachThreads)]
      const nextDrafts = { ...state.inboxDrafts }
      const queueThreadIds: string[] = []
      const allThreadIds = nextThreads.map((thread) => thread.id)
      const allMessageIds = nextThreads.flatMap((thread) => thread.messages.map((message) => message.id))

      targetCandidates.forEach((candidate) => {
        const existing = nextThreads.find((thread) => thread.candidateId === candidate.id && thread.roleId === baseRole.id)
        if (existing) {
          nextDrafts[existing.id] = draftForTemplate("initial_outreach", candidate, baseRole)
          queueThreadIds.push(existing.id)
          return
        }

        const threadId = nextThreadId(allThreadIds)
        allThreadIds.push(threadId)
        const msgId = nextMessageId(allMessageIds)
        allMessageIds.push(msgId)
        const draft = draftForTemplate("initial_outreach", candidate, baseRole)
        nextThreads.unshift({
          id: threadId,
          candidateId: candidate.id,
          roleId: baseRole.id,
          stage: "drafted",
          subject: draft.subject,
          lastActivityAt: draft.updatedAt,
          messages: [
            {
              id: msgId,
              sender: "aristotle",
              sentAt: draft.updatedAt,
              body: `Draft ready. Lead with ${candidate.proofBundles[0]?.artifactCount ?? 0} artifacts, ${candidate.readinessScore.score}/100 readiness, and ${candidate.skills[0]?.name ?? "role"} proof.`,
            },
          ],
        })
        nextDrafts[threadId] = draft
        queueThreadIds.push(threadId)
      })

      return {
        newState: {
          ...state,
          outreachThreads: nextThreads,
          inboxDrafts: nextDrafts,
          inboxQueueThreadIds: queueThreadIds,
          activeInboxThreadId: queueThreadIds[0] ?? state.activeInboxThreadId,
          selectedCandidates: targetCandidates.map((candidate) => candidate.id),
          activeSurfaces: ["inbox"],
        },
        surfaces: ["inbox"],
      }
    }
    case "create_role":
      return { newState: { ...state, currentRole: state.roles[0] ?? roles[0], activeSurfaces: ["role_builder"] }, surfaces: ["role_builder"] }
    case "build_pathway":
      return { newState: { ...state, currentPathway: state.pathways[0] ?? pathways[0], activeSurfaces: ["pathway_builder"] }, surfaces: ["pathway_builder"] }
    case "launch_assessment":
      return { newState: { ...state, activeSurfaces: ["assessment_launcher"] }, surfaces: ["assessment_launcher"] }
    case "move_pipeline": {
      const matched = byName(action.payload.names)
      const pipeline = { ...state.pipeline }
      matched.forEach((candidate) => {
        pipeline[candidate.id] = action.payload.stage
      })
      return { newState: { ...state, pipeline, selectedCandidates: matched.map((candidate) => candidate.id), activeSurfaces: ["pipeline_board"] }, surfaces: ["pipeline_board"] }
    }
    case "explain_match":
      return { newState: { ...state, activeSurfaces: ["candidate_drawer"] }, surfaces: ["candidate_drawer"] }
    case "export_shortlist":
      return { newState: { ...state, activeSurfaces: ["results_table"] }, surfaces: ["results_table"] }
    case "show_analytics":
      return { newState: { ...state, activeSurfaces: ["analytics_panel"] }, surfaces: ["analytics_panel"] }
    case "open_candidate": {
      const matched = action.payload.candidateId
        ? candidates.find((candidate) => candidate.id === action.payload.candidateId)
        : candidates.find((candidate) => candidate.name.toLowerCase().includes((action.payload.candidate ?? "").toLowerCase()))
      return { newState: { ...state, selectedCandidates: matched ? [matched.id] : state.selectedCandidates, activeSurfaces: ["candidate_drawer"] }, surfaces: ["candidate_drawer"] }
    }
    default:
      return { newState: { ...state, activeSurfaces: state.activeSurfaces }, surfaces: state.activeSurfaces }
  }
}

export { analytics, candidates, roles, talentPools }
