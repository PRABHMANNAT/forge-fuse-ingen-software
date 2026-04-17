export type WorkRights =
  | "citizen"
  | "pr"
  | "student-visa-sponsorship-required"
  | "student-visa-no-sponsorship"

export type TrustLevel =
  | "unverified"
  | "self-attested"
  | "peer-endorsed"
  | "employer-verified"
  | "identity-verified"

export type Freshness = "fresh" | "stale"

export type PipelineStage =
  | "new"
  | "contacted"
  | "responded"
  | "assessment"
  | "tryout"
  | "interview"
  | "offer"
  | "hired"
  | "nurture"
  | "rejected"
  | null

export type PathwayMilestoneStatus = "not-started" | "in-progress" | "submitted" | "verified"

export type CandidateSkill = {
  name: string
  proficiency: 1 | 2 | 3 | 4 | 5
  verified: boolean
  lastEvidence: string
}

export type CandidateProofBundle = {
  id: string
  role: string
  artifactCount: number
  freshness: Freshness
  trustLevel: TrustLevel
}

export type ReadinessScore = {
  role: string
  score: number
  breakdown: {
    skills: number
    proof: number
    integrity: number
    depth: number
  }
}

export type GitHubSignal = {
  commits90d: number
  starredRepos: number
  languages: string[]
  shippedProjects: number
} | null

export type AssessmentRecord = {
  id: string
  name: string
  score: number
  completedAt: string
  integrityFlags: number
}

export type Candidate = {
  id: string
  name: string
  pronouns: string
  headline: string
  location: string
  workRights: WorkRights
  institution: string
  degree: string
  year: string
  graduationDate: string
  skills: CandidateSkill[]
  proofBundles: CandidateProofBundle[]
  readinessScore: ReadinessScore
  githubSignal: GitHubSignal
  assessmentHistory: AssessmentRecord[]
  pipelineStage: PipelineStage
  tags: string[]
  avatarSeed: string
}

export type RoleRubricDimension = {
  dimension: string
  weight: number
  evidenceExpected: string
}

export type OpenRole = {
  id: string
  title: string
  company: string
  stack: string[]
  mustHaves: string[]
  niceToHaves: string[]
  rubric: RoleRubricDimension[]
  pathwayId: string
}

export type CompanyPathway = {
  id: string
  title: string
  company: string
  role: string
  milestones: Array<{
    id: string
    title: string
    capability: string
    evidenceTypes: string[]
    estimatedWeeks: number
    gatingRule?: "required" | "recommended"
    status: PathwayMilestoneStatus
  }>
}

export type TalentPool = {
  id: string
  name: string
  description: string
  candidateIds: string[]
  filterCriteria: {
    locations?: string[]
    skills?: string[]
    workRights?: WorkRights[]
    minReadinessScore?: number
    pipelineStages?: Exclude<PipelineStage, null>[]
    tags?: string[]
  }
}

export type OutreachThread = {
  id: string
  candidateId: string
  roleId: string
  stage:
    | "drafted"
    | "sent"
    | "opened"
    | "replied"
    | "assessment-sent"
    | "tryout-scheduled"
    | "interviewing"
    | "closed"
  subject: string
  lastActivityAt: string
  messages: Array<{
    id: string
    sender: "recruiter" | "candidate" | "aristotle"
    sentAt: string
    body: string
  }>
}

export type AnalyticsSummary = {
  funnelCounts: {
    sourced: number
    contacted: number
    responded: number
    assessed: number
    tryout: number
    interviewed: number
    offered: number
    hired: number
  }
  timeToContactHours: number
  timeToContactPercentiles: {
    p50: number
    p90: number
  }
  responseRate: number
  assessmentCompletionRate: number
  integrityFlagRate: number
  offerRate: number
  timeToContactSeries90d: Array<{
    date: string
    p50: number
    p90: number
  }>
  poolHealth: Array<{
    poolId: string
    freshnessScore: number
    matchDecayScore: number
    refreshedAt: string
  }>
  trustDistribution: Record<TrustLevel, number>
  pathwayEffectiveness: Array<{
    pathwayId: string
    completedHireRate: number
    incompleteHireRate: number
    completedCount: number
    incompleteCount: number
  }>
  timeSeries90d: Array<{
    date: string
    sourced: number
    contacted: number
    responded: number
    assessed: number
    offers: number
    hires: number
  }>
}
