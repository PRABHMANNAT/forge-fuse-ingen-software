"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"
import dynamic from "next/dynamic"
import { useAgentStore } from "@/lib/agent/store"
import { drawerMotion, surfaceMotion } from "./motion"
import { CandidateResults } from "./surfaces/CandidateResults"

const AssessmentLauncher = dynamic(() => import("./surfaces/AssessmentLauncher").then((module) => module.AssessmentLauncher), { ssr: false })
const AnalyticsSnapshot = dynamic(() => import("./surfaces/AnalyticsSnapshot").then((module) => module.AnalyticsSnapshot), { ssr: false })
const CandidateDrawer = dynamic(() => import("./surfaces/CandidateDrawer").then((module) => module.CandidateDrawer), { ssr: false })
const CompareView = dynamic(() => import("./surfaces/CompareView").then((module) => module.CompareView), { ssr: false })
const Inbox = dynamic(() => import("./surfaces/Inbox").then((module) => module.Inbox), { ssr: false })
const PathwayAuthor = dynamic(() => import("./surfaces/PathwayAuthor").then((module) => module.PathwayAuthor), { ssr: false })
const PipelineBoard = dynamic(() => import("./surfaces/PipelineBoard").then((module) => module.PipelineBoard), { ssr: false })
const RoleBuilder = dynamic(() => import("./surfaces/RoleBuilder").then((module) => module.RoleBuilder), { ssr: false })
const TalentPoolBuilder = dynamic(() => import("./surfaces/TalentPoolBuilder").then((module) => module.TalentPoolBuilder), { ssr: false })

export function ContextRail() {
  const { activeSurfaces, collapseRail, results, shortlist, selectedCandidates } = useAgentStore()
  const shouldReduceMotion = Boolean(useReducedMotion())
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

  return (
    <AnimatePresence initial={false}>
      {!activeSurface ? null : (
        <motion.aside
          key="context-rail"
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
          {...surfaceMotion(shouldReduceMotion, "x")}
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
              aria-controls="context-rail-panel"
              aria-expanded="true"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {showResults || showDrawer || showCompare || showPoolBuilder || showRoleBuilder || showPathwayBuilder || showAssessmentLauncher || showPipelineBoard || showInbox || showAnalytics ? (
            <div className="flex min-h-0 flex-1">
              <AnimatePresence initial={false}>
                {showRoleBuilder ? (
                  <motion.div key="role_builder" className="min-w-[760px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <RoleBuilder />
                  </motion.div>
                ) : null}
                {showPathwayBuilder ? (
                  <motion.div key="pathway_builder" className="min-w-[760px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <PathwayAuthor />
                  </motion.div>
                ) : null}
                {showPoolBuilder ? (
                  <motion.div key="pool_builder" className="min-w-[760px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <TalentPoolBuilder />
                  </motion.div>
                ) : null}
                {showAssessmentLauncher ? (
                  <motion.div key="assessment_launcher" className="min-w-[760px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <AssessmentLauncher />
                  </motion.div>
                ) : null}
                {showAnalytics ? (
                  <motion.div key="analytics_panel" className="min-w-[760px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <AnalyticsSnapshot />
                  </motion.div>
                ) : null}
                {showInbox ? (
                  <motion.div key="inbox" className="min-w-[760px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <Inbox />
                  </motion.div>
                ) : null}
                {showPipelineBoard ? (
                  <motion.div key="pipeline_board" className="min-w-[760px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <PipelineBoard />
                  </motion.div>
                ) : null}
                {showCompare ? (
                  <motion.div key="compare_view" className="min-w-[520px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <CompareView />
                  </motion.div>
                ) : null}
                {showResults ? (
                  <motion.div key="results_table" className="min-w-[400px] flex-1" {...surfaceMotion(shouldReduceMotion)}>
                    <CandidateResults />
                  </motion.div>
                ) : null}
                {showDrawer ? (
                  <motion.div key="candidate_drawer" className="h-full w-[640px] shrink-0" {...drawerMotion(shouldReduceMotion)}>
                    <CandidateDrawer />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div key="placeholder_surface" className="flex-1 space-y-4 overflow-y-auto p-4" {...surfaceMotion(shouldReduceMotion)}>
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
            </motion.div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
