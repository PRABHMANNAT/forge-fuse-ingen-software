"use client"

import { Suspense } from "react"
import { CommandCenterShell } from "@/components/command-center/CommandCenterShell"
import { AgentProvider } from "@/lib/agent/store"

export default function ChatPage() {
  return (
    <AgentProvider>
      <Suspense fallback={<div className="h-screen bg-bg" />}>
        <CommandCenterShell />
      </Suspense>
    </AgentProvider>
  )
}
