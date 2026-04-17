import type { AgentMessage } from "@/lib/agent/types"

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(timestamp))
}

export function UserMessage({ message }: { message: AgentMessage }) {
  return (
    <article className="border-b border-border px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle">YOU · {timeLabel(message.timestamp)}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-text">{message.content}</p>
    </article>
  )
}
