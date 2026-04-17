"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Clock3, Mail, Reply, Send, Sparkles, UserRound } from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import { draftForTemplate, templateForThreadStage, templateLabels } from "@/lib/agent/outreach-templates"
import type { InboxDraft, OutreachTemplateKind } from "@/lib/agent/types"
import { candidates as allCandidates } from "@/lib/demo-data/candidates"
import type { Candidate, OpenRole, OutreachThread } from "@/lib/demo-data/types"
import { InboxEmptyState, InboxErrorState, InboxLoadingState } from "./Inbox.states"

const REFERENCE_TIME = new Date("2026-04-17T12:00:00Z")

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function candidateById(candidateId: string) {
  return allCandidates.find((candidate) => candidate.id === candidateId)
}

function roleById(roleId: string, roles: OpenRole[]) {
  return roles.find((role) => role.id === roleId)
}

function latestSender(thread: OutreachThread) {
  return thread.messages[thread.messages.length - 1]?.sender ?? "aristotle"
}

function isUnread(thread: OutreachThread) {
  return latestSender(thread) === "candidate"
}

function needsReply(thread: OutreachThread, queueThreadIds: string[]) {
  return isUnread(thread) || thread.stage === "drafted" || queueThreadIds.includes(thread.id)
}

function hoursUntilSla(thread: OutreachThread) {
  const targetHours = latestSender(thread) === "candidate" ? 24 : thread.stage === "drafted" ? 12 : 36
  const elapsed = Math.max(0, Math.round((REFERENCE_TIME.getTime() - new Date(thread.lastActivityAt).getTime()) / 3600000))
  return targetHours - elapsed
}

function slaText(thread: OutreachThread) {
  const remaining = hoursUntilSla(thread)
  if (remaining >= 0) return `Respond in ${remaining}h to meet SLA`
  return `SLA overdue by ${Math.abs(remaining)}h`
}

function threadTone(thread: OutreachThread, queueThreadIds: string[]) {
  const remaining = hoursUntilSla(thread)
  if (queueThreadIds.includes(thread.id)) return "border-accent bg-accent-muted text-text"
  if (remaining < 0) return "border-danger bg-danger-soft text-text"
  if (remaining <= 8) return "border-warning bg-warning-soft text-text"
  return "border-success bg-success-soft text-text"
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function initials(candidate: Candidate) {
  return candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

function ComposeTemplates({
  candidate,
  role,
  activeTemplate,
  onSelect,
}: {
  candidate: Candidate
  role: OpenRole
  activeTemplate: OutreachTemplateKind
  onSelect: (template: OutreachTemplateKind) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(templateLabels) as OutreachTemplateKind[]).map((template) => (
        <button
          key={template}
          type="button"
          onClick={() => onSelect(template)}
          aria-pressed={activeTemplate === template}
          className={cx(
            "border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
            activeTemplate === template ? "border-accent bg-accent-muted text-text" : "border-border bg-surface text-text-muted hover:text-text",
          )}
        >
          {templateLabels[template]}
        </button>
      ))}
    </div>
  )
}

