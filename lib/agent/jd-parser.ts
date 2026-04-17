export type ParsedCapabilityType = "must-have" | "nice-to-have" | "anti-pattern"

export type ParsedCapability = {
  id: string
  name: string
  type: ParsedCapabilityType
  evidenceExpected: Array<"artifact" | "assessment" | "tryout" | "endorsement">
  weight: number
}

const skillDictionary = [
  "Rust",
  "React",
  "TypeScript",
  "Next.js",
  "PostgreSQL",
  "Kafka",
  "AWS",
  "Kubernetes",
  "Terraform",
  "Python",
  "SQL",
  "PyTorch",
  "Design Systems",
  "Accessibility",
  "Product Analytics",
  "User Research",
  "Experimentation",
  "Observability",
  "Security",
  "Distributed Systems",
  "CI/CD",
  "GraphQL",
  "Go",
]

const antiPatterns = [
  "credential-only screening",
  "years-only requirement",
  "take-home without scope",
  "vague ownership",
]

function normalizeWeight(index: number, total: number) {
  if (total <= 0) return 0
  const base = Math.floor(100 / total)
  const remainder = 100 - base * total
  return base + (index < remainder ? 1 : 0)
}

function evidenceFor(name: string): ParsedCapability["evidenceExpected"] {
  const lower = name.toLowerCase()
  if (lower.includes("research") || lower.includes("design")) return ["artifact", "endorsement"]
  if (lower.includes("security") || lower.includes("observability")) return ["artifact", "assessment"]
  if (lower.includes("analytics") || lower.includes("sql") || lower.includes("python")) return ["artifact", "assessment"]
  return ["artifact", "tryout"]
}

export function parseJD(input: string): ParsedCapability[] {
  const lower = input.toLowerCase()
  const foundSkills = skillDictionary.filter((skill) => lower.includes(skill.toLowerCase()))
  const mustHaveHints = ["must", "required", "production", "ownership", "core", "critical"]
  const niceHints = ["nice", "bonus", "preferred", "plus", "familiar"]

  const capabilities = foundSkills.map((skill, index) => {
    const skillIndex = lower.indexOf(skill.toLowerCase())
    const window = lower.slice(Math.max(0, skillIndex - 80), skillIndex + 120)
    const type: ParsedCapabilityType = mustHaveHints.some((hint) => window.includes(hint))
      ? "must-have"
      : niceHints.some((hint) => window.includes(hint))
        ? "nice-to-have"
        : index < 4
          ? "must-have"
          : "nice-to-have"

    return {
      id: `cap_${String(index + 1).padStart(3, "0")}`,
      name: skill,
      type,
      evidenceExpected: evidenceFor(skill),
      weight: 0,
    }
  })

  const inferredAntiPatterns = antiPatterns
    .filter((item) => lower.includes(item.split(" ")[0]) || lower.includes("years") || lower.includes("degree"))
    .slice(0, 2)
    .map((name, index) => ({
      id: `cap_ap_${String(index + 1).padStart(3, "0")}`,
      name,
      type: "anti-pattern" as ParsedCapabilityType,
      evidenceExpected: ["endorsement"] as ParsedCapability["evidenceExpected"],
      weight: 0,
    }))

  const merged = [...capabilities, ...inferredAntiPatterns]
  const weighted = merged.map((capability, index) => ({
    ...capability,
    weight: capability.type === "anti-pattern" ? 0 : normalizeWeight(index, capabilities.length),
  }))

  if (weighted.length > 0) return weighted

  return [
    {
      id: "cap_001",
      name: "Role-specific proof",
      type: "must-have",
      evidenceExpected: ["artifact", "assessment"],
      weight: 40,
    },
    {
      id: "cap_002",
      name: "Execution judgment",
      type: "must-have",
      evidenceExpected: ["tryout", "artifact"],
      weight: 35,
    },
    {
      id: "cap_003",
      name: "Communication clarity",
      type: "nice-to-have",
      evidenceExpected: ["endorsement"],
      weight: 25,
    },
  ]
}
