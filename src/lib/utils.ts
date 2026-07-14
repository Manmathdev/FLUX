import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Reasonably-unique id generator (no deps). */
export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 9) +
    Date.now().toString(36).slice(-4)
  );
}
