import type { CompanyPathway } from "./types"

export const pathways = [
  {
    id: "path_001",
    title: "Trusted Backend Systems Pathway",
    company: "iNGEN",
    role: "Backend / Infrastructure",
    milestones: [
      { id: "mile_001", title: "Map a reliability-critical service", capability: "systems reasoning", evidenceTypes: ["architecture note", "failure-mode list"], estimatedWeeks: 1, status: "verified" },
      { id: "mile_002", title: "Repair a data consistency bug", capability: "debugging depth", evidenceTypes: ["patch", "test evidence"], estimatedWeeks: 2, status: "in-progress" },
      { id: "mile_003", title: "Write the operating runbook", capability: "operational clarity", evidenceTypes: ["runbook", "handoff memo"], estimatedWeeks: 1, status: "not-started" },
    ],
  },
  {
    id: "path_002",
    title: "Enterprise Product UI Pathway",
    company: "iNGEN",
    role: "Frontend Product Engineering",
    milestones: [
      { id: "mile_004", title: "Rebuild a dense recruiter workflow", capability: "interaction engineering", evidenceTypes: ["typed UI", "storybook states"], estimatedWeeks: 2, status: "submitted" },
      { id: "mile_005", title: "Add accessibility acceptance checks", capability: "inclusive delivery", evidenceTypes: ["audit notes", "test results"], estimatedWeeks: 1, status: "in-progress" },
      { id: "mile_006", title: "Instrument a funnel metric", capability: "product analytics", evidenceTypes: ["event plan", "dashboard screenshot"], estimatedWeeks: 1, status: "not-started" },
    ],
  },
  {
    id: "path_003",
    title: "Applied ML Product Proof Pathway",
    company: "iNGEN",
    role: "ML / Data",
    milestones: [
      { id: "mile_007", title: "Define offline and product metrics", capability: "evaluation judgment", evidenceTypes: ["metric memo", "notebook"], estimatedWeeks: 1, status: "verified" },
      { id: "mile_008", title: "Build a reproducible feature slice", capability: "data reliability", evidenceTypes: ["SQL model", "lineage note"], estimatedWeeks: 2, status: "submitted" },
      { id: "mile_009", title: "Explain model failure modes", capability: "risk communication", evidenceTypes: ["error analysis", "review thread"], estimatedWeeks: 1, status: "not-started" },
    ],
  },
  {
    id: "path_004",
    title: "Recruiter-Ready Product Strategy Pathway",
    company: "iNGEN",
    role: "Product / Design",
    milestones: [
      { id: "mile_010", title: "Synthesize five recruiter interviews", capability: "research synthesis", evidenceTypes: ["interview notes", "insight map"], estimatedWeeks: 2, status: "in-progress" },
      { id: "mile_011", title: "Draft a milestone-driven PRD", capability: "product clarity", evidenceTypes: ["PRD", "success metrics"], estimatedWeeks: 1, status: "submitted" },
      { id: "mile_012", title: "Prototype the handoff experience", capability: "workflow design", evidenceTypes: ["prototype", "usability notes"], estimatedWeeks: 2, status: "not-started" },
    ],
  },
] satisfies CompanyPathway[]
