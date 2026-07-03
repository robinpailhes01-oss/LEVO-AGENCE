import type { LeadStage } from "@/lib/db";

/** Pipeline réel ORION — ordre de progression pour ne jamais faire reculer un lead. */
const STAGE_ORDER: LeadStage[] = [
  "new", "contacted", "opened", "replied", "audit_received", "loom_sent", "follow_up", "won",
];

function stageRank(s: string): number {
  const i = STAGE_ORDER.indexOf(s as LeadStage);
  return i === -1 ? -1 : i;
}

/** Ne fait jamais reculer un lead — sauf `lost`, signal négatif fort accepté sauf si déjà gagné. */
export function nextStage(current: LeadStage, candidate: LeadStage): LeadStage {
  if (candidate === "lost") return current === "won" ? current : "lost";
  if (stageRank(candidate) > stageRank(current)) return candidate;
  return current;
}
