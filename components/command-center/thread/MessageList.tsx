"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { AgentMessage } from "@/lib/agent/types"
import { AgentMessage as AgentMessageView } from "./AgentMessage"
import { UserMessage } from "./UserMessage"

export function MessageList({ messages }: { messages: AgentMessage[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPinned, setIsPinned] = useState(true)
  const [hasNew, setHasNew] = useState(false)
  const visibleMessages = useMemo(() => (messages.length > 50 ? messages.slice(-50) : messages), [messages])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (isPinned) {
      container.scrollTop = container.scrollHeight
      setHasNew(false)
    } else {
      setHasNew(true)
    }
  }, [isPinned, messages.length])

  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    setIsPinned(distanceFromBottom < 48)
  }

  const jumpToBottom = () => {
    const container = containerRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
    setIsPinned(true)
    setHasNew(false)
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation"
      >
        {messages.length > 50 && (
          <div className="border-b border-border px-5 py-2 font-mono text-[10px] uppercase tracking-wide text-text-subtle">
            Virtualized · showing latest 50 of {messages.length}
          </div>
        )}
        {visibleMessages.map((message) =>
          message.role === "user" ? <UserMessage key={message.id} message={message} /> : <AgentMessageView key={message.id} message={message} />,
        )}
      </div>
      {hasNew && (
        <button
          type="button"
          onClick={jumpToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 border border-border-strong bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-primary-foreground"
          aria-label="Jump to newest message"
        >
          New
        </button>
      )}
    </div>
  )
}
