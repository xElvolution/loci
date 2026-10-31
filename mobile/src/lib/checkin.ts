import type { CheckinInput } from "./api/types";

export type Draft = { mood: number; pain: number; sleep: number; appetite: number; energy: number; signs: string[]; note: string };
export const EMPTY_DRAFT: Draft = { mood: 0, pain: -1, sleep: 0, appetite: 0, energy: 0, signs: [], note: "" };

export function isComplete(d: Draft): boolean {
  return [d.mood, d.sleep, d.appetite, d.energy].every((v) => v >= 1 && v <= 5) && d.pain >= 0 && d.pain <= 10;
}

export function toInput(d: Draft): CheckinInput {
  if (!isComplete(d)) throw new Error("Answer each question first");
  return { mood: d.mood, pain: d.pain, sleep: d.sleep, appetite: d.appetite, energy: d.energy, signs: [...new Set(d.signs)], note: d.note.trim().slice(0, 600) };
}

export function toggleSign(d: Draft, id: string): Draft {
  return { ...d, signs: d.signs.includes(id) ? d.signs.filter((s) => s !== id) : [...d.signs, id] };
}
