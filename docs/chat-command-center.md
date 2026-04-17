# Chat Command Center Ship Checklist

Status date: 2026-04-17

Primary route: `/chat`

Demo route: `/chat/demo`

Build status: `npm.cmd run build` passes.

## 1. Feature Inventory

| Surface | What shipped | File paths |
| --- | --- | --- |
| Chat route and shell | App Router `/chat` entry, provider wiring, command-center layout, skip link, rail orchestration, module navigation, and global keyboard handler. | `app/chat/page.tsx`, `app/chat/layout.tsx`, `components/command-center/CommandCenterShell.tsx`, `components/command-center/AgentCanvas.tsx`, `components/command-center/ContextRail.tsx`, `components/command-center/LeftNav.tsx`, `components/command-center/TopBar.tsx`, `components/command-center/navigation.ts`, `components/command-center/events.ts`, `components/command-center/motion.ts` |
| Command thread | Recruiter command input, slash menu, suggested commands, Aristotle messages, structured outputs, reasoning stream, and newest-message jump. | `components/command-center/thread/CommandInput.tsx`, `components/command-center/thread/MessageList.tsx`, `components/command-center/thread/AgentMessage.tsx`, `components/command-center/thread/UserMessage.tsx`, `components/command-center/thread/ReasoningStream.tsx`, `components/command-center/thread/StructuredOutput.tsx` |
| Keyboard help | Modal help sheet for all shortcuts, opened from `?` or the top bar. | `components/command-center/KeyboardHelpSheet.tsx`, `components/ui/dialog.tsx` |
| Candidate results | Ranked table/grid results, filters, sort, keyboard row focus, row selection, compare/open actions, and shortlist actions. | `components/command-center/surfaces/CandidateResults.tsx`, `components/command-center/surfaces/CandidateResults.states.tsx` |
| Candidate drawer | Candidate profile drawer with score drivers, proof, work-rights context, assessment history, notes, and drawer keyboard/close handling. | `components/command-center/surfaces/CandidateDrawer.tsx`, `components/command-center/surfaces/CandidateDrawer.states.tsx` |
| Proof review | Proof cards, proof bundle review, endorsement/flag controls, source metadata, and compare-to-role entry points. | `components/command-center/proof/ProofBundle.tsx`, `components/command-center/proof/ProofCard.tsx`, `components/command-center/proof/ProofReviewSurface.tsx` |
| Compare view | Top-candidate comparison, weighted signals, recommendation summary, risk notes, and pin controls. | `components/command-center/surfaces/CompareView.tsx`, `components/command-center/surfaces/CompareView.states.tsx` |
| Talent pools | Saved shortlist workspace, pool metadata, refresh criteria, member list, and pool actions. | `components/command-center/surfaces/TalentPoolBuilder.tsx`, `components/command-center/surfaces/TalentPoolBuilder.states.tsx` |
| Role builder | Role definition workspace with responsibilities, capability requirements, signals, compensation, and location policy. | `components/command-center/surfaces/RoleBuilder.tsx`, `components/command-center/surfaces/RoleBuilder.states.tsx` |
| Pathway author | Company-authored hiring pathway editor with milestones, evidence requirements, rubric controls, and ordering actions. | `components/command-center/surfaces/PathwayAuthor.tsx`, `components/command-center/surfaces/PathwayAuthor.states.tsx` |
| Assessment launcher | Pre-filled assessment launch surface with pool/role context, duration, integrity settings, candidate copy, and confirmation controls. | `components/command-center/surfaces/AssessmentLauncher.tsx`, `components/command-center/surfaces/AssessmentLauncher.states.tsx` |
| Pipeline board | Kanban-style pipeline by stage, candidate cards, conditional action banner, drag handling, and settle-only drop animation. | `components/command-center/surfaces/PipelineBoard.tsx`, `components/command-center/surfaces/PipelineBoard.states.tsx` |
| Inbox and outreach | Outreach thread list, draft editor, staged queue, template drafts, and send state. | `components/command-center/surfaces/Inbox.tsx`, `components/command-center/surfaces/Inbox.states.tsx`, `lib/agent/outreach-templates.ts` |
| Analytics snapshot | Role-scoped funnel health, trust distribution, completion metrics, pathway signal, and pool health summary. | `components/command-center/surfaces/AnalyticsSnapshot.tsx`, `components/command-center/surfaces/AnalyticsSnapshot.states.tsx`, `lib/demo-data/analytics.ts` |
| Demo sequence | Scripted IBM/investor presentation route, step overlay, autoplay-by-spacebar flow, and presenter notes. | `app/chat/demo/page.tsx`, `app/chat/demo/README.md` |
| Agent and fixture data | Local intent parser, deterministic executor, reasoning stream, store/reducer, demo candidates, roles, pools, pathways, messages, and analytics fixtures. | `lib/agent/intent-parser.ts`, `lib/agent/executor.ts`, `lib/agent/reasoning-stream.ts`, `lib/agent/store.ts`, `lib/agent/types.ts`, `lib/demo-data/candidates.ts`, `lib/demo-data/roles.ts`, `lib/demo-data/talent-pools.ts`, `lib/demo-data/pathways.ts`, `lib/demo-data/messages.ts`, `lib/demo-data/types.ts` |
| Theme and global a11y styling | Light/dark design tokens, focus-visible ring, skip-link styling, reduced-motion behavior, and base surface colors. | `app/globals.css` |

