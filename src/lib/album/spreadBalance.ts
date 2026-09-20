import type { LayoutDefinition } from "./layoutTypes";

export function spreadBalanceAdjustment(
  candidate: LayoutDefinition,
  previousSlots: number,
): number {
  if (!previousSlots) return 0;

  let score = 0;
  if (previousSlots >= 4 && candidate.slots >= 3) score -= 22;
  if (previousSlots >= 3 && candidate.slots >= 4) score -= 18;
  if (previousSlots === 1 && candidate.slots === 1) score += 10;
  if (previousSlots === 1 && candidate.slots === 2) score += 6;
  if (previousSlots === 2 && candidate.slots === 1) score += 8;
  if (previousSlots === 2 && candidate.slots === 2) score += 4;
  if (previousSlots === 3 && candidate.slots === 1) score += 7;
  return score;
}
