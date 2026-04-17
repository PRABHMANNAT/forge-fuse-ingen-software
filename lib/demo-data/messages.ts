import type { OutreachThread } from "./types"

export const outreachThreads = [
  {
    id: "thread_001",
    candidateId: "cand_001",
    roleId: "role_001",
    stage: "replied",
    subject: "Rust backend role with proof-first review",
    lastActivityAt: "2026-04-12T09:40:00Z",
    messages: [
      { id: "msg_001", sender: "recruiter", sentAt: "2026-04-10T06:10:00Z", body: "Anika, your ledger consistency write-up is exactly the kind of backend proof our hiring manager wants to review." },
      { id: "msg_002", sender: "candidate", sentAt: "2026-04-12T09:40:00Z", body: "Happy to talk. I can walk through the reconciliation tradeoffs and the retry model I used." },
    ],
  },
  {
    id: "thread_002",
    candidateId: "cand_002",
    roleId: "role_001",
    stage: "tryout-scheduled",
    subject: "Tryout project: order replay debugging",
    lastActivityAt: "2026-04-08T23:15:00Z",
    messages: [
      { id: "msg_003", sender: "aristotle", sentAt: "2026-04-08T22:50:00Z", body: "Prepared a 90-minute tryout around event replay, idempotency, and observability notes." },
      { id: "msg_004", sender: "candidate", sentAt: "2026-04-08T23:15:00Z", body: "Thursday afternoon Sydney time works. Please send the fixture and expected format." },
    ],
  },
  {
    id: "thread_003",
    candidateId: "cand_007",
    roleId: "role_002",
    stage: "interviewing",
    subject: "Accessible workflow interview loop",
    lastActivityAt: "2026-04-14T04:25:00Z",
    messages: [
      { id: "msg_005", sender: "recruiter", sentAt: "2026-04-13T23:00:00Z", body: "Hannah, the panel would like to focus on your accessible dashboard refactor and design-system governance." },
      { id: "msg_006", sender: "candidate", sentAt: "2026-04-14T04:25:00Z", body: "Great. I can bring the audit notes and before/after keyboard flow recordings." },
    ],
  },
  {
    id: "thread_004",
    candidateId: "cand_011",
    roleId: "role_003",
    stage: "assessment-sent",
    subject: "Churn-model error analysis assessment",
    lastActivityAt: "2026-04-05T06:40:00Z",
    messages: [
      { id: "msg_007", sender: "recruiter", sentAt: "2026-04-04T22:15:00Z", body: "Nora, Aristotle matched your telemetry work to our Product ML opening. The assessment is an error-analysis memo, not a take-home build." },
      { id: "msg_008", sender: "candidate", sentAt: "2026-04-05T06:40:00Z", body: "That format is fine. I prefer explaining tradeoffs over optimizing a leaderboard score." },
    ],
  },
  {
    id: "thread_005",
    candidateId: "cand_014",
    roleId: "role_004",
    stage: "opened",
    subject: "Growth design role: activation-flow proof",
    lastActivityAt: "2026-04-03T12:05:00Z",
    messages: [
      { id: "msg_009", sender: "recruiter", sentAt: "2026-04-02T01:20:00Z", body: "Ava, your activation-flow teardown reads like the type of evidence our design lead trusts." },
    ],
  },
  {
    id: "thread_006",
    candidateId: "cand_017",
    roleId: "role_005",
    stage: "replied",
    subject: "SRE pathway and sponsorship timing",
    lastActivityAt: "2026-04-09T03:35:00Z",
    messages: [
      { id: "msg_010", sender: "recruiter", sentAt: "2026-04-08T12:40:00Z", body: "Noah, we can evaluate the SRE pathway while the team clarifies sponsorship timing." },
      { id: "msg_011", sender: "candidate", sentAt: "2026-04-09T03:35:00Z", body: "Thanks for being direct. I can provide the incident review and Terraform module references today." },
    ],
  },
  {
    id: "thread_007",
    candidateId: "cand_020",
    roleId: "role_002",
    stage: "drafted",
    subject: "Product engineer role with design-system proof",
    lastActivityAt: "2026-04-16T18:00:00Z",
    messages: [
      { id: "msg_012", sender: "aristotle", sentAt: "2026-04-16T18:00:00Z", body: "Draft ready. Lead with Talia's design-system migration and support instrumentation plan; mention sponsorship early." },
    ],
  },
  {
    id: "thread_008",
    candidateId: "cand_003",
    roleId: "role_001",
    stage: "sent",
    subject: "Secure Rust backend opening",
    lastActivityAt: "2026-04-11T02:30:00Z",
    messages: [
      { id: "msg_013", sender: "recruiter", sentAt: "2026-04-11T02:30:00Z", body: "Mei, your API gateway review and threat model map strongly to our backend security track." },
    ],
  },
] satisfies OutreachThread[]
