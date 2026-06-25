// Shared, pure metric helpers so the coach view, member view and the
// server-side activity route all compute adherence/progress the same way.
// These make the numbers reflect real logged activity instead of a static
// value, so they update live as the member trains and logs weight.

/** % of assigned workouts completed in the last 7 days (0–100). */
export function computeAdherence(
  plan: { workoutIds?: string[] } | undefined,
  completions: { date: string }[] | undefined,
  fallback = 0,
): number {
  const assigned = plan?.workoutIds?.length ?? 0;
  if (assigned === 0) return fallback;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const recent = (completions ?? []).filter(
    (c) => new Date(c.date).getTime() >= weekAgo,
  ).length;
  return Math.max(0, Math.min(100, Math.round((recent / assigned) * 100)));
}

/** % of the way from start weight to goal weight (works for cuts and bulks). */
export function computeProgress(
  c: { startWeight: number; currentWeight: number; goalWeight: number },
  fallback = 0,
): number {
  const span = c.startWeight - c.goalWeight;
  if (!span) return fallback;
  const pct = Math.round(((c.startWeight - c.currentWeight) / span) * 100);
  return Math.max(0, Math.min(100, pct));
}
