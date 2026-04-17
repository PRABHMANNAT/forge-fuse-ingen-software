"use client"

import { useAgentStore } from "@/lib/agent/store"
import { CommandInput } from "./thread/CommandInput"
import { MessageList } from "./thread/MessageList"

const SUGGESTED_COMMANDS = [
  "Find senior Rust developer with backend proof",
  "Compare top 3",
  "Save as Rust Backend shortlist",
  "Contact top 5",
  "Launch assessment for shortlisted",
  "Show analytics",
]

export function AgentCanvas() {
  const { messages, sendMessage } = useAgentStore()

  return (
    <main id="command-center-main" className="flex min-h-0 flex-1 flex-col bg-bg" aria-label="Aristotle command canvas">
      {messages.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="w-full max-w-3xl border border-border bg-surface p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">ARISTOTLE ONLINE</div>
            <h1 className="mt-3 font-display text-5xl uppercase tracking-wide text-text md:text-6xl">
              Turn recruiting intent into proof-backed action.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
              Ask Aristotle to search, compare, contact, move pipeline stages, launch assessments, or explain why one candidate ranks above another.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {SUGGESTED_COMMANDS.map((command) => (
                <button
                  key={command}
                  type="button"
                  onClick={() => void sendMessage(command)}
                  className="border border-border bg-surface-elevated px-3 py-2 text-left text-xs font-semibold text-text-muted transition-colors hover:border-border-strong hover:text-text"
                >
                  {command}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}
      <CommandInput />
    </main>
  )
}