## 2. Command Coverage

These commands are supported by the local parser/executor in `lib/agent/intent-parser.ts` and `lib/agent/executor.ts`.

| Intent | Example command | Result |
| --- | --- | --- |
| Search candidates | `Find me senior Rust developers with backend systems proof and strong GitHub signal` | Opens ranked candidate results filtered and sorted by fixture-backed readiness, proof, and skills. |
| Filter results | `Only show Rust candidates with fresh proof and score above 80` | Refilters the active result set by skills, proof freshness, and score threshold. |
| Compare candidates | `Compare the top 3` | Opens compare view with the top three shortlist candidates selected. |
| Save pool | `Save these as Rust Backend shortlist` | Creates a saved pool and opens the pool builder. |
| Contact candidates | `Contact top 5` | Opens inbox drafts for the selected or top candidates. |
| Create role | `Create role for Senior Rust Backend Engineer` | Opens the role builder with the current role context. |
| Build pathway | `Build pathway for Rust Backend` | Opens the pathway authoring surface for a company-defined role pathway. |
| Launch assessment | `Start assessment for shortlisted candidates` | Opens the assessment launcher. The demo route also scripts the phrase `Launch a 2-hour simulation for this pool`; the general parser currently recognizes assessment, screen, or test wording. |
| Move pipeline | `Move Alex and Priya to interview once they pass` | Moves named candidates to the requested stage in local state and opens the pipeline board. The conditional "once they pass" is represented in the demo UI, not executed by a background worker. |
| Explain match | `Show why Anika ranks above Leo` | Opens the candidate drawer with explanation output and risk notes. |
| Export shortlist | `Export shortlist CSV` | Routes to the results surface and records the export intent. File export is not wired in this phase. |
| Show analytics | `Show funnel health for Rust Backend role` | Opens the analytics snapshot. |
| Open candidate | `Open candidate Anika Rao` | Opens the candidate drawer with the matched candidate selected. |
| Unknown fallback | `Book the recruiter a flight` | Returns an unsupported-command response and keeps the current surface. |

## 3. Theme Parity

Dark and light mode share the same token contract from `app/globals.css`: `bg-bg`, `bg-surface`, `bg-panel`, `text-text`, `text-text-muted`, `text-text-subtle`, `border-border`, `accent`, `focus`, `danger`, and `success`. Each built surface uses those tokens rather than hard-coded one-theme colors.

| Surface | Light | Dark |
| --- | --- | --- |
| Shell, top bar, left nav, skip link | Pass | Pass |
| Command input, slash menu, thread, structured outputs | Pass | Pass |
| Keyboard help sheet | Pass | Pass |
| Candidate results | Pass | Pass |
| Candidate drawer and proof review | Pass | Pass |
| Compare view | Pass | Pass |
| Talent pool builder | Pass | Pass |
| Role builder | Pass | Pass |
| Pathway author | Pass | Pass |
| Assessment launcher | Pass | Pass |
| Pipeline board | Pass | Pass |
| Inbox and outreach drafts | Pass | Pass |
| Analytics snapshot | Pass | Pass |
| `/chat/demo` overlay and end card | Pass | Pass |

## 4. Keyboard Map

On macOS, use `Cmd`; on Windows/Linux, use `Ctrl`.

| Shortcut | Behavior |
| --- | --- |
| `Cmd/Ctrl+K` | Focus command input and open the slash command menu. |
| `Cmd/Ctrl+1` | Go to Chat/results. |
| `Cmd/Ctrl+2` | Go to Candidates/results. |
| `Cmd/Ctrl+3` | Go to Pools. |
| `Cmd/Ctrl+4` | Go to Roles. |
| `Cmd/Ctrl+5` | Go to Pathways. |
| `Cmd/Ctrl+6` | Go to Assessments. |
| `Cmd/Ctrl+7` | Go to Pipeline. |
| `Cmd/Ctrl+8` | Go to Inbox. |
| `Cmd/Ctrl+9` | Go to Analytics. |
| `Esc` | Dismiss palette, close candidate drawer, or collapse the rail. |
| `/` | Focus command input. |
| `?` | Open Keyboard help sheet. |
| `j` | Move candidate results focus down. |
| `k` | Move candidate results focus up. |
| `x` | Select or deselect the focused result row. |
| `o` | Open the focused candidate. |
| `c` | Compare the focused candidate. |
| `g` then `p` | Go to Pipeline. |
| `ArrowLeft` / `ArrowRight` in candidate drawer | Previous or next candidate. |
| `Space` on `/chat/demo` | Advance the scripted demo one step. |

## 5. Accessibility

