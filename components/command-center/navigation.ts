"use client"

import {
  BarChart3,
  Briefcase,
  FolderKanban,
  Inbox,
  Layers3,
  ListChecks,
  MessageSquare,
  Settings,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react"
import type { Surface } from "@/lib/agent/types"

export type CommandCenterNavItem = {
  module: string
  label: string
  icon: LucideIcon
  surface: Surface
  shortcut?: string
}

export const NAV_ITEMS: CommandCenterNavItem[] = [
  { module: "chat", label: "Chat", icon: MessageSquare, surface: "results_table", shortcut: "1" },
  { module: "candidates", label: "Cands", icon: Users, surface: "results_table", shortcut: "2" },
  { module: "pools", label: "Pools", icon: Layers3, surface: "pool_builder", shortcut: "3" },
  { module: "roles", label: "Roles", icon: Briefcase, surface: "role_builder", shortcut: "4" },
  { module: "paths", label: "Paths", icon: Waypoints, surface: "pathway_builder", shortcut: "5" },
  { module: "assess", label: "Assess", icon: ListChecks, surface: "assessment_launcher", shortcut: "6" },
  { module: "pipeline", label: "Pipe", icon: FolderKanban, surface: "pipeline_board", shortcut: "7" },
  { module: "inbox", label: "Inbox", icon: Inbox, surface: "inbox", shortcut: "8" },
  { module: "stats", label: "Stats", icon: BarChart3, surface: "analytics_panel", shortcut: "9" },
  { module: "settings", label: "Set", icon: Settings, surface: "results_table" },
]

export function findNavItem(module: string | null) {
  return NAV_ITEMS.find((item) => item.module === module)
}

export function findNavItemByShortcut(shortcut: string) {
  return NAV_ITEMS.find((item) => item.shortcut === shortcut)
}
