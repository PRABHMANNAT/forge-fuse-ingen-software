import type { AgentMessage as AgentMessageType } from "@/lib/agent/types"
import { ReasoningStream } from "./ReasoningStream"
import { StructuredOutput } from "./StructuredOutput"

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(timestamp))
}

export function AgentMessage({ message }: { message: AgentMessageType }) {
  return (
    <article className="border-b border-border bg-surface px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">ARISTOTLE · {timeLabel(message.timestamp)}</div>
      <div className="mt-2 max-w-4xl space-y-1 text-sm leading-6 text-text">
        {message.content.split("\n").map((line, index) => (
          <p key={`${message.id}-line-${index}`} className={line.trim().startsWith("-") ? "pl-3" : undefined}>
            {line}
          </p>
        ))}
      </div>
      {message.reasoning && <ReasoningStream steps={message.reasoning} />}
      {message.output && <StructuredOutput output={message.output} />}
    </article>
  )
}
