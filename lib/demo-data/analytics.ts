import type { AnalyticsSummary } from "./types"

const start = Date.UTC(2026, 0, 18)
const dayMs = 24 * 60 * 60 * 1000

export const analytics = {
  funnelCounts: {
    sourced: 1284,
    contacted: 412,
    responded: 167,
    assessed: 89,
    tryout: 31,
    interviewed: 18,
    offered: 6,
    hired: 3,
  },
  timeToContactHours: 18.6,
  timeToContactPercentiles: {
    p50: 14.2,
    p90: 41.8,
  },
  responseRate: 0.405,
  assessmentCompletionRate: 0.742,
  integrityFlagRate: 0.087,
  offerRate: 0.333,
  timeToContactSeries90d: Array.from({ length: 90 }, (_, index) => {
    const date = new Date(start + index * dayMs).toISOString().slice(0, 10)
    const p50 = 13 + (index % 6) * 0.9 + (index % 11 === 0 ? 2.4 : 0) - (index > 60 ? 1.1 : 0)
    const p90 = 36 + (index % 8) * 1.9 + (index % 17 === 0 ? 6 : 0) - (index > 58 ? 2.3 : 0)
    return {
      date,
      p50: Number(p50.toFixed(1)),
      p90: Number(p90.toFixed(1)),
    }
  }),
  poolHealth: [
    {
      poolId: "pool_001",
      freshnessScore: 92,
      matchDecayScore: 14,
      refreshedAt: "2026-04-17T08:40:00Z",
    },
    {
      poolId: "pool_002",
      freshnessScore: 81,
      matchDecayScore: 23,
      refreshedAt: "2026-04-16T17:15:00Z",
    },
    {
      poolId: "pool_003",
      freshnessScore: 68,
      matchDecayScore: 37,
      refreshedAt: "2026-04-14T10:05:00Z",
    },
  ],
  trustDistribution: {
    unverified: 0,
    "self-attested": 0,
    "peer-endorsed": 1,
    "employer-verified": 2,
    "identity-verified": 2,
  },
  pathwayEffectiveness: [
    {
      pathwayId: "path_001",
      completedHireRate: 0.182,
      incompleteHireRate: 0.061,
      completedCount: 22,
      incompleteCount: 49,
    },
    {
      pathwayId: "path_002",
      completedHireRate: 0.154,
      incompleteHireRate: 0.048,
      completedCount: 26,
      incompleteCount: 58,
    },
    {
      pathwayId: "path_003",
      completedHireRate: 0.133,
      incompleteHireRate: 0.039,
      completedCount: 15,
      incompleteCount: 51,
    },
    {
      pathwayId: "path_004",
      completedHireRate: 0.121,
      incompleteHireRate: 0.034,
      completedCount: 18,
      incompleteCount: 44,
    },
  ],
  timeSeries90d: Array.from({ length: 90 }, (_, index) => {
    const date = new Date(start + index * dayMs).toISOString().slice(0, 10)
    const weeklyPulse = index % 7
    return {
      date,
      sourced: 8 + (index % 9) + (weeklyPulse === 2 ? 6 : 0),
      contacted: 3 + (index % 5),
      responded: 1 + (index % 4),
      assessed: index % 3 === 0 ? 2 : 1,
      offers: index > 45 && index % 16 === 0 ? 1 : 0,
      hires: index > 60 && index % 29 === 0 ? 1 : 0,
    }
  }),
} satisfies AnalyticsSummary
