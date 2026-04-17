"use client"

export const COMMAND_INPUT_FOCUS_EVENT = "command-center:focus-command-input"
export const RESULTS_LIST_ACTION_EVENT = "command-center:results-list-action"

export type CommandInputFocusDetail = {
  openMenu?: boolean
}

export type ResultsListAction = "next" | "previous" | "select" | "open" | "compare"

export type ResultsListActionDetail = {
  action: ResultsListAction
}

export function focusCommandInput(detail: CommandInputFocusDetail = {}) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<CommandInputFocusDetail>(COMMAND_INPUT_FOCUS_EVENT, { detail }))
}

export function dispatchResultsListAction(action: ResultsListAction) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<ResultsListActionDetail>(RESULTS_LIST_ACTION_EVENT, { detail: { action } }))
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
    ),
  )
}
