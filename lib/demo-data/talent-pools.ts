import type { TalentPool } from "./types"

export const talentPools = [
  {
    id: "pool_001",
    name: "Rust Backend Shortlist",
    description: "High-proof Rust and backend candidates ready for hiring-manager review.",
    candidateIds: ["cand_001", "cand_002", "cand_003", "cand_004", "cand_005"],
    filterCriteria: {
      locations: ["Bengaluru", "Sydney", "Singapore", "Melbourne", "Toronto"],
      skills: ["Rust", "Distributed Systems", "Service Reliability"],
      minReadinessScore: 82,
      pipelineStages: ["contacted", "responded", "assessment", "tryout", "interview"],
      tags: ["rust-backend"],
    },
  },
  {
    id: "pool_002",
    name: "Frontend Product Bench",
    description: "React candidates with product surface proof and accessible UI evidence.",
    candidateIds: ["cand_007", "cand_008", "cand_009", "cand_010", "cand_020"],
    filterCriteria: {
      skills: ["React", "TypeScript", "Design Systems"],
      minReadinessScore: 75,
      tags: ["frontend", "product-engineer"],
    },
  },
  {
    id: "pool_003",
    name: "Visa-Sensitive Early Talent",
    description: "Strong students requiring sponsorship decisions before late-stage interviews.",
    candidateIds: ["cand_001", "cand_008", "cand_015", "cand_017", "cand_020"],
    filterCriteria: {
      workRights: ["student-visa-sponsorship-required"],
      minReadinessScore: 75,
      tags: ["needs-sponsorship"],
    },
  },
] satisfies TalentPool[]
