"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Minus, X } from "lucide-react"
import { ProofBundle } from "@/components/command-center/proof/ProofBundle"
import { ProofReviewSurface } from "@/components/command-center/proof/ProofReviewSurface"
import type { ProofItem } from "@/components/command-center/proof/ProofCard"
import { useAgentStore } from "@/lib/agent/store"
import { candidates } from "@/lib/demo-data/candidates"
import { outreachThreads } from "@/lib/demo-data/messages"
import type { Candidate, CandidateProofBundle, OpenRole } from "@/lib/demo-data/types"
import {
  CandidateDrawerEmptyState,
  CandidateDrawerErrorState,
  CandidateDrawerLoadingState,
} from "./CandidateDrawer.states"

const drawerScrollMemory = new Map<string, number>()

const trustLevels = [
  "unverified",
  "self-attested",
  "peer-endorsed",
  "employer-verified",
  "identity-verified",
] as const

const evidenceTypes = ["artifact", "assessment", "endorsement", "tryout"] as const

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function avatarInitials(candidate: Candidate) {
  return candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function primaryBundle(candidate: Candidate) {
  return candidate.proofBundles[0]
}

function roleScore(candidate: Candidate, role: OpenRole) {
  const candidateTerms = [
    ...candidate.skills.map((skill) => skill.name.toLowerCase()),
    ...candidate.tags.map((tag) => tag.toLowerCase()),
    candidate.headline.toLowerCase(),
    candidate.readinessScore.role.toLowerCase(),
  ]
  const roleTerms = [...role.stack, ...role.mustHaves, ...role.niceToHaves].map((term) => term.toLowerCase())
  const matches = roleTerms.filter((term) => candidateTerms.some((candidateTerm) => candidateTerm.includes(term) || term.includes(candidateTerm)))
  const adjustment = Math.min(8, matches.length * 2) - (roleTerms.length - matches.length > 6 ? 4 : 0)
  return Math.max(54, Math.min(98, candidate.readinessScore.score + adjustment))
}

function roleBreakdown(candidate: Candidate, role: OpenRole) {
  const score = roleScore(candidate, role)
  const delta = score - candidate.readinessScore.score
  return {
    skills: Math.max(45, Math.min(99, candidate.readinessScore.breakdown.skills + delta)),
    proof: Math.max(45, Math.min(99, candidate.readinessScore.breakdown.proof + Math.round(delta / 2))),
    integrity: candidate.readinessScore.breakdown.integrity,
    depth: Math.max(45, Math.min(99, candidate.readinessScore.breakdown.depth + Math.round(delta / 2))),
  }
}

function trustFacts(candidate: Candidate) {
  const bundle = primaryBundle(candidate)
  const verified = [
    `${candidate.skills.filter((skill) => skill.verified).length} verified skills with dated evidence`,
    `${bundle.artifactCount} artifacts in ${labelize(bundle.trustLevel)} proof bundle`,
    candidate.assessmentHistory.length > 0 ? `${candidate.assessmentHistory.length} completed assessment record` : "No completed assessment",
  ].filter(Boolean)
  const unverified = [
    candidate.skills.some((skill) => !skill.verified) ? "Some skill claims remain unverified" : "",
    bundle.freshness === "stale" ? "Primary proof bundle needs refresh" : "",
    candidate.workRights.includes("sponsorship") ? "Sponsorship timing needs recruiter review" : "",
  ].filter(Boolean)
  return { verified, unverified }
}

function capabilityState(candidate: Candidate, skillName: string, evidenceType: (typeof evidenceTypes)[number]) {
  const skill = candidate.skills.find((item) => item.name === skillName)
  if (!skill) return "dash"
  if (evidenceType === "artifact") return skill.verified ? "tick" : "dot"
  if (evidenceType === "assessment") return candidate.assessmentHistory.length > 0 && skill.proficiency >= 4 ? "tick" : "dot"
  if (evidenceType === "endorsement") return primaryBundle(candidate).trustLevel.includes("verified") || primaryBundle(candidate).trustLevel === "peer-endorsed" ? "tick" : "dash"
  if (evidenceType === "tryout") return candidate.pipelineStage === "tryout" || candidate.pipelineStage === "interview" ? "dot" : "dash"
  return "dash"
}

function StateGlyph({ state }: { state: "tick" | "dot" | "dash" }) {
  if (state === "tick") return <Check className="h-3.5 w-3.5 text-success" />
  if (state === "dot") return <Circle className="h-2.5 w-2.5 fill-info text-info" />
  return <Minus className="h-3.5 w-3.5 text-text-subtle" />
}

function timeline(candidate: Candidate) {
  const thread = outreachThreads.find((item) => item.candidateId === candidate.id)
  const events = [
    ...candidate.skills.slice(0, 4).map((skill) => ({
      date: skill.lastEvidence,
      label: `${skill.name} evidence updated`,
      meta: skill.verified ? "verified skill" : "self-attested skill",
    })),
    ...candidate.assessmentHistory.map((assessment) => ({
      date: assessment.completedAt,
      label: assessment.name,
      meta: `${assessment.score}/100 assessment - ${assessment.integrityFlags} flags`,
    })),
    ...(thread?.messages ?? []).map((message) => ({
      date: message.sentAt,
      label: message.sender === "candidate" ? "Candidate response" : `${labelize(message.sender)} outreach`,
      meta: message.body,
    })),
  ]
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
}

function verifierSource(bundle: CandidateProofBundle) {
  if (bundle.trustLevel === "employer-verified") return "Verified via employer review - verified by employer @ Redacted Co"
  if (bundle.trustLevel === "identity-verified") return "Verified via identity check - verified by iNGEN trust ops"
  if (bundle.trustLevel === "peer-endorsed") return "Verified via peer endorsement - endorsed by project reviewer"
  if (bundle.trustLevel === "self-attested") return "Self-attested by candidate - source pending reviewer confirmation"
  return "Unverified source - recruiter review required"
}

function proofItemsForBundle(candidate: Candidate, bundle: CandidateProofBundle): ProofItem[] {
  const verifiedSkills = candidate.skills.filter((skill) => skill.verified)
  const primarySkill = verifiedSkills[0] ?? candidate.skills[0]
  const assessment = candidate.assessmentHistory[0]
  const stack = candidate.githubSignal?.languages ?? candidate.skills.slice(0, 4).map((skill) => skill.name)
  const trust = { state: bundle.trustLevel, verifierSource: verifierSource(bundle) }

  return [
    {
      id: `${bundle.id}_artifact`,
      title: `${primarySkill?.name ?? bundle.role} implementation artifact`,
      role: bundle.role,
      freshness: bundle.freshness,
      artifact: {
        artifactType: "code",
        title: `${candidate.name.split(" ")[0]} reviewed implementation slice`,
        language: stack[0] ?? "TypeScript",
        code: `async function verify${(primarySkill?.name ?? "Proof").replace(/[^a-zA-Z]/g, "")}Signal(candidate) {\n  const evidence = await proofBundle.load(candidate.id)\n  return evidence.artifacts.filter(item => item.role === "${bundle.role}")\n}`,
      },
      problem: `Hiring team needed direct evidence for ${bundle.role.toLowerCase()} capability, not resume claims.`,
      contribution: `${candidate.name.split(" ")[0]} shipped a reviewed artifact tied to ${primarySkill?.name ?? bundle.role} execution.`,
      outcome: `${bundle.artifactCount} artifacts mapped to ${candidate.readinessScore.score}/100 readiness for recruiter review.`,
      stack,
      metrics: [
        { label: "Artifacts", value: bundle.artifactCount },
        { label: "Ready", value: candidate.readinessScore.score },
        { label: "Flags", value: assessment?.integrityFlags ?? 0 },
      ],
      trust,
    },
    {
      id: `${bundle.id}_assessment`,
      title: assessment?.name ?? `${bundle.role} assessment record`,
      role: bundle.role,
      freshness: assessment ? "fresh" : bundle.freshness,
      artifact: {
        artifactType: "link",
        title: assessment?.name ?? "Assessment evidence pending",
        domain: "ingen.local",
        description: assessment
          ? `${assessment.score}/100 assessment with ${assessment.integrityFlags} integrity flags.`
          : "No assessment has been completed for this bundle yet.",
      },
      problem: "Recruiter needed a normalized work-sample signal against the active role rubric.",
      contribution: `${candidate.name.split(" ")[0]} completed a scoped assessment with traceable evidence and integrity metadata.`,
      outcome: assessment ? `${assessment.score}/100 score recorded with ${assessment.integrityFlags} integrity flags.` : "Assessment launch remains available from the drawer.",
      stack: candidate.skills.slice(0, 4).map((skill) => skill.name),
      metrics: assessment
        ? [
            { label: "Score", value: assessment.score },
            { label: "Flags", value: assessment.integrityFlags },
            { label: "Proof", value: bundle.artifactCount },
          ]
        : [{ label: "Status", value: "Open" }],
      trust,
    },
    {
      id: `${bundle.id}_outcome`,
      title: `${bundle.role} outcome narrative`,
      role: bundle.role,
      freshness: bundle.freshness,
      artifact: {
        artifactType: "thumbnail",
        title: `${candidate.name.split(" ")[0]} proof summary`,
        description: `${bundle.artifactCount} artifacts, ${verifiedSkills.length} verified skills, ${candidate.githubSignal?.shippedProjects ?? 0} shipped projects.`,
      },
      problem: "Hiring manager needed a concise link between proof, trust, and role readiness.",
      contribution: `${candidate.name.split(" ")[0]} connected artifact evidence to measurable role outcomes and reviewable skills.`,
      outcome: `${verifiedSkills.length} verified skills and ${candidate.githubSignal?.shippedProjects ?? "no"} shipped project signal in the record.`,
      stack: candidate.skills.map((skill) => skill.name),
      metrics: [
        { label: "Skills", value: verifiedSkills.length },
        { label: "Projects", value: candidate.githubSignal?.shippedProjects ?? 0 },
        { label: "Trust", value: labelize(bundle.trustLevel).split(" ")[0] },
      ],
      trust,
    },
  ]
}

export function CandidateDrawer() {
  const {
    results,
    selectedCandidates,
    currentRole,
    currentPathway,
    roles,
    pathways,
    closeSurface,
    openSurface,
    openCandidateDrawer,
    setSelectedCandidates,
  } = useAgentStore()
  const resultSet = results.length > 0 ? results : candidates
  const selectedId = selectedCandidates[0] ?? resultSet[0]?.id
  const candidate = resultSet.find((item) => item.id === selectedId) ?? candidates.find((item) => item.id === selectedId) ?? resultSet[0]
  const isLoading = false
  const initialRoleId = currentRole?.id ?? roles.find((role) => role.title === candidate?.readinessScore.role)?.id ?? roles[0]?.id
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId)
  const [activeBundleId, setActiveBundleId] = useState(candidate?.proofBundles[0]?.id)
  const [reviewProof, setReviewProof] = useState<ProofItem | null>(null)
  const [notes, setNotes] = useState("Tag @hiring-manager after proof portfolio review. Ask about preferred tryout window and work-rights timing.")
  const scrollRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    return <CandidateDrawerLoadingState />
  }

  if (!selectedId && !candidate) {
    return (
      <CandidateDrawerEmptyState
        onOpenResults={() => openSurface("results_table")}
        onOpenCompare={() => openSurface("compare_view")}
        onLoadRole={() => openSurface("role_builder")}
      />
    )
  }

  if (!candidate) {
    return <CandidateDrawerErrorState onRetry={() => openCandidateDrawer(resultSet[0]?.id ?? candidates[0]?.id ?? "")} />
  }

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0]
  const score = roleScore(candidate, selectedRole)
  const breakdown = roleBreakdown(candidate, selectedRole)
  const bundle = candidate.proofBundles.find((item) => item.id === activeBundleId) ?? candidate.proofBundles[0]
  const trust = trustFacts(candidate)
  const candidateIndex = resultSet.findIndex((item) => item.id === candidate.id)
  const pathway =
    currentPathway ??
    pathways.find((item) => item.id === selectedRole.pathwayId) ??
    pathways.find((item) => item.role.toLowerCase().includes(selectedRole.title.split(" ")[0].toLowerCase()))

  useEffect(() => {
    setSelectedRoleId(initialRoleId)
  }, [initialRoleId])

  useEffect(() => {
    setActiveBundleId(candidate.proofBundles[0]?.id)
  }, [candidate.id, candidate.proofBundles])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    window.requestAnimationFrame(() => {
      node.scrollTop = drawerScrollMemory.get(candidate.id) ?? 0
    })
  }, [candidate.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (reviewProof) return
      if (event.key === "Escape") {
        event.preventDefault()
        closeSurface("candidate_drawer")
      }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault()
        const next = resultSet[Math.min(candidateIndex + 1, resultSet.length - 1)]
        if (next) openCandidateDrawer(next.id)
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault()
        const previous = resultSet[Math.max(candidateIndex - 1, 0)]
        if (previous) openCandidateDrawer(previous.id)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [candidateIndex, closeSurface, openCandidateDrawer, resultSet, reviewProof])

  function onScroll() {
    const node = scrollRef.current
    if (node) drawerScrollMemory.set(candidate.id, node.scrollTop)
  }

  function compareCandidate() {
    setSelectedCandidates(Array.from(new Set([...selectedCandidates, candidate.id])).slice(0, 4))
    openSurface("compare_view")
  }

  return (
    <aside className="h-full w-[640px] shrink-0 border-l border-border bg-surface text-text" aria-label="Candidate drawer">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Candidate drawer</div>
          <div className="text-sm font-semibold text-text">{candidate.id}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const previous = resultSet[Math.max(candidateIndex - 1, 0)]
              if (previous) openCandidateDrawer(previous.id)
            }}
            className="flex h-8 w-8 items-center justify-center border border-border text-text-muted hover:text-text"
            aria-label="Previous candidate"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const next = resultSet[Math.min(candidateIndex + 1, resultSet.length - 1)]
              if (next) openCandidateDrawer(next.id)
            }}
            className="flex h-8 w-8 items-center justify-center border border-border text-text-muted hover:text-text"
            aria-label="Next candidate"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => closeSurface("candidate_drawer")}
            className="flex h-8 w-8 items-center justify-center border border-border text-text-muted hover:text-text"
            aria-label="Close candidate drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="h-[calc(100%-3.5rem)] overflow-y-auto">
        <section className="border-b border-border bg-surface-elevated p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-accent bg-surface font-mono text-sm font-semibold uppercase text-text">
              {avatarInitials(candidate)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-4xl uppercase leading-none text-text">{candidate.name}</h2>
                <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{candidate.pronouns}</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">{candidate.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-muted">{candidate.location}</span>
                <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-muted">{labelize(candidate.workRights)}</span>
                <span className="border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase text-text-muted">{candidate.institution}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-px bg-border">
            {[
              ["Contact", () => openSurface("inbox")],
              ["Save", () => openSurface("pool_builder")],
              ["Compare", compareCandidate],
              ["Assess", () => openSurface("assessment_launcher")],
              ["Move stage", () => openSurface("pipeline_board")],
            ].map(([label, action]) => (
              <button
                key={label as string}
                type="button"
                onClick={action as () => void}
                className="bg-surface px-2 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:bg-accent-muted hover:text-text"
              >
                {label as string}
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Readiness</div>
              <div className="mt-2 flex items-end gap-3">
                <span className="font-display text-7xl uppercase leading-none text-text">{score}</span>
                <span className="pb-2 font-mono text-[10px] uppercase tracking-wide text-text-subtle">for {selectedRole.title}</span>
              </div>
            </div>
            <label className="relative min-w-56">
              <span className="sr-only">Role selector</span>
              <select
                value={selectedRole.id}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                className="h-9 w-full appearance-none border border-border bg-surface-elevated pl-3 pr-8 font-mono text-[10px] uppercase tracking-wide text-text outline-none focus:border-accent"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-text-subtle" />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-px bg-border">
            {Object.entries(breakdown).map(([label, value]) => (
              <div key={label} className="bg-surface-elevated p-3">
                <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{label}</div>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <span
                      key={index}
                      className={cx(
                        "h-5 w-5 border border-border-strong",
                        value >= 90 - index * 10 ? "bg-accent" : "bg-surface",
                      )}
                    />
                  ))}
                </div>
                <div className="mt-2 font-mono text-sm font-semibold text-text">{value}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 border-l border-accent pl-3 text-sm text-text-muted">
            Aristotle: {candidate.name.split(" ")[0]} is strongest where {selectedRole.rubric[0]?.dimension.toLowerCase()} depends on fresh,
            role-aligned proof and verified capability signals.
          </p>
        </section>

        <section className="border-b border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Trust strip</div>
          <div className="mt-3 grid grid-cols-5 gap-px bg-border">
            {trustLevels.map((level) => {
              const active = level === primaryBundle(candidate).trustLevel
              const reached = trustLevels.indexOf(level) <= trustLevels.indexOf(primaryBundle(candidate).trustLevel as (typeof trustLevels)[number])
              return (
                <div key={level} className={cx("bg-surface-elevated p-2", active && "outline outline-1 outline-accent")}>
                  <div className={cx("mx-auto h-2 w-2 border border-border-strong", reached ? "bg-accent" : "bg-surface")} />
                  <div className="mt-2 text-center font-mono text-[9px] uppercase leading-tight text-text-subtle">{labelize(level)}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="border border-border bg-surface-elevated p-3">
              <div className="inline-flex items-center border border-success bg-success-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text">
                Verified
              </div>
              <ul className="mt-2 space-y-1 text-xs text-text-muted">
                {trust.verified.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-surface-elevated p-3">
              <div className="inline-flex items-center border border-warning bg-warning-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text">
                Needs review
              </div>
              <ul className="mt-2 space-y-1 text-xs text-text-muted">
                {(trust.unverified.length > 0 ? trust.unverified : ["No major trust gaps in this fixture."]).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Proof bundles</div>
              <h3 className="font-display text-3xl uppercase text-text">Role evidence</h3>
            </div>
            <a href={`#portfolio-${candidate.id}`} className="font-mono text-[10px] uppercase tracking-wide text-accent hover:underline">
              Open full proof portfolio
            </a>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {candidate.proofBundles.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveBundleId(item.id)}
                aria-pressed={item.id === bundle.id}
                className={cx(
                  "border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
                  item.id === bundle.id ? "border-accent bg-accent-muted text-text" : "border-border text-text-muted hover:text-text",
                )}
              >
                {item.role}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <ProofBundle
              role={bundle.role}
              proofs={proofItemsForBundle(candidate, bundle)}
              currentRole={selectedRole}
              readinessMatch={score}
              onOpenProof={setReviewProof}
              onEndorseProof={(proof) => setNotes((current) => `${current}\nEndorsed proof ${proof.id} for ${proof.role}.`)}
              onFlagProof={(proof) => setNotes((current) => `${current}\nFlagged proof ${proof.id} for reviewer follow-up.`)}
              onCompareToRole={() => openSurface("compare_view")}
            />
          </div>
        </section>

        <section className="border-b border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Skill graph</div>
          <h3 className="font-display text-3xl uppercase text-text">Capability matrix</h3>
          <div className="mt-3 overflow-hidden border border-border">
            <div className="grid grid-cols-[1.4fr_repeat(4,0.75fr)] gap-px bg-border font-mono text-[10px] uppercase tracking-wide text-text-subtle">
              <div className="bg-surface px-3 py-2">Capability</div>
              {evidenceTypes.map((type) => (
                <div key={type} className="bg-surface px-2 py-2 text-center">
                  {type}
                </div>
              ))}
            </div>
            <div className="divide-y divide-border bg-surface-elevated">
              {candidate.skills.map((skill) => (
                <div key={skill.name} className="grid grid-cols-[1.4fr_repeat(4,0.75fr)] items-center gap-px bg-border">
                  <div className="bg-surface-elevated px-3 py-2">
                    <div className="text-sm font-semibold text-text">{skill.name}</div>
                    <div className="font-mono text-[10px] uppercase text-text-subtle">P{skill.proficiency} - {skill.verified ? "verified" : "claimed"}</div>
                  </div>
                  {evidenceTypes.map((type) => (
                    <div key={`${skill.name}-${type}`} className="flex h-full items-center justify-center bg-surface-elevated px-2 py-3">
                      <StateGlyph state={capabilityState(candidate, skill.name, type)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-3 font-mono text-[10px] uppercase text-text-subtle">
            <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-success" /> Verified</span>
            <span className="inline-flex items-center gap-1"><Circle className="h-2.5 w-2.5 fill-info text-info" /> Partial</span>
            <span className="inline-flex items-center gap-1"><Minus className="h-3 w-3" /> Missing</span>
          </div>
        </section>

        <section id="assessment-history" className="border-b border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Activity timeline</div>
          <h3 className="font-display text-3xl uppercase text-text">Last 90 days</h3>
          <div className="mt-3 border border-border">
            {timeline(candidate).map((event) => (
              <div key={`${event.date}-${event.label}`} className="grid grid-cols-[108px_1fr] gap-3 border-b border-border bg-surface-elevated px-3 py-3 last:border-b-0">
                <div className="font-mono text-[10px] uppercase leading-5 text-text-subtle">{formatDate(event.date)}</div>
                <div>
                  <div className="text-sm font-semibold text-text">{event.label}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">{event.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-border p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Pathway fit</div>
          <div className="flex items-end justify-between gap-3">
            <h3 className="font-display text-3xl uppercase text-text">{pathway?.title ?? "No pathway loaded"}</h3>
            <span className="font-mono text-[10px] uppercase text-text-subtle">{selectedRole.company}</span>
          </div>
          <div className="mt-3 grid gap-px bg-border">
            {(pathway?.milestones ?? []).map((milestone) => {
              const met = candidate.skills.some((skill) => milestone.capability.toLowerCase().includes(skill.name.toLowerCase().split(" ")[0]))
              const status = met ? "met" : milestone.status === "in-progress" || milestone.status === "submitted" ? "in progress" : "missing"
              return (
                <div key={milestone.id} className="grid grid-cols-[1fr_96px] gap-3 bg-surface-elevated px-3 py-3">
                  <div>
                    <div className="text-sm font-semibold text-text">{milestone.title}</div>
                    <div className="mt-1 text-xs text-text-muted">{milestone.capability} - {milestone.evidenceTypes.join(", ")}</div>
                  </div>
                  <div className={cx(
                    "self-start border px-2 py-1 text-center font-mono text-[10px] uppercase",
                    status === "met"
                      ? "border-success bg-success-soft text-text"
                      : status === "in progress"
                        ? "border-info bg-info-soft text-text"
                        : "border-border bg-surface text-text-subtle",
                  )}>
                    {status}
                  </div>
                </div>
              )
            })}
            {pathway ? null : (
              <div className="bg-surface-elevated p-3 text-sm text-text-muted">Load a role to inspect milestone coverage.</div>
            )}
          </div>
        </section>

        <section className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Recruiter notes</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["#high-proof", "#backend-depth", "@hiring-manager", "@aristotle"].map((tag) => (
              <span key={tag} className="border border-border bg-surface-elevated px-2 py-1 font-mono text-[10px] uppercase text-text-muted">
                {tag}
              </span>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            aria-label="Recruiter notes"
            className="mt-3 min-h-32 w-full resize-y border border-border bg-surface-elevated p-3 text-sm leading-6 text-text outline-none placeholder:text-text-subtle focus:border-accent"
            placeholder="Add private recruiter notes, tags, or @mentions."
          />
        </section>
      </div>
      <ProofReviewSurface proof={reviewProof} currentRole={selectedRole} onClose={() => setReviewProof(null)} />
    </aside>
  )
}
