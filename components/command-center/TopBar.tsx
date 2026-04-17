"use client"

import { ChevronRight, Keyboard } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAgentStore } from "@/lib/agent/store"

type TopBarProps = {
  onOpenKeyboardHelp: () => void
  keyboardHelpOpen: boolean
}

export function TopBar({ onOpenKeyboardHelp, keyboardHelpOpen }: TopBarProps) {
  const { currentRole, roles, setCurrentRole } = useAgentStore()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="font-display text-3xl uppercase tracking-wide text-text">iNGEN</div>
        <ChevronRight className="h-4 w-4 text-text-subtle" />
        <div className="truncate text-sm font-semibold text-text-muted">Recruiter Command Center</div>
        <label className="hidden sm:block">
          <span className="sr-only">Role context</span>
          <select
            value={currentRole?.id ?? ""}
            onChange={(event) => setCurrentRole(event.target.value || null)}
            className="h-7 max-w-[260px] border border-border bg-surface-elevated px-2 font-mono text-[10px] uppercase tracking-wide text-text-muted outline-none focus:border-accent"
          >
            <option value="">No role filter</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenKeyboardHelp}
          aria-label="Open keyboard shortcuts"
          aria-haspopup="dialog"
          aria-expanded={keyboardHelpOpen}
          aria-controls="command-center-keyboard-dialog"
          aria-keyshortcuts="Shift+/"
          className="inline-flex h-8 items-center gap-2 border border-border bg-surface-elevated px-3 font-mono text-[10px] uppercase tracking-wide text-text-muted hover:border-border-strong hover:text-text"
        >
          <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
          Keyboard
        </button>
        <ThemeToggle />
        <div className="flex h-8 w-8 items-center justify-center border border-border bg-surface-elevated font-mono text-[10px] text-text">
          ME
        </div>
      </div>
    </header>
  )
}
