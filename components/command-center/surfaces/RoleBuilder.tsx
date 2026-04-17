"use client"

import { useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { parseJD, type ParsedCapability, type ParsedCapabilityType } from "@/lib/agent/jd-parser"
import { useAgentStore } from "@/lib/agent/store"
import { RoleBuilderEmptyState, RoleBuilderErrorState, RoleBuilderLoadingState } from "./RoleBuilder.states"

type WizardStatus = "idle" | "loading" | "saving" | "saved"
type EvidenceType = ParsedCapability["evidenceExpected"][number]

const steps = ["Basics", "Capability graph", "Rubric", "Threshold + review"]
const evidenceTypes: EvidenceType[] = ["artifact", "assessment", "tryout", "endorsement"]
const capabilityTypes: ParsedCapabilityType[] = ["must-have", "nice-to-have", "anti-pattern"]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function defaultJD() {
  return `Senior Rust Backend Engineer
We need production Rust experience, backend proof bundles, data consistency judgment, PostgreSQL, Kafka, AWS, and clear incident communication. Security and observability are preferred. Avoid credential-only screening and years-only requirements.`
}

export function RoleBuilder() {
  const { createRole, openSurface } = useAgentStore()
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<WizardStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("Backend Engineer")
  const [seniority, setSeniority] = useState("Senior")
  const [location, setLocation] = useState("Sydney / Singapore")
  const [sponsorship, setSponsorship] = useState(true)
  const [remotePolicy, setRemotePolicy] = useState("Hybrid, 2 anchor days")
  const [jd, setJd] = useState(defaultJD())
  const [capabilities, setCapabilities] = useState<ParsedCapability[]>(() => parseJD(defaultJD()))
  const [threshold, setThreshold] = useState(82)
  const [savedRoleTitle, setSavedRoleTitle] = useState<string | null>(null)

  const weightTotal = useMemo(
    () => capabilities.filter((capability) => capability.type !== "anti-pattern").reduce((total, capability) => total + Number(capability.weight || 0), 0),
    [capabilities],
  )
  const weightsValid = weightTotal === 100

  function updateCapability(id: string, patch: Partial<ParsedCapability>) {
    setCapabilities((current) => current.map((capability) => (capability.id === id ? { ...capability, ...patch } : capability)))
  }

  function parseDescription() {
    setError(null)
    setStatus("loading")
    window.setTimeout(() => {
      setCapabilities(parseJD(jd))
      setStatus("idle")
    }, 450)
  }

  function addCapability() {
    setCapabilities((current) => [
      ...current,
      {
        id: `cap_${String(current.length + 1).padStart(3, "0")}`,
        name: "New capability",
        type: "nice-to-have",
        evidenceExpected: ["artifact"],
        weight: 0,
      },
    ])
  }

  function saveRole() {
    if (!weightsValid) return
    setError(null)
    setStatus("saving")
    const mustHaves = capabilities.filter((capability) => capability.type === "must-have").map((capability) => capability.name)
    const niceToHaves = [
      ...capabilities.filter((capability) => capability.type === "nice-to-have").map((capability) => capability.name),
      `Location: ${location}`,
      `Sponsorship: ${sponsorship ? "available" : "not available"}`,
      `Remote: ${remotePolicy}`,
      `Readiness threshold: ${threshold}`,
    ]
    const rubric = capabilities
      .filter((capability) => capability.type !== "anti-pattern")
      .map((capability) => ({
        dimension: capability.name,
        weight: capability.weight,
        evidenceExpected: capability.evidenceExpected.map(labelize).join(", "),
      }))

    window.setTimeout(() => {
      const roleTitle = `${seniority} ${title}`
      createRole({
        title: roleTitle,
        company: "iNGEN",
        stack: capabilities.filter((capability) => capability.type !== "anti-pattern").map((capability) => capability.name).slice(0, 8),
        mustHaves,
        niceToHaves,
        rubric,
        pathwayId: "path_runtime_pending",
      })
      setSavedRoleTitle(roleTitle)
      setStatus("saved")
    }, 550)
  }

  if (error) {
    return <RoleBuilderErrorState onRetry={parseDescription} />
  }

  if (!jd.trim()) {
    return (
      <RoleBuilderEmptyState
        onParseJd={parseDescription}
        onUseTemplate={() => setJd(defaultJD())}
        onOpenPathway={() => openSurface("pathway_builder")}
      />
    )
  }

  if (status === "loading") {
    return <RoleBuilderLoadingState />
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-text">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Role builder</div>
            <div className="font-display text-3xl uppercase leading-none text-text">Author role context</div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
                status === "saved"
                  ? "border-success bg-success-soft text-text"
                  : status === "saving"
                    ? "border-info bg-info-soft text-text"
                    : "border-border bg-surface-elevated text-text-subtle",
              )}
            >
              {status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Idle"}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-px bg-border">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              aria-pressed={step === index}
              className={cx("bg-surface-elevated px-3 py-2 text-left", step === index && "bg-accent-muted")}
            >
              <div className="font-mono text-[10px] uppercase text-text-subtle">Step {index + 1}</div>
              <div className="text-sm font-semibold text-text">{label}</div>
            </button>
          ))}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        {step === 0 ? (
          <section className="grid gap-4 md:grid-cols-2">
            {[
              ["Title", title, setTitle],
              ["Seniority", seniority, setSeniority],
              ["Location", location, setLocation],
              ["Remote policy", remotePolicy, setRemotePolicy],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{label as string}</span>
                <input
                  value={value as string}
                  onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                  className="mt-2 h-10 w-full border border-border bg-surface-elevated px-3 text-sm text-text outline-none focus:border-accent"
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() => setSponsorship((value) => !value)}
              className="border border-border bg-surface-elevated p-3 text-left"
              aria-pressed={sponsorship}
            >
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Work-rights policy</div>
              <div className="mt-2 text-sm font-semibold text-text">Sponsorship {sponsorship ? "available" : "not available"}</div>
            </button>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Paste JD</span>
              <textarea
                value={jd}
                onChange={(event) => setJd(event.target.value)}
                className="mt-2 min-h-[360px] w-full resize-y border border-border bg-surface-elevated p-3 text-sm leading-6 text-text outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={parseDescription}
                className="mt-3 border border-accent bg-accent px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-primary-foreground"
              >
                Parse JD
              </button>
            </label>
            <div className="border border-border bg-surface">
              <div className="border-b border-border p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Editable capability list</div>
              </div>
              <div className="max-h-[420px] overflow-y-auto p-3">
                {capabilities.map((capability) => (
                  <div key={capability.id} className="mb-2 border border-border bg-surface-elevated p-2">
                    <input
                      value={capability.name}
                      onChange={(event) => updateCapability(capability.id, { name: event.target.value })}
                      className="h-8 w-full border border-border bg-surface px-2 text-sm text-text outline-none focus:border-accent"
                    />
                    <select
                      value={capability.type}
                      onChange={(event) => updateCapability(capability.id, { type: event.target.value as ParsedCapabilityType })}
                      className="mt-2 h-8 w-full border border-border bg-surface px-2 font-mono text-[10px] uppercase text-text-muted outline-none focus:border-accent"
                    >
                      {capabilityTypes.map((type) => (
                        <option key={type} value={type}>{labelize(type)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addCapability} className="m-3 inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] uppercase text-text-muted hover:text-text">
                <Plus className="h-3.5 w-3.5" />
                Add capability
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Rubric weights</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="font-display text-3xl uppercase text-text">{weightTotal}/100</div>
                  <span
                    className={cx(
                      "border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
                      weightsValid
                        ? "border-success bg-success-soft text-text"
                        : "border-warning bg-warning-soft text-text",
                    )}
                  >
                    {weightsValid ? "Valid" : "Adjust"}
                  </span>
                </div>
              </div>
              <div className="text-sm text-text-muted">{weightsValid ? "Weights are valid." : "Total weights must sum to 100."}</div>
            </div>
            <div className="divide-y divide-border border border-border">
              {capabilities.map((capability) => (
                <div key={capability.id} className="grid grid-cols-[1fr_220px_96px_40px] gap-3 bg-surface-elevated p-3">
                  <div>
                    <div className="text-sm font-semibold text-text">{capability.name}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">{labelize(capability.type)}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {evidenceTypes.map((evidence) => {
                      const active = capability.evidenceExpected.includes(evidence)
                      return (
                        <button
                          key={evidence}
                          type="button"
                          onClick={() =>
                            updateCapability(capability.id, {
                              evidenceExpected: active
                                ? capability.evidenceExpected.filter((item) => item !== evidence)
                                : [...capability.evidenceExpected, evidence],
                            })
                          }
                          aria-pressed={active}
                          className={cx("border px-1.5 py-1 font-mono text-[10px] uppercase", active ? "border-accent text-text" : "border-border text-text-subtle")}
                        >
                          {evidence}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="number"
                    value={capability.weight}
                    disabled={capability.type === "anti-pattern"}
                    onChange={(event) => updateCapability(capability.id, { weight: Number(event.target.value) })}
                    className="h-9 border border-border bg-surface px-2 font-mono text-sm text-text outline-none focus:border-accent disabled:text-text-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => setCapabilities((current) => current.filter((item) => item.id !== capability.id))}
                    className="flex h-9 w-9 items-center justify-center border border-border text-text-subtle hover:text-text"
                    aria-label={`Remove ${capability.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="border border-border bg-surface-elevated p-4">
              <label>
                <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Readiness threshold</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                  className="mt-2 h-12 w-full border border-border bg-surface px-3 font-display text-3xl text-text outline-none focus:border-accent"
                />
              </label>
              <button
                type="button"
                disabled={!weightsValid || status === "saving"}
                onClick={saveRole}
                className="mt-4 w-full border border-accent bg-accent px-3 py-3 font-mono text-[10px] uppercase tracking-wide text-primary-foreground disabled:border-border disabled:bg-surface disabled:text-text-subtle"
              >
                Save role
              </button>
              {status === "saved" ? (
                <button
                  type="button"
                  onClick={() => openSurface("pathway_builder")}
                  className="mt-2 w-full border border-border bg-surface px-3 py-3 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text"
                >
                  Author pathway
                </button>
              ) : null}
            </div>
            <div className="border border-border bg-surface-elevated p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Review</div>
              <h3 className="font-display text-4xl uppercase text-text">{seniority} {title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">{location} - sponsorship {sponsorship ? "available" : "not available"} - {remotePolicy}</p>
              <div className="mt-4 grid gap-px bg-border">
                {capabilities.map((capability) => (
                  <div key={capability.id} className="grid grid-cols-[1fr_80px_120px] gap-3 bg-surface px-3 py-2 text-sm">
                    <span className="text-text">{capability.name}</span>
                    <span className="font-mono text-[10px] uppercase text-text-subtle">{capability.weight}%</span>
                    <span className="font-mono text-[10px] uppercase text-text-subtle">{labelize(capability.type)}</span>
                  </div>
                ))}
              </div>
              {savedRoleTitle ? (
                <div className="mt-4 border border-success bg-success-soft p-3 text-sm text-text">
                  Saved {savedRoleTitle} into runtime role context.
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="flex items-center justify-between border-t border-border bg-surface px-4 py-3">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] uppercase text-text-muted hover:text-text"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
          className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] uppercase text-text-muted hover:text-text"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </footer>
    </div>
  )
}
