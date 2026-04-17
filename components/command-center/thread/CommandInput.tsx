"use client"

import { ArrowUp, Slash } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { COMMAND_INPUT_FOCUS_EVENT, type CommandInputFocusDetail } from "@/components/command-center/events"
import { useAgentStore } from "@/lib/agent/store"
import type { AgentMessage, Intent } from "@/lib/agent/types"

const DEFAULT_SUGGESTIONS = [
  "Find senior Rust developer with backend proof",
  "Compare top 3",
  "Save as Rust Backend shortlist",
  "Contact top 5",
  "Launch assessment for shortlisted",
  "Show analytics",
]

const FALLBACK_RESPONSE_SUGGESTIONS = [
  "Filter to fresh proof only",
  "Move Anika, Leo to interview",
  "Show why Anika ranks above Leo",
  "Open candidate Hannah Clarke",
]

const RESPONSE_SCOPED_SUGGESTIONS: Partial<Record<Intent, string[]>> = {
  search_candidates: ["Compare top 3", "Save as Rust Backend shortlist", "Contact top 5", "Filter to fresh proof only"],
  compare_candidates: ["Show why Anika ranks above Leo", "Move Anika, Leo to interview", "Launch assessment for shortlisted", "Export shortlist CSV"],
  save_pool: ["Contact top 5", "Show analytics", "Launch assessment for shortlisted", "Open candidate Anika Rao"],
  explain_match: ["Compare top 3", "Open candidate Anika Rao", "Move Anika to interview", "Save as High Trust shortlist"],
  show_analytics: ["Find senior Rust developer with backend proof", "Show response rate", "Contact top 5", "Save as Analytics Review pool"],
}

function suggestionsForLastResponse(messages: AgentMessage[]) {
  const lastAgentMessage = [...messages].reverse().find((message) => message.role === "agent")
  const lastIntent = lastAgentMessage?.actions?.[0]?.intent
  if (lastIntent && RESPONSE_SCOPED_SUGGESTIONS[lastIntent]) {
    return RESPONSE_SCOPED_SUGGESTIONS[lastIntent]!.slice(0, 4)
  }
  return messages.length ? FALLBACK_RESPONSE_SUGGESTIONS : DEFAULT_SUGGESTIONS.slice(0, 4)
}

export function CommandInput() {
  const { messages, process } = useAgentStore()
  const [value, setValue] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestions = useMemo(() => suggestionsForLastResponse(messages), [messages])

  useEffect(() => {
    const onFocusRequest = (event: Event) => {
      const detail = (event as CustomEvent<CommandInputFocusDetail>).detail
      if (detail?.openMenu) setIsMenuOpen(true)
      textareaRef.current?.focus()
      textareaRef.current?.scrollIntoView({ block: "nearest" })
    }
    window.addEventListener(COMMAND_INPUT_FOCUS_EVENT, onFocusRequest as EventListener)
    return () => window.removeEventListener(COMMAND_INPUT_FOCUS_EVENT, onFocusRequest as EventListener)
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "0px"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`
  }, [value])

  useEffect(() => {
    if (!isMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [isMenuOpen])

  const submit = async () => {
    const next = value.trim()
    if (!next) return
    setValue("")
    setIsMenuOpen(false)
    await process(next)
  }

  return (
    <div className="border-t border-border bg-surface p-3">
      <div className="mb-2 flex gap-2 overflow-x-auto" aria-label="Suggested commands">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setValue(suggestion)}
            className="shrink-0 border border-border bg-surface-elevated px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="relative border border-border-strong bg-surface-elevated">
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center border border-border bg-surface text-text-muted hover:text-text"
          aria-label="Open slash command menu"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-controls="command-input-slash-menu"
        >
          <Slash className="h-4 w-4" />
        </button>
        {isMenuOpen && (
          <div id="command-input-slash-menu" role="menu" className="absolute bottom-full left-0 z-20 mb-2 w-72 border border-border bg-surface-elevated p-1">
            {DEFAULT_SUGGESTIONS.map((command) => (
              <button
                key={command}
                type="button"
                role="menuitem"
                onClick={() => {
                  setValue(command)
                  setIsMenuOpen(false)
                  textareaRef.current?.focus()
                }}
                className="block w-full px-2 py-2 text-left text-xs text-text-muted hover:bg-accent-muted hover:text-text"
              >
                {command}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && isMenuOpen) {
              event.preventDefault()
              event.stopPropagation()
              setIsMenuOpen(false)
              return
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
          rows={1}
          placeholder="Command Aristotle..."
          aria-label="Command Aristotle"
          className="max-h-36 min-h-12 w-full resize-none bg-transparent py-3 pl-14 pr-14 text-sm text-text outline-none placeholder:text-text-subtle"
        />
        <button
          type="button"
          onClick={() => void submit()}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center border border-border bg-accent text-primary-foreground hover:opacity-90"
          aria-label="Send command"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