Status: clean on `/chat` with the project's available Playwright/browser audit path. The audit reported 0 issues across the default results state plus command palette, keyboard sheet, candidate drawer, compare view, and keyboard navigation flows.

What was checked and fixed:

- Skip link exists at the top of the page and targets `#command-center-main`.
- Focus-visible styles are implemented for both themes through global tokenized focus rules.
- Icon-only buttons have explicit `aria-label` text.
- Disclosure and modal elements expose roles, labels, and `aria-expanded` or dialog state where applicable.
- Major landmarks and regions have labels: command canvas, context rail, results surface, drawer, conversation, and module nav.
- Result list navigation supports keyboard focus, selection, open, and compare actions without relying on pointer input.

Caveat: `axe-core` or `@axe-core/playwright` is not installed in the repository. The completed check used the equivalent browser/DOM audit already available through the project Playwright stack. Add `axe-core` to CI before external release if the ship gate requires a literal axe artifact.

## 6. Performance

Budget: `/chat` initial-load JavaScript under 250 KB gzip.

Actual measured result: 225.3 KB gzip, 751.6 KB raw.

Measurement method: production build via `npm.cmd run build`, local `next start` on `127.0.0.1:3003`, Chromium navigation to `/chat`, and counting only `/_next/static/*.js` files actually fetched during initial route load.

Status: pass.

Implementation note: `components/command-center/ContextRail.tsx` keeps `CandidateResults` in the initial route and dynamically imports non-initial rail surfaces with `next/dynamic` so compare, drawer, pools, roles, pathways, assessments, pipeline, inbox, and analytics load on demand.

## 7. Demo Script

Demo route: `/chat/demo`

Presenter notes: `app/chat/demo/README.md`

The demo is a 15-step guided tour over the real command-center UI. Each click or `Space` advances one step. Target runtime is 4 minutes, with presenter notes for Aristotle greeting, search, reasoning, ranked results, compare, saved pool, assessment launch, conditional pipeline, role-scoped analytics, and the final iNGEN proof-first end card.

## 8. Known Gaps

- Aristotle is a deterministic local command router, not a real LLM agent.
- Candidate, role, pathway, pool, inbox, analytics, and assessment data are fixture-backed, not connected to ATS, GitHub, email, calendar, HRIS, or assessment vendors.
- Assessment launch confirms UI state only; no assessment provider or candidate delivery is wired.
- Pipeline conditional actions are represented in UI/demo state; there is no background job worker or pass/fail event processor.
- Export shortlist records intent but does not write CSV/PDF/JSON files yet.
- Outreach drafts are local state; they do not send real email.
- Analytics is a static role-scoped snapshot, not live warehouse metrics.
- Authentication, RBAC, tenant isolation, audit-log persistence, and data-retention controls are not implemented.
- The local production server can report a 404 for `/_vercel/insights/script.js` because Vercel Analytics is unavailable outside Vercel. This is not a `/chat` application runtime failure.
- A literal axe-core artifact is not present because axe-core is not installed; the current clean result is from the available Playwright-equivalent audit.

## 9. Phase 2 Next Steps

- Replace the deterministic router with a real LLM agent that uses typed tools, structured plans, and auditable tool results.
- Connect ATS/HRIS systems for requisitions, candidates, stages, recruiter ownership, and hiring-team feedback.
- Add live proof ingestion from GitHub, assessments, portfolio artifacts, and internal engineering evidence sources.
- Persist the trust layer: verification status, evidence freshness, integrity flags, reviewer actions, and audit trails.
- Add authentication, RBAC, tenant isolation, organization settings, and data-retention policies.
- Wire assessment provider launch, candidate delivery, completion callbacks, and pass/fail events.
- Add real email/calendar integrations for outreach, scheduling, and reply ingestion.
- Add a background job system for conditional pipeline actions and policy-gated automation.
- Add CI gates for axe-core, route bundle budgets, smoke flows, and keyboard-only regression coverage.

## IBM Demo Email Pitch

iNGEN's command center is a proof-first operating surface for software hiring. In the demo, Aristotle turns plain-language recruiter intent into ranked candidates, visible reasoning steps, comparison views, reusable pools, assessment launchers, conditional pipeline actions, and role-scoped funnel analytics. The system is agent-centric, but it does not hide the work: each recommendation is tied to proof bundles, GitHub signal, evidence freshness, readiness scores, integrity flags, and human-readable risk notes. Company-authored pathways let an enterprise define what good engineering evidence looks like for its own roles, then reuse that standard across sourcing, assessment, and pipeline decisions. The trust layer is visible throughout the UI: candidates carry verification levels, assessment history, proof artifacts, and audit-friendly actions rather than opaque scores. Explainable matching is built into the compare view and candidate drawer, so recruiters can see why Aristotle recommends one candidate and where human review is still required. For IBM, the value is operational control at enterprise scale: one workspace that shows the evidence, preserves decision context, and keeps automation bounded by recruiter confirmation, audit trails, and company-defined hiring pathways. The demo stays concrete: every claim maps to a visible surface, while remaining integrations and governance needs are marked as Phase Two next steps.
