import type { Intent, ReasoningStep } from "./types"

const STEP_LIBRARY: Record<Intent, string[]> = {
  search_candidates: ["Parsing capability requirements", "Scanning 1,284 proof bundles", "Cross-checking GitHub signal", "Ranking by readiness + trust", "Composing shortlist"],
  filter_results: ["Reading active filters", "Applying proof and work-rights constraints", "Re-ranking visible candidates"],
  compare_candidates: ["Selecting comparison set", "Normalizing readiness dimensions", "Finding decisive proof gaps", "Preparing compare view"],
  save_pool: ["Naming saved pool", "Freezing candidate IDs", "Attaching filter criteria"],
  contact_candidates: ["Selecting outreach targets", "Checking stage and duplicate threads", "Drafting recruiter-safe outreach"],
  create_role: ["Parsing role requirements", "Mapping skills into capability graph", "Preparing role draft"],
  build_pathway: ["Reading role capability graph", "Sequencing company-authored milestones", "Estimating evidence windows"],
  launch_assessment: ["Selecting assessment target", "Matching assessment to proof gaps", "Preparing launch queue"],
  move_pipeline: ["Resolving candidate names", "Checking current stages", "Preparing pipeline updates"],
  explain_match: ["Loading candidate evidence", "Comparing against role rubric", "Explaining rank drivers"],
  export_shortlist: ["Collecting shortlist", "Formatting recruiter scorecards", "Preparing export surface"],
  show_analytics: ["Loading 90-day funnel", "Calculating conversion rates", "Preparing analytics panel"],
  open_candidate: ["Resolving candidate profile", "Loading proof bundles", "Opening dossier"],
  unknown: ["Reading command", "Looking for known recruiter actions", "Preparing clarification"],
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function* streamReasoning(intent: Intent, entities: Record<string, any>): AsyncIterable<ReasoningStep> {
  const labels = STEP_LIBRARY[intent] ?? STEP_LIBRARY.unknown

  for (let index = 0; index < labels.length; index++) {
    yield {
      label: labels[index],
      status: "running",
      detail: index === 0 && Object.keys(entities).length > 0 ? `Entities: ${Object.keys(entities).join(", ")}` : undefined,
    }
    await delay(300 + ((index * 137) % 400))
    yield {
      label: labels[index],
      status: "done",
      detail: index === 0 && Object.keys(entities).length > 0 ? `Entities: ${Object.keys(entities).join(", ")}` : undefined,
    }
  }
}
