import type { Candidate, CompanyPathway, OpenRole, OutreachThread, PipelineStage, TalentPool } from "@/lib/demo-data/types"

export type Intent =
  | "search_candidates"
  | "filter_results"
  | "compare_candidates"
  | "save_pool"
  | "contact_candidates"
  | "create_role"
  | "build_pathway"
  | "launch_assessment"
  | "move_pipeline"
  | "explain_match"
  | "export_shortlist"
  | "show_analytics"
  | "open_candidate"
  | "unknown"

export type Surface =
  | "results_table"
  | "candidate_drawer"
  | "compare_view"
  | "role_builder"
  | "pipeline_board"
  | "pathway_builder"
  | "analytics_panel"
  | "inbox"
  | "pool_builder"
  | "assessment_launcher"

export type ReasoningStep = {
  label: string
  status: "pending" | "running" | "done"
  detail?: string
}

export type OutreachTemplateKind =
  | "initial_outreach"
  | "assessment_invite"
  | "tryout_invite"
  | "interview_schedule"
  | "offer"
  | "nurture"
  | "polite_reject"

export type InboxDraft = {
  subject: string
  body: string
  template: OutreachTemplateKind
  updatedAt: string
}

export type SearchCandidatesAction = {
  intent: "search_candidates"
  payload: {
    query: string
    skills?: string[]
    seniority?: string
    proofFocus?: string
    location?: string
    limit?: number
  }
}

export type FilterResultsAction = {
  intent: "filter_results"
  payload: {
    skills?: string[]
    workRights?: string[]
    location?: string
    minReadinessScore?: number
    proofFreshness?: "fresh" | "stale"
  }
}

export type CompareCandidatesAction = {
  intent: "compare_candidates"
  payload: {
    candidateIds?: string[]
    names?: string[]
    count?: number
  }
}

export type SavePoolAction = {
  intent: "save_pool"
  payload: {
    name: string
    candidateIds?: string[]
  }
}

export type ContactCandidatesAction = {
  intent: "contact_candidates"
  payload: {
    candidateIds?: string[]
    names?: string[]
    count?: number
    poolId?: string
  }
}

export type CreateRoleAction = {
  intent: "create_role"
  payload: {
    title?: string
    skills?: string[]
    seniority?: string
  }
}

export type BuildPathwayAction = {
  intent: "build_pathway"
  payload: {
    role?: string
    company?: string
    pathwayId?: string
  }
}

export type LaunchAssessmentAction = {
  intent: "launch_assessment"
  payload: {
    target?: "shortlist" | "selected" | "pool" | "candidate"
    candidateIds?: string[]
    names?: string[]
    assessmentName?: string
  }
}

export type MovePipelineAction = {
  intent: "move_pipeline"
  payload: {
    names: string[]
    stage: Exclude<PipelineStage, null>
  }
}

export type ExplainMatchAction = {
  intent: "explain_match"
  payload: {
    candidate?: string
    candidateId?: string
    roleId?: string
  }
}

export type ExportShortlistAction = {
  intent: "export_shortlist"
  payload: {
    format?: "csv" | "json" | "pdf"
  }
}

export type ShowAnalyticsAction = {
  intent: "show_analytics"
  payload: {
    rangeDays?: number
    segment?: string
  }
}

export type OpenCandidateAction = {
  intent: "open_candidate"
  payload: {
    candidate?: string
    candidateId?: string
  }
}

export type UnknownAction = {
  intent: "unknown"
  payload: {
    input: string
  }
}

export type AgentAction =
  | SearchCandidatesAction
  | FilterResultsAction
  | CompareCandidatesAction
  | SavePoolAction
  | ContactCandidatesAction
  | CreateRoleAction
  | BuildPathwayAction
  | LaunchAssessmentAction
  | MovePipelineAction
  | ExplainMatchAction
  | ExportShortlistAction
  | ShowAnalyticsAction
  | OpenCandidateAction
  | UnknownAction

export type AgentMessage = {
  id: string
  role: "user" | "agent"
  content: string
  timestamp: string
  actions?: AgentAction[]
  reasoning?: ReasoningStep[]
  output?: StructuredOutput
}

export type StructuredOutput =
  | {
      kind: "shortlist_preview"
      candidateIds: string[]
      title: string
      summary: string
    }
  | {
      kind: "pool_summary"
      poolId?: string
      name: string
      candidateIds: string[]
      summary: string
    }
  | {
      kind: "explanation_card"
      candidateId?: string
      title: string
      rankDrivers: string[]
      riskNotes: string[]
    }
  | {
      kind: "surface_notice"
      surface: Surface
      title: string
      summary: string
    }

export type AgentFilters = {
  skills: string[]
  workRights: string[]
  location?: string
  minReadinessScore?: number
  proofFreshness?: "fresh" | "stale"
}

export type AgentState = {
  messages: AgentMessage[]
  activeSurfaces: Surface[]
  shortlist: string[]
  selectedCandidates: string[]
  filters: AgentFilters
  pools: TalentPool[]
  activePoolId: string | null
  roles: OpenRole[]
  pathways: CompanyPathway[]
  pipeline: Record<string, Exclude<PipelineStage, null>>
  currentRole: OpenRole | null
  currentPathway: CompanyPathway | null
  outreachThreads: OutreachThread[]
  activeInboxThreadId: string | null
  inboxDrafts: Record<string, InboxDraft>
  inboxQueueThreadIds: string[]
  theme: "system" | "light" | "dark"
  results: Candidate[]
}
