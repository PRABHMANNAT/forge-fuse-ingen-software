"use client"

import { Fragment, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react"
import { Check, Circle, Pin, PinOff, RotateCcw } from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import { candidates as allCandidates } from "@/lib/demo-data/candidates"
import type { Candidate, CompanyPathway, OpenRole } from "@/lib/demo-data/types"
import { CompareViewEmptyState, CompareViewErrorState, CompareViewLoadingState } from "./CompareView.states"

type Dimension =
  | "overall"
  | "skills"
  | "proof"
  | "integrity"
  | "workRights"
  | "availability"
  | "pathway"
  | "notes"

const dimensionLabels: Record<Dimension, string> = {
  overall: "Header",
  skills: "Skills",
  proof: "Proof strength",
  integrity: "Integrity",
  workRights: "Work rights fit",
  availability: "Availability",
  pathway: "Pathway fit",
  notes: "Recruiter notes",
}

const trustRank: Record<string, number> = {
  "identity-verified": 5,
  "employer-verified": 4,
  "peer-endorsed": 3,
  "self-attested": 2,
  unverified: 1,
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function initials(candidate: Candidate) {
  return candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function activeRole(currentRole: OpenRole | null, roles: OpenRole[]) {
  return currentRole ?? roles[0]
}

function textCorpus(candidate: Candidate) {
  return [
    candidate.headline,
    candidate.readinessScore.role,
    candidate.skills.map((skill) => skill.name).join(" "),
    candidate.tags.join(" "),
    candidate.proofBundles.map((bundle) => bundle.role).join(" "),
  ]
    .join(" ")
    .toLowerCase()
}

function requiredSkills(role: OpenRole) {
  return Array.from(new Set([...role.stack, ...role.mustHaves])).slice(0, 8)
}

function skillMatch(candidate: Candidate, role: OpenRole) {
  const required = requiredSkills(role)
  const corpus = textCorpus(candidate)
  const matched = required.filter((item) => {
    const term = item.toLowerCase()
    return corpus.includes(term) || candidate.skills.some((skill) => term.includes(skill.name.toLowerCase()) || skill.name.toLowerCase().includes(term))
  })
  return { required, matched, score: Math.round((matched.length / Math.max(required.length, 1)) * 100) }
}

function proofScore(candidate: Candidate) {
  const maxTrust = Math.max(...candidate.proofBundles.map((bundle) => trustRank[bundle.trustLevel] ?? 1))
  const artifactCount = candidate.proofBundles.reduce((total, bundle) => total + bundle.artifactCount, 0)
  const freshness = candidate.proofBundles.some((bundle) => bundle.freshness === "fresh") ? 15 : 4
  return Math.min(100, maxTrust * 12 + artifactCount * 2 + freshness)
}

function proofSummary(candidate: Candidate) {
  const topTrust = [...candidate.proofBundles].sort((a, b) => (trustRank[b.trustLevel] ?? 0) - (trustRank[a.trustLevel] ?? 0))[0]
  const artifacts = candidate.proofBundles.reduce((total, bundle) => total + bundle.artifactCount, 0)
  return {
    topTrust,
    artifacts,
    text: `${candidate.proofBundles.length} bundles, ${artifacts} artifacts, ${labelize(topTrust?.trustLevel ?? "unverified")}`,
  }
}

function integrity(candidate: Candidate) {
  const assessments = candidate.assessmentHistory
  const avg = assessments.length
    ? Math.round(assessments.reduce((total, assessment) => total + assessment.score, 0) / assessments.length)
    : 0
  const flags = assessments.reduce((total, assessment) => total + assessment.integrityFlags, 0)
  return { avg, flags, score: Math.max(0, Math.min(100, avg - flags * 12)) }
}

function workRightsFit(candidate: Candidate) {
  if (candidate.workRights === "citizen" || candidate.workRights === "pr") return 100
  if (candidate.workRights === "student-visa-no-sponsorship") return 82
  return 58
}

function availability(candidate: Candidate) {
  const today = new Date("2026-04-17T00:00:00Z")
  const graduate = new Date(`${candidate.graduationDate}T00:00:00Z`)
  const days = Math.ceil((graduate.getTime() - today.getTime()) / 86400000)
  if (days <= 0) return { label: "Available now", score: 100 }
  if (days <= 30) return { label: `Available in ${days} days`, score: 88 }
  if (days <= 90) return { label: `Available ${candidate.graduationDate}`, score: 70 }
  return { label: `Starts after ${candidate.graduationDate}`, score: 54 }
}

function pathwayFit(candidate: Candidate, role: OpenRole, pathways: CompanyPathway[]) {
  const pathway = pathways.find((item) => item.id === role.pathwayId)
  if (!pathway) return { met: 0, total: 0, score: 0 }
  const corpus = textCorpus(candidate)
  const met = pathway.milestones.filter((milestone) => {
    const capabilityTerms = milestone.capability.toLowerCase().split(/\s+/).filter((term) => term.length > 4)
    const evidenceTerms = milestone.evidenceTypes.join(" ").toLowerCase().split(/\s+/).filter((term) => term.length > 4)
    return [...capabilityTerms, ...evidenceTerms].some((term) => corpus.includes(term))
  }).length
  return { met, total: pathway.milestones.length, score: Math.round((met / Math.max(pathway.milestones.length, 1)) * 100) }
}

function dimensionScore(candidate: Candidate, dimension: Dimension, role: OpenRole, pathways: CompanyPathway[]) {
  if (dimension === "overall") return candidate.readinessScore.score
  if (dimension === "skills") return skillMatch(candidate, role).score
  if (dimension === "proof") return proofScore(candidate)
  if (dimension === "integrity") return integrity(candidate).score
  if (dimension === "workRights") return workRightsFit(candidate)
  if (dimension === "availability") return availability(candidate).score
  if (dimension === "pathway") return pathwayFit(candidate, role, pathways).score
  return 0
}

function recommended(candidates: Candidate[], role: OpenRole, pathways: CompanyPathway[]) {
  return [...candidates].sort((a, b) => {
    const scoreA =
      dimensionScore(a, "overall", role, pathways) * 0.3 +
      dimensionScore(a, "skills", role, pathways) * 0.2 +
      dimensionScore(a, "proof", role, pathways) * 0.2 +
      dimensionScore(a, "integrity", role, pathways) * 0.15 +
      dimensionScore(a, "workRights", role, pathways) * 0.1 +
      dimensionScore(a, "pathway", role, pathways) * 0.05
    const scoreB =
      dimensionScore(b, "overall", role, pathways) * 0.3 +
      dimensionScore(b, "skills", role, pathways) * 0.2 +
      dimensionScore(b, "proof", role, pathways) * 0.2 +
      dimensionScore(b, "integrity", role, pathways) * 0.15 +
      dimensionScore(b, "workRights", role, pathways) * 0.1 +
      dimensionScore(b, "pathway", role, pathways) * 0.05
    return scoreB - scoreA
  })[0]
}

function Cell({
  children,
  best,
  pinned,
}: {
  children: ReactNode
  best?: boolean
  pinned?: boolean
}) {
  return (
    <div
      className={cx(
        "min-h-28 border-r border-b border-border bg-surface-elevated p-3",
        best && "border-l border-l-accent",
        pinned && "bg-accent-muted",
      )}
    >
      {children}
    </div>
  )
}

export function CompareView() {
  const { selectedCandidates, shortlist, results, currentRole, roles, pathways, setSelectedCandidates, openCandidateDrawer, openSurface } = useAgentStore()
  const role = activeRole(currentRole, roles)
  const fallbackIds = selectedCandidates.length > 0 ? selectedCandidates : shortlist.length > 0 ? shortlist : results.map((candidate) => candidate.id)
  const sourceCandidates = fallbackIds
    .map((candidateId) => allCandidates.find((candidate) => candidate.id === candidateId))
    .filter(Boolean)
    .slice(0, 5) as Candidate[]
  const initialIds = sourceCandidates.map((candidate) => candidate.id)
  const [orderedIds, setOrderedIds] = useState(initialIds)
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [selectedDimension, setSelectedDimension] = useState<Dimension>("overall")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const isLoading = false
  const error: string | null = null

  useEffect(() => {
    setOrderedIds(initialIds)
  }, [initialIds.join("|")])

  const candidates = useMemo(() => {
    const byId = new Map(sourceCandidates.map((candidate) => [candidate.id, candidate]))
    const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Candidate[]
    const missing = sourceCandidates.filter((candidate) => !orderedIds.includes(candidate.id))
    const merged = [...ordered, ...missing].slice(0, 5)
    const pinned = merged.filter((candidate) => pinnedIds.includes(candidate.id))
    const unpinned = merged.filter((candidate) => !pinnedIds.includes(candidate.id))
    return [...pinned, ...unpinned]
  }, [orderedIds, pinnedIds, sourceCandidates])

  const dimensions: Dimension[] = ["overall", "skills", "proof", "integrity", "workRights", "availability", "pathway", "notes"]
  const bestByDimension = useMemo(() => {
    return dimensions.reduce(
      (acc, dimension) => {
        if (dimension === "notes") return acc
        const scores = candidates.map((candidate) => ({
          id: candidate.id,
          score: dimensionScore(candidate, dimension, role, pathways),
        }))
        const bestScore = Math.max(...scores.map((item) => item.score))
        acc[dimension] = scores.filter((item) => item.score === bestScore).map((item) => item.id)
        return acc
      },
      {} as Record<Dimension, string[]>,
    )
  }, [candidates, dimensions, pathways, role])

  const pick = recommended(candidates, role, pathways)

  function togglePin(index: number) {
    const candidate = candidates[index]
    if (!candidate) return
    setPinnedIds((current) =>
      current.includes(candidate.id) ? current.filter((id) => id !== candidate.id) : [...current, candidate.id],
    )
  }

  function rerank() {
    if (selectedDimension === "notes") return
    setOrderedIds([...candidates].sort((a, b) => dimensionScore(b, selectedDimension, role, pathways) - dimensionScore(a, selectedDimension, role, pathways)).map((candidate) => candidate.id))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
    if (/^[1-5]$/.test(event.key)) {
      event.preventDefault()
      togglePin(Number(event.key) - 1)
    }
    if (event.key.toLowerCase() === "r") {
      event.preventDefault()
      rerank()
    }
  }

  if (error) {
    return <CompareViewErrorState onRetry={() => setOrderedIds(initialIds)} />
  }

  if (isLoading) {
    return <CompareViewLoadingState />
  }

  if (candidates.length === 0) {
    return (
      <CompareViewEmptyState
        onCompareTopThree={() => {
          const topThree = results.slice(0, 3).map((candidate) => candidate.id)
          setSelectedCandidates(topThree)
        }}
        onOpenResults={() => openSurface("results_table")}
      />
    )
  }

  return (
    <div tabIndex={0} onKeyDown={handleKeyDown} className="flex h-full min-h-0 flex-col bg-bg text-text outline-none">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Compare view</div>
            <div className="font-display text-3xl uppercase leading-none text-text">{candidates.length} candidates against {role.title}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
            <span className="border border-border bg-surface-elevated px-2 py-1">1..5 pin columns</span>
            <span className="border border-border bg-surface-elevated px-2 py-1">R rerank by {dimensionLabels[selectedDimension]}</span>
            <button
              type="button"
              onClick={() => {
                setPinnedIds([])
                setOrderedIds(initialIds)
                setSelectedCandidates(initialIds)
              }}
              className="inline-flex items-center gap-1 border border-border bg-surface-elevated px-2 py-1 hover:text-text"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `180px repeat(${candidates.length}, minmax(250px, 1fr))` }}
        >
          <div className="sticky left-0 top-0 z-30 border-r border-b border-border bg-surface p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Dimension</div>
            <div className="mt-2 text-sm font-semibold text-text">Candidate headers</div>
          </div>
          {candidates.map((candidate, index) => {
            const pinned = pinnedIds.includes(candidate.id)
            return (
              <div key={candidate.id} className={cx("sticky top-0 z-20 border-r border-b border-border bg-surface p-3", pinned && "bg-accent-muted")}>
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => openCandidateDrawer(candidate.id)} className="flex min-w-0 items-center gap-3 text-left">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-accent bg-surface font-mono text-[10px] font-semibold text-text">
                      {initials(candidate)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-text">{candidate.name}</div>
                      <div className="font-mono text-[10px] uppercase text-text-subtle">{candidate.id}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePin(index)}
                    className="text-text-subtle hover:text-text"
                    aria-label={`Pin ${candidate.name}`}
                    aria-pressed={pinned}
                  >
                    {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="font-display text-4xl uppercase leading-none text-text">{candidate.readinessScore.score}</span>
                  <span className="font-mono text-[10px] uppercase text-text-subtle">overall</span>
                </div>
              </div>
            )
          })}

          {dimensions.map((dimension) => (
            <Fragment key={dimension}>
              <button
                key={`${dimension}-label`}
                type="button"
                onClick={() => setSelectedDimension(dimension)}
                aria-pressed={selectedDimension === dimension}
                className={cx(
                  "sticky left-0 z-10 border-r border-b border-border bg-surface p-3 text-left",
                  selectedDimension === dimension && "bg-accent-muted",
                )}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Compare</div>
                <div className="mt-2 text-sm font-semibold text-text">{dimensionLabels[dimension]}</div>
              </button>
              {candidates.map((candidate) => {
                const best = bestByDimension[dimension]?.includes(candidate.id)
                const pinned = pinnedIds.includes(candidate.id)
                const skills = skillMatch(candidate, role)
                const proof = proofSummary(candidate)
                const integ = integrity(candidate)
                const avail = availability(candidate)
                const path = pathwayFit(candidate, role, pathways)

                if (dimension === "overall") {
                  return (
                    <Cell key={`${dimension}-${candidate.id}`} best={best} pinned={pinned}>
                      <div className="font-display text-5xl uppercase leading-none text-text">{candidate.readinessScore.score}</div>
                      <div className="mt-2 text-xs text-text-muted">{candidate.readinessScore.role}</div>
                    </Cell>
                  )
                }

                if (dimension === "skills") {
                  return (
                    <Cell key={`${dimension}-${candidate.id}`} best={best} pinned={pinned}>
                      <div className="font-mono text-sm font-semibold text-text">{skills.matched.length}/{skills.required.length} matched</div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {skills.required.map((skill) => {
                          const matched = skills.matched.includes(skill)
                          return (
                            <span key={skill} className={cx("border px-1.5 py-0.5 font-mono text-[10px] uppercase", matched ? "border-accent text-text" : "border-border text-text-subtle")}>
                              {matched ? <Check className="mr-1 inline h-3 w-3" /> : null}
                              {skill}
                            </span>
                          )
                        })}
                      </div>
                    </Cell>
                  )
                }

                if (dimension === "proof") {
                  return (
                    <Cell key={`${dimension}-${candidate.id}`} best={best} pinned={pinned}>
                      <div className="text-sm font-semibold text-text">{proof.text}</div>
                      <div className="mt-3 grid grid-cols-3 gap-px bg-border">
                        <div className="bg-surface p-2"><div className="font-mono text-[10px] text-text-subtle">Bundles</div><div className="font-mono text-sm text-text">{candidate.proofBundles.length}</div></div>
                        <div className="bg-surface p-2"><div className="font-mono text-[10px] text-text-subtle">Artifacts</div><div className="font-mono text-sm text-text">{proof.artifacts}</div></div>
                        <div className="bg-surface p-2"><div className="font-mono text-[10px] text-text-subtle">Trust</div><div className="font-mono text-sm text-text">{trustRank[proof.topTrust?.trustLevel ?? "unverified"]}</div></div>
                      </div>
                    </Cell>
                  )
                }

                if (dimension === "integrity") {
                  return (
                    <Cell key={`${dimension}-${candidate.id}`} best={best} pinned={pinned}>
                      <div className="font-mono text-sm font-semibold text-text">{integ.avg || "NA"} assessment avg</div>
                      <div
                        className={cx(
                          "mt-2 w-fit border px-2 py-1 font-mono text-[10px] uppercase",
                          integ.flags === 0
                            ? "border-success bg-success-soft text-text"
                            : "border-warning bg-warning-soft text-text",
                        )}
                      >
                        {integ.flags} integrity flags
                      </div>
                      <div className="mt-3 text-xs text-text-muted">{candidate.assessmentHistory[0]?.name ?? "No assessment record"}</div>
                    </Cell>
                  )
                }

                if (dimension === "workRights") {
                  return (
                    <Cell key={`${dimension}-${candidate.id}`} best={best} pinned={pinned}>
                      <div className="text-sm font-semibold text-text">{labelize(candidate.workRights)}</div>
                      <div className="mt-2 text-xs text-text-muted">
                        {workRightsFit(candidate) >= 90 ? "No sponsorship blocker in fixture." : "Recruiter review needed before final stage."}
                      </div>
                    </Cell>
                  )
                }

                if (dimension === "availability") {
                  return (
                    <Cell key={`${dimension}-${candidate.id}`} best={best} pinned={pinned}>
                      <div className="text-sm font-semibold text-text">{avail.label}</div>
                      <div className="mt-2 font-mono text-[10px] uppercase text-text-subtle">Graduation {candidate.graduationDate}</div>
                    </Cell>
                  )
                }

                if (dimension === "pathway") {
                  return (
                    <Cell key={`${dimension}-${candidate.id}`} best={best} pinned={pinned}>
                      <div className="font-mono text-sm font-semibold text-text">{path.met}/{path.total} milestones</div>
                      <div className="mt-2 text-xs text-text-muted">{role.pathwayId ?? "No pathway"} against loaded role</div>
                      <div className="mt-3 flex gap-1">
                        {Array.from({ length: Math.max(path.total, 1) }).map((_, index) => (
                          <span key={index} className={cx("h-4 w-4 border border-border-strong", index < path.met ? "bg-accent" : "bg-surface")} />
                        ))}
                      </div>
                    </Cell>
                  )
                }

                return (
                  <Cell key={`${dimension}-${candidate.id}`} pinned={pinned}>
                    <textarea
                      value={notes[candidate.id] ?? ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [candidate.id]: event.target.value }))}
                      placeholder="Add comparison note."
                      aria-label={`Comparison note for ${candidate.name}`}
                      className="h-24 w-full resize-none border border-border bg-surface p-2 text-xs leading-5 text-text outline-none placeholder:text-text-subtle focus:border-accent"
                    />
                  </Cell>
                )
              })}
            </Fragment>
          ))}
        </div>
      </main>

      {pick ? (
        <footer className="border-t border-border bg-surface p-4">
          <div className="flex items-start gap-4">
            <div className="border border-accent bg-accent-muted px-3 py-2 text-center">
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Recommended hire</div>
              <div className="mt-1 text-sm font-semibold text-text">{pick.name}</div>
            </div>
            <p className="max-w-4xl text-sm leading-6 text-text-muted">
              Aristotle recommends {pick.name} because the header readiness cell is {pick.readinessScore.score}, the skills row covers {skillMatch(pick, role).matched.length}/{skillMatch(pick, role).required.length} required signals, proof strength shows {proofSummary(pick).text}, and integrity records {integrity(pick).flags} flags. The remaining check is {workRightsFit(pick) >= 90 ? "stage timing" : "work-rights review"} before offer motion.
            </p>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
