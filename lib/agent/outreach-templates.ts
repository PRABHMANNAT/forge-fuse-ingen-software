import type { Candidate, OpenRole, OutreachThread } from "@/lib/demo-data/types"
import type { InboxDraft, OutreachTemplateKind } from "./types"

const TEMPLATE_TIME = "2026-04-17T09:30:00Z"

export const templateLabels: Record<OutreachTemplateKind, string> = {
  initial_outreach: "Initial outreach",
  assessment_invite: "Assessment invite",
  tryout_invite: "Tryout invite",
  interview_schedule: "Interview schedule",
  offer: "Offer",
  nurture: "Nurture",
  polite_reject: "Polite reject",
}

function labelize(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
}

function firstName(candidate: Candidate) {
  return candidate.name.split(" ")[0]
}

function primaryEvidence(candidate: Candidate) {
  const bundle = candidate.proofBundles[0]
  const skill = candidate.skills[0]
  return `${bundle.artifactCount} artifacts in a ${labelize(bundle.trustLevel)} bundle and verified ${skill?.name ?? "role"} evidence`
}

export function templateForThreadStage(stage: OutreachThread["stage"]): OutreachTemplateKind {
  switch (stage) {
    case "assessment-sent":
      return "assessment_invite"
    case "tryout-scheduled":
      return "tryout_invite"
    case "interviewing":
      return "interview_schedule"
    case "closed":
      return "polite_reject"
    default:
      return "initial_outreach"
  }
}

export function draftForTemplate(template: OutreachTemplateKind, candidate: Candidate, role: OpenRole): InboxDraft {
  const signal = primaryEvidence(candidate)
  const subjectMap: Record<OutreachTemplateKind, string> = {
    initial_outreach: `${role.title} at ${role.company} - proof-first review`,
    assessment_invite: `${role.title} assessment invite`,
    tryout_invite: `${role.title} tryout project`,
    interview_schedule: `${role.title} interview scheduling`,
    offer: `${role.title} offer details`,
    nurture: `${role.title} follow-up for future timing`,
    polite_reject: `${role.title} update from ${role.company}`,
  }

  const bodyMap: Record<OutreachTemplateKind, string> = {
    initial_outreach: `Hi ${firstName(candidate)},\n\nAristotle matched your ${signal} to our ${role.title} opening at ${role.company}. We review proof before pedigree, and your profile stands out on readiness (${candidate.readinessScore.score}/100) plus traceable execution.\n\nIf timing is right, I can share the role context and next step.\n\nBest,\nRecruiting`,
    assessment_invite: `Hi ${firstName(candidate)},\n\nWe would like to move you to the next step for ${role.title}. This assessment is scoped to the role rubric and focuses on evidence, tradeoffs, and execution quality rather than trick questions.\n\nIf you are open, I will send the brief and deadline today.\n\nBest,\nRecruiting`,
    tryout_invite: `Hi ${firstName(candidate)},\n\nYour proof portfolio is strong enough that we would like to move to a paid tryout for ${role.title}. The work sample is designed to mirror the team environment and will be reviewed against the same rubric Aristotle used to rank the shortlist.\n\nIf that works for your schedule, I will send the project brief and compensation details.\n\nBest,\nRecruiting`,
    interview_schedule: `Hi ${firstName(candidate)},\n\nThe team would like to schedule the next interview for ${role.title}. We want to focus on the proof bundle that drove your ranking and leave enough time for discussion around tradeoffs, ownership, and collaboration.\n\nPlease share two windows that work this week.\n\nBest,\nRecruiting`,
    offer: `Hi ${firstName(candidate)},\n\nWe are ready to move forward with an offer for ${role.title}. The team has high conviction because your proof held up across readiness, trust, and execution depth.\n\nI can walk you through scope, compensation, and start timing once you confirm availability.\n\nBest,\nRecruiting`,
    nurture: `Hi ${firstName(candidate)},\n\nYour profile remains strong for ${role.title}, especially on ${signal}. Timing is the only reason we are not moving immediately.\n\nI would like to keep you warm and re-open the conversation when the next intake starts.\n\nBest,\nRecruiting`,
    polite_reject: `Hi ${firstName(candidate)},\n\nThank you for taking the time to engage with us on ${role.title}. We are not moving forward in the current cycle.\n\nThis decision came down to role fit and current hiring timing, not a lack of quality in your work. We appreciate the proof you shared and would be open to reconnecting if a better-aligned opening appears.\n\nBest,\nRecruiting`,
  }

  return {
    subject: subjectMap[template],
    body: bodyMap[template],
    template,
    updatedAt: TEMPLATE_TIME,
  }
}

export function messageStageForTemplate(template: OutreachTemplateKind): OutreachThread["stage"] {
  switch (template) {
    case "assessment_invite":
      return "assessment-sent"
    case "tryout_invite":
      return "tryout-scheduled"
    case "interview_schedule":
      return "interviewing"
    case "offer":
    case "polite_reject":
      return "closed"
    default:
      return "sent"
  }
}

