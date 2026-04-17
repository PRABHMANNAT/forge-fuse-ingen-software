"use client"

import { X } from "lucide-react"
import { useAgentStore } from "@/lib/agent/store"
import { AssessmentLauncher } from "./surfaces/AssessmentLauncher"
import { AnalyticsSnapshot } from "./surfaces/AnalyticsSnapshot"
import { CandidateDrawer } from "./surfaces/CandidateDrawer"
import { CandidateResults } from "./surfaces/CandidateResults"
import { CompareView } from "./surfaces/CompareView"
import { Inbox } from "./surfaces/Inbox"
import { PathwayAuthor } from "./surfaces/PathwayAuthor"
import { PipelineBoard } from "./surfaces/PipelineBoard"
import { RoleBuilder } from "./surfaces/RoleBuilder"
import { TalentPoolBuilder } from "./surfaces/TalentPoolBuilder"

export function ContextRail() {
  const { activeSurfaces, collapseRail, results, shortlist, selectedCandidates } = useAgentStore()
  const activeSurface = activeSurfaces[0]
  const showResults = activeSurfaces.includes("results_table")
  const showDrawer = activeSurfaces.includes("candidate_drawer")
  const showCompare = activeSurfaces.includes("compare_view")
  const showPoolBuilder = activeSurfaces.includes("pool_builder")
  const showRoleBuilder = activeSurfaces.includes("role_builder")
  const showPathwayBuilder = activeSurfaces.includes("pathway_builder")
  const showAssessmentLauncher = activeSurfaces.includes("assessment_launcher")
  const showPipelineBoard = activeSurfaces.includes("pipeline_board")
  const showInbox = activeSurfaces.includes("inbox")
  const showAnalytics = activeSurfaces.includes("analytics_panel")

  if (!activeSurface) return null

  return (
    <aside
      id="context-rail-panel"
      aria-label="Context rail"
      className={
        (showAssessmentLauncher || showPipelineBoard || showInbox || showAnalytics) && showDrawer
          ? "hidden w-[calc(68vw+640px)] min-w-[1040px] max-w-[1320px] border-l border-border bg-surface lg:flex lg:flex-col"
          : showRoleBuilder || showPathwayBuilder || showAssessmentLauncher || showPipelineBoard || showInbox || showAnalytics
          ? "hidden w-[68vw] min-w-[860px] max-w-[1180px] border-l border-border bg-surface lg:flex lg:flex-col"
          : showPoolBuilder
          ? "hidden w-[68vw] min-w-[860px] max-w-[1180px] border-l border-border bg-surface lg:flex lg:flex-col"
          : showCompare && showDrawer
          ? "hidden w-[calc(62vw+640px)] min-w-[1040px] max-w-[1320px] border-l border-border bg-surface lg:flex lg:flex-col"
          : showCompare
            ? "hidden w-[64vw] min-w-[760px] max-w-[1080px] border-l border-border bg-surface lg:flex lg:flex-col"
            : showResults && showDrawer
          ? "hidden w-[calc(58vw+640px)] min-w-[1040px] max-w-[1280px] border-l border-border bg-surface lg:flex lg:flex-col"
          : showResults
            ? "hidden w-[58vw] min-w-[640px] max-w-[980px] border-l border-border bg-surface lg:flex lg:flex-col"
            : showDrawer
              ? "hidden w-[640px] min-w-[640px] border-l border-border bg-surface lg:flex lg:flex-col"
          : "hidden w-[360px] min-w-[320px] border-l border-border bg-surface lg:flex lg:flex-col"
      }
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Context rail</div>
          <div className="text-sm font-semibold text-text">Surface: {activeSurface}</div>
        </div>
        <button
          type="button"
          onClick={collapseRail}
          className="flex h-8 w-8 items-center justify-center border border-border text-text-muted hover:text-text"
          aria-label="Collapse context rail"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {showResults || showDrawer || showCompare || showPoolBuilder || showRoleBuilder || showPathwayBuilder || showAssessmentLauncher || showPipelineBoard || showInbox || showAnalytics ? (
        <div className="flex min-h-0 flex-1">
          {showRoleBuilder ? (
            <div className="min-w-[760px] flex-1">
              <RoleBuilder />
            </div>
          ) : null}
          {showPathwayBuilder ? (
            <div className="min-w-[760px] flex-1">
              <PathwayAuthor />
            </div>
          ) : null}
          {showPoolBuilder ? (
            <div className="min-w-[760px] flex-1">
              <TalentPoolBuilder />
            </div>
          ) : null}
          {showAssessmentLauncher ? (
            <div className="min-w-[760px] flex-1">
              <AssessmentLauncher />
            </div>
          ) : null}
          {showAnalytics ? (
            <div className="min-w-[760px] flex-1">
              <AnalyticsSnapshot />
            </div>
          ) : null}
          {showInbox ? (
            <div className="min-w-[760px] flex-1">
              <Inbox />
            </div>
          ) : null}
          {showPipelineBoard ? (
            <div className="min-w-[760px] flex-1">
              <PipelineBoard />
            </div>
          ) : null}
          {showCompare ? (
            <div className="min-w-[520px] flex-1">
              <CompareView />
            </div>
          ) : null}
          {showResults ? (
            <div className="min-w-[400px] flex-1">
              <CandidateResults />
            </div>
          ) : null}
          {showDrawer ? <CandidateDrawer /> : null}
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="border border-border bg-surface-elevated p-4">
            <div className="font-display text-3xl uppercase text-text">Surface: {activeSurface}</div>
            <p className="mt-2 text-sm text-text-muted">Placeholder surface for Phase 3. Agent state is already routing here.</p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-border text-center">
            <div className="bg-surface-elevated p-3">
              <div className="font-mono text-[10px] uppercase text-text-subtle">Results</div>
              <div className="text-xl font-semibold text-text">{results.length}</div>
            </div>
            <div className="bg-surface-elevated p-3">
              <div className="font-mono text-[10px] uppercase text-text-subtle">Shortlist</div>
              <div className="text-xl font-semibold text-text">{shortlist.length}</div>
            </div>
            <div className="bg-surface-elevated p-3">
              <div className="font-mono text-[10px] uppercase text-text-subtle">Selected</div>
              <div className="text-xl font-semibold text-text">{selectedCandidates.length}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
