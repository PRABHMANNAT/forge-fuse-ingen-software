"use client"

import type { Transition } from "framer-motion"

export const SURFACE_TRANSITION: Transition = { duration: 0.2, ease: "easeOut" }
export const DISABLED_TRANSITION: Transition = { duration: 0 }

export const DRAWER_TRANSITION: Transition = {
  type: "spring",
  damping: 26,
  stiffness: 280,
  mass: 0.82,
}

export const PIPELINE_SETTLE_TRANSITION: Transition = { duration: 0.2, ease: "easeOut" }
export const REASONING_STEP_TRANSITION: Transition = { duration: 0.18, ease: "easeOut" }

export function surfaceMotion(shouldReduceMotion: boolean, axis: "x" | "y" = "y") {
  const offset = shouldReduceMotion ? 0 : 4

  return {
    initial: shouldReduceMotion ? false : { opacity: 0, [axis]: offset },
    animate: { opacity: 1, [axis]: 0 },
    exit: shouldReduceMotion ? { opacity: 1, [axis]: 0 } : { opacity: 0, [axis]: offset },
    transition: shouldReduceMotion ? DISABLED_TRANSITION : SURFACE_TRANSITION,
  }
}

export function drawerMotion(shouldReduceMotion: boolean) {
  return {
    initial: shouldReduceMotion ? false : { opacity: 0, x: 4 },
    animate: { opacity: 1, x: 0 },
    exit: shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 4 },
    transition: shouldReduceMotion ? DISABLED_TRANSITION : DRAWER_TRANSITION,
  }
}