export function Inbox() {
  const {
    roles,
    outreachThreads,
    activeInboxThreadId,
    inboxDrafts,
    inboxQueueThreadIds,
    setActiveInboxThread,
    setInboxDraft,
    sendInboxDraft,
    sendInboxQueue,
    setInboxQueueThreadIds,
    openSurface,
    openCandidateDrawer,
  } = useAgentStore()
  const [stageFilter, setStageFilter] = useState<"all" | OutreachThread["stage"]>("all")
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false)
  const error: string | null = null

  const sortedThreads = useMemo(() => {
    return [...outreachThreads].sort((a, b) => {
      const queueDelta = Number(inboxQueueThreadIds.includes(b.id)) - Number(inboxQueueThreadIds.includes(a.id))
      if (queueDelta !== 0) return queueDelta
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    })
  }, [inboxQueueThreadIds, outreachThreads])

  const visibleThreads = useMemo(
    () =>
      sortedThreads.filter((thread) => {
        if (stageFilter !== "all" && thread.stage !== stageFilter) return false
        if (unreadOnly && !isUnread(thread)) return false
        if (needsReplyOnly && !needsReply(thread, inboxQueueThreadIds)) return false
        return true
      }),
    [inboxQueueThreadIds, needsReplyOnly, sortedThreads, stageFilter, unreadOnly],
  )

  useEffect(() => {
    if (!activeInboxThreadId || !visibleThreads.some((thread) => thread.id === activeInboxThreadId)) {
      setActiveInboxThread(visibleThreads[0]?.id ?? outreachThreads[0]?.id ?? null)
    }
  }, [activeInboxThreadId, outreachThreads, setActiveInboxThread, visibleThreads])

  const activeThread = visibleThreads.find((thread) => thread.id === activeInboxThreadId) ?? outreachThreads.find((thread) => thread.id === activeInboxThreadId) ?? visibleThreads[0] ?? outreachThreads[0]
  const activeCandidate = activeThread ? candidateById(activeThread.candidateId) : null
  const activeRole = activeThread ? roleById(activeThread.roleId, roles) ?? roles[0] ?? null : null
  const activeDraft = activeThread ? inboxDrafts[activeThread.id] : undefined

  useEffect(() => {
    if (!activeThread || !activeCandidate || !activeRole) return
    const existing = inboxDrafts[activeThread.id]
    if (existing && (existing.subject.trim() || existing.body.trim())) return
    const template = existing?.template ?? templateForThreadStage(activeThread.stage)
    setInboxDraft(activeThread.id, draftForTemplate(template, activeCandidate, activeRole))
  }, [activeCandidate, activeRole, activeThread, inboxDrafts, setInboxDraft])

  function updateDraft(patch: Partial<InboxDraft>) {
    if (!activeThread || !activeCandidate || !activeRole) return
    const base = activeDraft ?? draftForTemplate(templateForThreadStage(activeThread.stage), activeCandidate, activeRole)
    setInboxDraft(activeThread.id, { ...base, ...patch, updatedAt: REFERENCE_TIME.toISOString() })
  }

  function chooseTemplate(template: OutreachTemplateKind) {
    if (!activeThread || !activeCandidate || !activeRole) return
    setInboxDraft(activeThread.id, draftForTemplate(template, activeCandidate, activeRole))
  }

  const stageOptions = Array.from(new Set(outreachThreads.map((thread) => thread.stage)))

  if (error) {
    return <InboxErrorState onRetry={() => setActiveInboxThread(outreachThreads[0]?.id ?? null)} />
  }

  if (roles.length === 0 && outreachThreads.length === 0) {
    return <InboxLoadingState />
  }

  if (visibleThreads.length === 0) {
    return (
      <InboxEmptyState
        onClearFilters={() => {
          setStageFilter("all")
          setUnreadOnly(false)
          setNeedsReplyOnly(false)
        }}
        onOpenResults={() => openSurface("results_table")}
        onOpenCandidates={() => openSurface("results_table")}
      />
    )
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[280px_minmax(420px,1fr)] grid-rows-[minmax(0,1fr)_280px] bg-bg text-text">
      <aside className="row-span-2 min-h-0 border-r border-border bg-surface">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Inbox</div>
              <div className="font-display text-3xl uppercase leading-none text-text">Recruiter threads</div>
            </div>
            <span className="border border-border bg-surface-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
              {visibleThreads.length}
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            <label className="relative">
              <span className="sr-only">Stage filter</span>
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value as "all" | OutreachThread["stage"])}
                className="h-10 w-full appearance-none border border-border bg-surface-elevated pl-3 pr-8 font-mono text-[10px] uppercase tracking-wide text-text outline-none focus:border-accent"
              >
                <option value="all">All stages</option>
                {stageOptions.map((stage) => (
                  <option key={stage} value={stage}>{labelize(stage)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-text-subtle" />
            </label>
            <div className="grid grid-cols-2 gap-px bg-border">
              <button
                type="button"
                onClick={() => setUnreadOnly((value) => !value)}
                aria-pressed={unreadOnly}
                className={cx("bg-surface-elevated px-2 py-2 font-mono text-[10px] uppercase tracking-wide", unreadOnly ? "text-accent" : "text-text-muted hover:text-text")}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setNeedsReplyOnly((value) => !value)}
                aria-pressed={needsReplyOnly}
                className={cx("bg-surface-elevated px-2 py-2 font-mono text-[10px] uppercase tracking-wide", needsReplyOnly ? "text-accent" : "text-text-muted hover:text-text")}
              >
                Needs reply
              </button>
            </div>
          </div>
          {inboxQueueThreadIds.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                sendInboxQueue([...inboxQueueThreadIds])
                setInboxQueueThreadIds([])
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-accent bg-accent px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-primary-foreground"
            >
              <Send className="h-3.5 w-3.5" />
              Send all queued
            </button>
          ) : null}
        </div>

        <div className="min-h-0 overflow-y-auto p-2">
          <div className="space-y-2">
            {visibleThreads.map((thread) => {
              const candidate = candidateById(thread.candidateId)
              if (!candidate) return null
              const active = thread.id === activeThread?.id
              const queued = inboxQueueThreadIds.includes(thread.id)
              const draft = inboxDrafts[thread.id]
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveInboxThread(thread.id)}
                  className={cx(
                    "w-full border p-3 text-left",
                    active ? "border-accent bg-accent-muted" : "border-border bg-surface-elevated hover:border-border-strong",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-text">{candidate.name}</div>
                      <div className="mt-1 truncate font-mono text-[10px] uppercase text-text-subtle">{thread.subject}</div>
                    </div>
                    {queued ? (
                      <span className="border border-accent bg-accent-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-text">Queued</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-subtle">{labelize(thread.stage)}</span>
                    {isUnread(thread) ? (
                      <span className="border border-info bg-info-soft px-1.5 py-0.5 font-mono text-[10px] uppercase text-text">Unread</span>
                    ) : null}
                    {draft?.body.trim() ? (
                      <span className="border border-warning bg-warning-soft px-1.5 py-0.5 font-mono text-[10px] uppercase text-text">Draft</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={cx("border px-2 py-1 font-mono text-[10px] uppercase tracking-wide", threadTone(thread, inboxQueueThreadIds))}>
                      {slaText(thread)}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-text-subtle">{formatTimestamp(thread.lastActivityAt)}</span>
                  </div>
                </button>
              )
            })}
            {visibleThreads.length === 0 ? (
              <div className="border border-dashed border-border bg-surface-elevated p-4 text-sm leading-6 text-text-muted">No threads match the current filters.</div>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="min-h-0 overflow-y-auto bg-bg">
        {activeThread && activeCandidate && activeRole ? (
          <>
            <div className="border-b border-border bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Thread view</div>
                  <div className="text-lg font-semibold text-text">{activeThread.subject}</div>
                </div>
                <span className={cx("border px-2 py-1 font-mono text-[10px] uppercase tracking-wide", threadTone(activeThread, inboxQueueThreadIds))}>
                  {slaText(activeThread)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCandidateDrawer(activeCandidate.id)}
                  className="inline-flex items-center gap-2 border border-border bg-surface-elevated px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  {activeCandidate.name} · {activeCandidate.readinessScore.score}
                </button>
                <span className="border border-border bg-surface-elevated px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                  {activeRole.title}
                </span>
                <span className="border border-border bg-surface-elevated px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                  {activeCandidate.location}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border">
              {activeThread.messages.map((message) => (
                <div key={message.id} className="grid grid-cols-[112px_1fr] gap-4 px-4 py-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">{message.sender}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase text-text-subtle">{formatTimestamp(message.sentAt)}</div>
                  </div>
                  <div className="border border-border bg-surface-elevated p-3 text-sm leading-6 text-text">{message.body}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-text-muted">Select a thread to review the message history.</div>
        )}
      </section>

      <section className="border-t border-border bg-surface">
        {activeThread && activeCandidate && activeRole ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Compose</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-text">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Role + candidate aware templates
                </div>
              </div>
              <div className="flex items-center gap-2">
                {inboxQueueThreadIds.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      sendInboxQueue([...inboxQueueThreadIds])
                      setInboxQueueThreadIds([])
                    }}
                    className="border border-border bg-surface-elevated px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:text-text"
                  >
                    Send all {inboxQueueThreadIds.length}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => sendInboxDraft(activeThread.id)}
                  className="inline-flex items-center gap-2 border border-accent bg-accent px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-primary-foreground"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>

            <div className="mt-3">
              <ComposeTemplates
                candidate={activeCandidate}
                role={activeRole}
                activeTemplate={activeDraft?.template ?? templateForThreadStage(activeThread.stage)}
                onSelect={chooseTemplate}
              />
            </div>

            <div className="mt-3 grid min-h-0 flex-1 gap-3">
              <input
                value={activeDraft?.subject ?? ""}
                onChange={(event) => updateDraft({ subject: event.target.value })}
                aria-label="Reply subject"
                className="h-10 border border-border bg-surface-elevated px-3 text-sm text-text outline-none focus:border-accent"
                placeholder="Subject"
              />
              <textarea
                value={activeDraft?.body ?? ""}
                onChange={(event) => updateDraft({ body: event.target.value })}
                aria-label="Reply body"
                className="min-h-0 flex-1 resize-none border border-border bg-surface-elevated p-3 text-sm leading-6 text-text outline-none focus:border-accent"
                placeholder="Compose recruiter reply"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                    <Mail className="h-3.5 w-3.5" />
                    {labelize(activeThread.stage)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                    <Reply className="h-3.5 w-3.5" />
                    {activeDraft?.body.trim() ? "Draft saved" : "Template ready"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                    <Clock3 className="h-3.5 w-3.5" />
                    {slaText(activeThread)}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                  {(activeDraft?.body.length ?? 0)} chars
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-text-muted">Select a thread to compose a reply.</div>
        )}
      </section>
    </div>
  )
}
