"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, Circle, Minus, X } from "lucide-react"
import { surfaceMotion } from "@/components/command-center/motion"
import type { OpenRole } from "@/lib/demo-data/types"
import type { ProofItem } from "./ProofCard"

type ReviewState = "check" | "partial" | "missing"

type ProofReviewSurfaceProps = {
  proof: ProofItem | null
  currentRole?: OpenRole | null
  onClose: () => void
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function defaultChecklist(proof: ProofItem, currentRole?: OpenRole | null) {
  const dimensions =
    currentRole?.rubric.map((item) => ({
      id: item.dimension,
      label: item.dimension,
      evidenceExpected: item.evidenceExpected,
      weight: item.weight,
    })) ?? [
      { id: "problem", label: "Problem clarity", evidenceExpected: "Clear problem statement", weight: 25 },
      { id: "contribution", label: "Candidate contribution", evidenceExpected: "Specific ownership and tradeoffs", weight: 25 },
      { id: "outcome", label: "Outcome evidence", evidenceExpected: "Measurable result or shipped artifact", weight: 25 },
      { id: "trust", label: "Verification", evidenceExpected: "Trusted verifier source", weight: 25 },
    ]

  const corpus = [
    proof.title,
    proof.role,
    proof.problem,
    proof.contribution,
    proof.outcome,
    proof.stack.join(" "),
    proof.artifact.title,
    proof.artifact.description ?? "",
  ].join(" ").toLowerCase()

  return dimensions.map((dimension) => {
    const terms = `${dimension.label} ${dimension.evidenceExpected}`.toLowerCase().split(/\s+/)
    const hits = terms.filter((term) => term.length > 4 && corpus.includes(term)).length
    const state: ReviewState = hits >= 2 ? "check" : hits === 1 ? "partial" : "missing"
    return {
      ...dimension,
      state,
      justification:
        state === "check"
          ? "Evidence directly supports this rubric dimension."
          : state === "partial"
            ? "Evidence is present but needs reviewer confirmation."
            : "No direct evidence is visible in this proof card.",
    }
  })
}

function StateIcon({ state }: { state: ReviewState }) {
  if (state === "check") return <Check className="h-4 w-4 text-success" />
  if (state === "partial") return <Circle className="h-3 w-3 fill-info text-info" />
  return <Minus className="h-4 w-4 text-text-subtle" />
}

function HighlightedCode({ code, language }: { code: string; language?: string }) {
  const keywords = new Set([
    "async",
    "await",
    "class",
    "const",
    "else",
    "export",
    "for",
    "from",
    "function",
    "if",
    "import",
    "interface",
    "let",
    "return",
    "type",
    "while",
  ])

  return (
    <div className="h-full border border-border bg-bg">
      <div className="flex h-9 items-center justify-between border-b border-border bg-surface px-3">
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Code artifact</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{language ?? "text"}</span>
      </div>
      <pre className="h-[calc(100%-2.25rem)] overflow-auto p-4 font-mono text-xs leading-6 text-text-muted">
        {code.split("\n").map((line, lineIndex) => (
          <div key={`${line}-${lineIndex}`}>
            <span className="mr-4 select-none text-text-subtle">{String(lineIndex + 1).padStart(2, "0")}</span>
            {line.split(/(\s+|[()[\]{}.,;:]|\/\/.*|".*?"|'.*?')/g).map((token, tokenIndex) => {
              const trimmed = token.trim()
              const isComment = token.startsWith("//")
              const isString = /^["'].*["']$/.test(token)
              const isKeyword = keywords.has(trimmed)
              return (
                <span
                  key={`${token}-${tokenIndex}`}
                  className={cx(
                    isComment && "text-text-subtle",
                    isString && "text-success",
                    isKeyword && "text-accent",
                  )}
                >
                  {token}
                </span>
              )
            })}
          </div>
        ))}
      </pre>
    </div>
  )
}

function ArtifactReview({ proof }: { proof: ProofItem }) {
  const artifact = proof.artifact

  if (artifact.artifactType === "link" && artifact.url) {
    return (
      <iframe
        src={artifact.url}
        title={artifact.title}
        className="h-full w-full border border-border bg-surface"
        sandbox="allow-same-origin allow-scripts"
      />
    )
  }

  if (artifact.artifactType === "code") {
    return <HighlightedCode code={artifact.code ?? "// Code artifact unavailable in demo fixture"} language={artifact.language} />
  }

  if (artifact.artifactType === "thumbnail" || artifact.artifactType === "video") {
    return (
      <div className="flex h-full items-center justify-center border border-border bg-bg p-6">
        {artifact.thumbnailUrl ? (
          <img src={artifact.thumbnailUrl} alt={artifact.title} className="max-h-full max-w-full border border-border object-contain" />
        ) : (
          <div className="max-w-xl border border-border bg-surface p-6 text-center">
            <div className="font-display text-4xl uppercase text-text">{artifact.title}</div>
            <p className="mt-3 text-sm leading-6 text-text-muted">{artifact.description ?? "No media preview attached to this demo proof."}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full border border-border bg-surface p-6">
      <div className="font-display text-4xl uppercase text-text">{artifact.title}</div>
      <p className="mt-3 text-sm text-text-muted">{artifact.description}</p>
    </div>
  )
}

export function ProofReviewSurface({ proof, currentRole, onClose }: ProofReviewSurfaceProps) {
  const [items, setItems] = useState(() => (proof ? defaultChecklist(proof, currentRole) : []))
  const shouldReduceMotion = Boolean(useReducedMotion())

  useEffect(() => {
    if (proof) setItems(defaultChecklist(proof, currentRole))
  }, [proof, currentRole])

  useEffect(() => {
    if (!proof) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [onClose, proof])

  const score = useMemo(() => {
    const totalWeight = items.reduce((total, item) => total + item.weight, 0) || 1
    return Math.round(
      items.reduce((total, item) => {
        const multiplier = item.state === "check" ? 1 : item.state === "partial" ? 0.55 : 0
        return total + item.weight * multiplier
      }, 0) / totalWeight * 100,
    )
  }, [items])

  return (
    <AnimatePresence initial={false}>
      {proof ? (
        <motion.div
          key={proof.id}
          role="dialog"
          aria-modal="true"
          aria-label="Proof review"
          className="fixed inset-0 z-[60] bg-bg text-text"
          {...surfaceMotion(shouldReduceMotion)}
        >
          <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Proof review mode</div>
              <div className="truncate text-sm font-semibold text-text">{proof.title}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="border border-border bg-surface-elevated px-3 py-1.5 text-right">
                <div className="font-mono text-[9px] uppercase tracking-wide text-text-subtle">Rubric match</div>
                <div className="font-mono text-sm font-semibold text-text">{score}%</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center border border-border text-text-muted hover:text-text"
                aria-label="Close proof review"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="grid h-[calc(100vh-3.5rem)] grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-h-0 border-r border-border bg-bg p-4">
              <ArtifactReview proof={proof} />
            </section>

            <aside className="min-h-0 overflow-y-auto bg-surface">
              <div className="border-b border-border p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Rubric checklist</div>
                <h2 className="font-display text-4xl uppercase leading-none text-text">{currentRole?.title ?? proof.role}</h2>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  Review the artifact against the loaded rubric. Justifications are local demo state.
                </p>
              </div>

              <div className="divide-y divide-border">
                {items.map((item, index) => (
                  <section key={item.id} className="bg-surface-elevated p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-text">{item.label}</div>
                        <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">{item.weight}% weight</div>
                      </div>
                      <div className="flex border border-border">
                        {(["check", "partial", "missing"] as ReviewState[]).map((state) => (
                          <button
                            key={state}
                            type="button"
                            onClick={() =>
                              setItems((current) =>
                                current.map((currentItem, currentIndex) =>
                                  currentIndex === index ? { ...currentItem, state } : currentItem,
                                ),
                              )
                            }
                            aria-pressed={item.state === state}
                            className={cx(
                              "flex h-8 w-8 items-center justify-center border-l border-border first:border-l-0",
                              item.state === state ? "bg-accent-muted" : "bg-surface",
                            )}
                            aria-label={`${state} for ${item.label}`}
                          >
                            <StateIcon state={state} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 border border-border bg-surface p-3">
                      <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Expected evidence</div>
                      <p className="mt-1 text-xs leading-5 text-text-muted">{item.evidenceExpected}</p>
                    </div>
                    <label className="mt-3 block">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">Justification</span>
                      <textarea
                        value={item.justification}
                        onChange={(event) =>
                          setItems((current) =>
                            current.map((currentItem, currentIndex) =>
                              currentIndex === index ? { ...currentItem, justification: event.target.value } : currentItem,
                            ),
                          )
                        }
                        className="mt-2 min-h-20 w-full resize-y border border-border bg-surface p-3 text-xs leading-5 text-text outline-none focus:border-accent"
                      />
                    </label>
                  </section>
                ))}
              </div>

              <footer className="border-t border-border bg-surface p-4">
                <div className="grid grid-cols-3 gap-px bg-border">
                  {["check", "partial", "missing"].map((state) => (
                    <div key={state} className="bg-surface-elevated p-3 text-center">
                      <div className="font-mono text-lg font-semibold text-text">{items.filter((item) => item.state === state).length}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{labelize(state)}</div>
                    </div>
                  ))}
                </div>
              </footer>
            </aside>
          </main>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
