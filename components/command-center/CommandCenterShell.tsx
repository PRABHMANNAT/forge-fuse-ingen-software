"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { dispatchResultsListAction, focusCommandInput, isEditableTarget } from "@/components/command-center/events"
import { useAgentStore } from "@/lib/agent/store"
import { AgentCanvas } from "./AgentCanvas"
import { ContextRail } from "./ContextRail"
import { KeyboardHelpSheet } from "./KeyboardHelpSheet"
import { LeftNav } from "./LeftNav"
import { TopBar } from "./TopBar"
import { findNavItem, findNavItemByShortcut, NAV_ITEMS, type CommandCenterNavItem } from "./navigation"

export function CommandCenterShell() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { activeSurfaces, closeSurface, collapseRail, openSurface } = useAgentStore()
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false)
  const sequenceRef = useRef<string | null>(null)
  const sequenceTimeoutRef = useRef<number | null>(null)
  const activeModule = searchParams.get("module") ?? "chat"

  const openModule = (item: CommandCenterNavItem) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("module", item.module)
    router.push(`${pathname}?${nextParams.toString()}`)
    openSurface(item.surface)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const key = event.key.toLowerCase()
      const editable = isEditableTarget(event.target)

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault()
        focusCommandInput({ openMenu: true })
        return
      }

      if ((event.metaKey || event.ctrlKey) && /^[1-9]$/.test(event.key)) {
        const item = findNavItemByShortcut(event.key)
        if (!item) return
        event.preventDefault()
        openModule(item)
        return
      }

      if (!editable && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === "/") {
        if (event.shiftKey) {
          event.preventDefault()
          setIsKeyboardHelpOpen(true)
        } else {
          event.preventDefault()
          focusCommandInput()
        }
        return
      }

      if (!editable && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === "?") {
        event.preventDefault()
        setIsKeyboardHelpOpen(true)
        return
      }

      if (!editable && activeSurfaces.includes("results_table")) {
        if (key === "j") {
          event.preventDefault()
          dispatchResultsListAction("next")
          return
        }
        if (key === "k") {
          event.preventDefault()
          dispatchResultsListAction("previous")
          return
        }
        if (key === "x") {
          event.preventDefault()
          dispatchResultsListAction("select")
          return
        }
        if (key === "o") {
          event.preventDefault()
          dispatchResultsListAction("open")
          return
        }
        if (key === "c") {
          event.preventDefault()
          dispatchResultsListAction("compare")
          return
        }
      }

      if (!editable && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (sequenceRef.current === "g" && key === "p") {
          const pipelineItem = findNavItem("pipeline") ?? NAV_ITEMS.find((item) => item.module === "pipeline")
          if (pipelineItem) {
            event.preventDefault()
            openModule(pipelineItem)
          }
          sequenceRef.current = null
          if (sequenceTimeoutRef.current) window.clearTimeout(sequenceTimeoutRef.current)
          sequenceTimeoutRef.current = null
          return
        }

        if (key === "g") {
          sequenceRef.current = "g"
          if (sequenceTimeoutRef.current) window.clearTimeout(sequenceTimeoutRef.current)
          sequenceTimeoutRef.current = window.setTimeout(() => {
            sequenceRef.current = null
            sequenceTimeoutRef.current = null
          }, 900)
          return
        }
      }

      if (event.key === "Escape") {
        if (isKeyboardHelpOpen) return
        if (activeSurfaces.includes("candidate_drawer")) {
          closeSurface("candidate_drawer")
        } else {
          collapseRail()
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      if (sequenceTimeoutRef.current) window.clearTimeout(sequenceTimeoutRef.current)
    }
  }, [activeSurfaces, closeSurface, collapseRail, isKeyboardHelpOpen, openModule])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg text-text">
      <a href="#command-center-main" className="skip-link">
        Skip to command center
      </a>
      <TopBar onOpenKeyboardHelp={() => setIsKeyboardHelpOpen(true)} keyboardHelpOpen={isKeyboardHelpOpen} />
      <div className="flex min-h-0 flex-1">
        <LeftNav activeModule={activeModule} onOpenModule={openModule} />
        <AgentCanvas />
        <ContextRail />
      </div>
      <KeyboardHelpSheet open={isKeyboardHelpOpen} onOpenChange={setIsKeyboardHelpOpen} />
    </div>
  )
}
