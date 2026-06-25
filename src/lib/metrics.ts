// Live metric helpers. Adherence and progress are DERIVED from real logged
// activity (completed sessions, weight logged) — never a stale stored value —
// so they update the instant a client does anything, on every portal.

type MetricCtx = {
  clientPlans: Record<string, { workoutIds?: string[]; programId?: string }>;
  programs: { id: string; weeks?: number; workoutsPerWeek?: number }[];
  completions: Record<string, { date: string }[]>;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Expected training sessions per week for a client (assigned > program > default 3). */
export function weeklyTarget(clientId: string, ctx: MetricCtx): number {
  const plan = ctx.clientPlans[clientId];
  const program = plan?.programId ? ctx.programs.find((p) => p.id === plan.programId) : undefined;
  return plan?.workoutIds?.length || program?.workoutsPerWeek || 3;
}

/**
 * Adherence = sessions logged in the last 7 days vs. the weekly target.
 * Falls back to the stored value only when the client has logged nothing yet.
 */
export function clientAdherence(clientId: string, ctx: MetricCtx, fallback = 0): number {
  const comps = ctx.completions[clientId] ?? [];
  if (comps.length === 0) return clamp(fallback);
  const target = weeklyTarget(clientId, ctx);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const recent = comps.filter((c) => +new Date(c.date) >= weekAgo).length;
  return clamp((recent / target) * 100);
}

/**
 * Progress toward goal:
 *  - weight goal set → how far from start weight to goal weight,
 *  - else a program is assigned → % of the program's sessions completed,
 *  - else → mirror adherence (or the stored fallback when nothing logged).
 */
export function clientProgress(
  clientId: string,
  client: { startWeight: number; currentWeight: number; goalWeight: number },
  ctx: MetricCtx,
  fallback = 0,
): number {
  const { startWeight, currentWeight, goalWeight } = client;
  if (startWeight > 0 && goalWeight > 0 && startWeight !== goalWeight) {
    const span = startWeight - goalWeight;
    return clamp(((startWeight - currentWeight) / span) * 100);
  }
  const plan = ctx.clientPlans[clientId];
  const program = plan?.programId ? ctx.programs.find((p) => p.id === plan.programId) : undefined;
  const comps = ctx.completions[clientId] ?? [];
  if (program) {
    const total = Math.max(1, (program.weeks || 8) * (program.workoutsPerWeek || 3));
    return clamp((comps.length / total) * 100);
  }
  return comps.length ? clientAdherence(clientId, ctx, fallback) : clamp(fallback);
}
