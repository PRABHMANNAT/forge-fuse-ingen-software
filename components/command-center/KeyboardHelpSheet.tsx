"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NAV_ITEMS } from "./navigation"

const GLOBAL_SHORTCUTS = [
  { keys: "Cmd+K", description: "Open the command palette at the input." },
  { keys: "/", description: "Focus the command input." },
  { keys: "Esc", description: "Close the drawer, collapse the rail, or dismiss the palette." },
  { keys: "?", description: "Open this keyboard sheet." },
  { keys: "g then p", description: "Jump to the pipeline module." },
]

const LIST_SHORTCUTS = [
  { keys: "j / k", description: "Move through candidate rows." },
  { keys: "x", description: "Select the focused row." },
  { keys: "o", description: "Open the focused candidate." },
  { keys: "c", description: "Compare the focused candidate." },
]

type KeyboardHelpSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardHelpSheet({ open, onOpenChange }: KeyboardHelpSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-border bg-surface p-0">
        <DialogHeader className="border-b border-border bg-surface px-5 py-4 text-left">
          <DialogTitle className="font-display text-4xl uppercase text-text">Keyboard</DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            Recruiter command-center shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-px bg-border md:grid-cols-2">
          <section className="bg-surface p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Global</div>
            <div className="mt-4 space-y-2">
              {GLOBAL_SHORTCUTS.map((item) => (
                <div key={item.keys} className="grid grid-cols-[96px_1fr] gap-3 border border-border bg-surface-elevated px-3 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-wide text-text">{item.keys}</div>
                  <div className="text-sm text-text-muted">{item.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">List Control</div>
            <div className="mt-4 space-y-2">
              {LIST_SHORTCUTS.map((item) => (
                <div key={item.keys} className="grid grid-cols-[96px_1fr] gap-3 border border-border bg-surface-elevated px-3 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-wide text-text">{item.keys}</div>
                  <div className="text-sm text-text-muted">{item.description}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="border-t border-border bg-surface px-5 py-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">Modules</div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {NAV_ITEMS.filter((item) => item.shortcut).map((item) => (
              <div key={item.module} className="grid grid-cols-[72px_1fr] gap-3 border border-border bg-surface-elevated px-3 py-3">
                <div className="font-mono text-[10px] uppercase tracking-wide text-text">Cmd+{item.shortcut}</div>
                <div className="text-sm text-text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  )
}
