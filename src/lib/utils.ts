import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Stable callback ref: scrolls an element into view when it mounts (e.g. a
// form error banner that would otherwise appear off-screen above a long form).
// Module-level so React only calls it on mount, not on every render.
export const revealOnMount = (el: HTMLElement | null) => el?.scrollIntoView({ block: "center", behavior: "smooth" });
