import type { Intent } from "./types"

const SKILL_KEYWORDS = [
  "rust",
  "react",
  "typescript",
  "backend",
  "frontend",
  "ml",
  "data",
  "sre",
  "terraform",
  "kubernetes",
  "design",
  "product",
]

const STAGES = ["new", "contacted", "responded", "assessment", "tryout", "interview", "offer", "hired", "nurture", "rejected"]

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function extractCount(input: string) {
  const match = input.match(/\btop\s+(\d+)|\b(\d+)\s+(?:candidates|people|profiles|matches)/i)
  if (!match) return undefined
  return Number(match[1] || match[2])
}

function extractSkills(input: string) {
  const lower = input.toLowerCase()
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill))
}

function extractNames(input: string) {
  const moveMatch = input.match(/move\s+(.+?)\s+to\s+/i)
  if (!moveMatch) return []
  return moveMatch[1]
    .split(/,| and /i)
    .map((name) => titleCase(name))
    .filter(Boolean)
}

export function parseIntent(input: string): { intent: Intent; entities: Record<string, any> } {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()
  const skills = extractSkills(lower)
  const count = extractCount(lower)

  if (!trimmed) return { intent: "unknown", entities: {} }

  if (/\b(show|open|view)\s+(analytics|stats|funnel|metrics)\b/.test(lower)) {
    return { intent: "show_analytics", entities: { rangeDays: lower.includes("90") ? 90 : undefined } }
  }

  if (/\b(export|download)\b.*\b(shortlist|list|csv|pdf|json)\b/.test(lower)) {
    const format = lower.match(/\b(csv|json|pdf)\b/)?.[1]
    return { intent: "export_shortlist", entities: { format } }
  }

  if (/\b(show|explain)\b.*\bwhy\b|\branks above\b|\bmatch explanation\b/.test(lower)) {
    const candidate = trimmed.match(/(?:why|show why|explain)\s+([a-z][a-z\s'-]+?)(?:\s+ranks|\s+matches|\s+is|\?|$)/i)?.[1]
    return { intent: "explain_match", entities: { candidate: candidate ? titleCase(candidate) : undefined } }
  }

  if (/\b(open|view|show)\b.*\b(candidate|profile)\b/.test(lower)) {
    const candidate = trimmed.match(/(?:open|view|show)\s+(?:candidate|profile)?\s*([a-z][a-z\s'-]+)$/i)?.[1]
    return { intent: "open_candidate", entities: { candidate: candidate ? titleCase(candidate) : undefined } }
  }

  if (/\bmove\b.*\bto\b/.test(lower)) {
    const stage = STAGES.find((item) => lower.includes(`to ${item}`))
    return { intent: "move_pipeline", entities: { names: extractNames(trimmed), stage } }
  }

  if (/\b(launch|send|start)\b.*\b(assessment|screen|test)\b/.test(lower)) {
    const target = lower.includes("shortlisted") || lower.includes("shortlist") ? "shortlist" : lower.includes("selected") ? "selected" : undefined
    return { intent: "launch_assessment", entities: { target, count } }
  }

  if (/\b(build|create|draft)\b.*\b(pathway|milestone)\b/.test(lower)) {
    const role = trimmed.match(/(?:for|role)\s+([a-z][a-z\s/-]+)$/i)?.[1]
    return { intent: "build_pathway", entities: { role: role ? titleCase(role) : undefined } }
  }

  if (/\b(create|draft|new)\b.*\b(role|jd|job)\b/.test(lower)) {
    const title = trimmed.match(/(?:role|job|jd)\s+(?:for\s+)?([a-z][a-z\s/-]+)$/i)?.[1]
    return { intent: "create_role", entities: { title: title ? titleCase(title) : undefined, skills } }
  }

  if (/\b(contact|email|message|reach out)\b/.test(lower)) {
    return { intent: "contact_candidates", entities: { count, skills } }
  }

  if (/\bsave\b.*\b(shortlist|pool|list)\b|\bsave as\b/.test(lower)) {
    const name = trimmed.match(/save(?:\s+as)?\s+(.+?)(?:\s+shortlist|\s+pool|\s+list)?$/i)?.[1]
    return { intent: "save_pool", entities: { name: name ? titleCase(name.replace(/\b(shortlist|pool|list)\b/gi, "")) : "Saved Pool" } }
  }

  if (/\bcompare\b/.test(lower)) {
    return { intent: "compare_candidates", entities: { count: count ?? 3 } }
  }

  if (/\b(filter|only|with|without)\b/.test(lower) && (skills.length || /\bvisa|sponsorship|fresh|score\b/.test(lower))) {
    return {
      intent: "filter_results",
      entities: {
        skills,
        workRights: lower.includes("sponsorship") ? ["student-visa-sponsorship-required"] : undefined,
        proofFreshness: lower.includes("fresh") ? "fresh" : undefined,
        minReadinessScore: Number(lower.match(/score\s*(?:above|over|>=?)\s*(\d+)/)?.[1]) || undefined,
      },
    }
  }

  if (/\b(find|search|source|show|get|list)\b/.test(lower)) {
    return {
      intent: "search_candidates",
      entities: {
        seniority: lower.match(/\b(senior|junior|staff|principal|associate)\b/)?.[1],
        skills,
        proofFocus: lower.match(/\b(backend|frontend|design|ml|data|infra|sre)\s+proof\b/)?.[1],
        limit: count,
      },
    }
  }

  return { intent: "unknown", entities: { input: trimmed } }
}
