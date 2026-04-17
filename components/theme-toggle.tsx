"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type ThemePreference = "system" | "light" | "dark"

const STORAGE_KEY = "ingen-theme"
const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Monitor }> = [
  { value: "system", label: "Use system theme", icon: Monitor },
  { value: "light", label: "Use light theme", icon: Sun },
  { value: "dark", label: "Use dark theme", icon: Moon },
]

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

function resolveTheme(preference: ThemePreference) {
  if (preference !== "system") return preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.dataset.themePreference = preference
  root.classList.toggle("dark", resolved === "dark")
}

export function ThemeToggle({ className }: { className?: string }) {
  const [preference, setPreference] = useState<ThemePreference>("system")

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const nextPreference = isThemePreference(stored) ? stored : "system"
    setPreference(nextPreference)
    applyTheme(nextPreference)
  }, [])

  useEffect(() => {
    if (preference !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [preference])

  const updatePreference = (nextPreference: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, nextPreference)
    setPreference(nextPreference)
    applyTheme(nextPreference)
  }

  return (
    <div
      className={cn(
        "inline-flex h-8 items-center border border-border bg-surface text-text-muted",
        className,
      )}
      role="group"
      aria-label="Theme preference"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = option.value === preference
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={isActive}
            title={option.label}
            onClick={() => updatePreference(option.value)}
            className={cn(
              "flex h-8 w-8 items-center justify-center border-r border-border transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
              isActive
                ? "bg-accent text-primary-foreground"
                : "bg-transparent text-text-muted hover:bg-accent-muted hover:text-text",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
