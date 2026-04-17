"use client"

import { cn } from "@/lib/utils"
import { NAV_ITEMS, type CommandCenterNavItem } from "./navigation"

type LeftNavProps = {
  activeModule: string
  onOpenModule: (item: CommandCenterNavItem) => void
}

export function LeftNav({ activeModule, onOpenModule }: LeftNavProps) {
  return (
    <nav aria-label="Command center modules" className="hidden w-20 shrink-0 border-r border-border bg-surface md:flex md:flex-col md:items-center md:py-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeModule === item.module
        return (
          <button
            key={item.module}
            type="button"
            onClick={() => onOpenModule(item)}
            title={`${item.label}${item.shortcut ? ` - Cmd+${item.shortcut}` : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-keyshortcuts={item.shortcut ? `Meta+${item.shortcut} Control+${item.shortcut}` : undefined}
            className={cn(
              "group mb-1 flex h-14 w-full flex-col items-center justify-center border-l-2 font-mono text-[9px] uppercase tracking-wide transition-colors",
              isActive
                ? "border-accent bg-accent-muted text-text"
                : "border-transparent text-text-subtle hover:bg-surface-elevated hover:text-text",
            )}
          >
            <Icon className="mb-1 h-4 w-4" aria-hidden="true" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
