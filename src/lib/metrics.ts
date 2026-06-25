// Live, derived client metrics. Adherence and goal-progress used to be static
// numbers on the client record, so logging a workout or a weigh-in never moved
// them. These helpers derive both from the member's real activity (completed
// sessions + logged bodyweight) so the figures update the moment something is
// logged — instantly for the member (their own data updates locally) and on the
// next sync tick for the coach.

import type { Client, ClientPlan, Program, WorkoutCompletion } from "@/lib/data";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * How many sessions a week the client is expected to train — taken from their
 * assigned program, then their assigned workout count, then a sensible default.
 */
export function weeklyTarget(plan: ClientPlan | undefined, programs: Program[]): number {
  const prog = plan?.programId ? programs.find((p) => p.id === plan.programId) : undefined;
  if (prog?.workoutsPerWeek) return Math.max(1, prog.workoutsPerWeek);
  const assigned = plan?.workoutIds?.length ?? 0;
  if (assigned > 0) return Math.min(assigned, 6);
  return 3;
}

/** Sessions logged in the trailing 7 days. */
export function sessionsThisWeek(completions: WorkoutCompletion[] | undefined): number {
  const list = completions ?? [];
  const now = Date.now();
  return list.filter((w) => now - new Date(w.date).getTime() < WEEK_MS).length;
}

/**
 * Live adherence (0–100): sessions logged this week vs. the weekly target.
 * Falls back to the stored value when the client hasn't logged anything yet,
 * so manually-entered and demo numbers stay intact until real activity exists.
 */
export function clientAdherence(
  client: Pick<Client, "adherence">,
  completions: WorkoutCompletion[] | undefined,
  plan: ClientPlan | undefined,
  programs: Program[],
): number {
  const list = completions ?? [];
  if (list.length === 0) return clamp(client.adherence ?? 0);
  const target = weeklyTarget(plan, programs);
  return clamp((sessionsThisWeek(list) / target) * 100);
}

/**
 * Live progress to goal (0–100), derived from how far the client's bodyweight
 * has moved from their start toward their goal. Works for both fat-loss
 * (start > goal) and gaining (goal > start) targets. Falls back to the stored
 * progress when start/goal weights aren't set yet.
 */
export function clientProgress(
  client: Pick<Client, "startWeight" | "goalWeight" | "currentWeight" | "progress">,
): number {
  const { startWeight, goalWeight, currentWeight } = client;
  if (startWeight > 0 && goalWeight > 0 && startWeight !== goalWeight) {
    const total = startWeight - goalWeight; // total change required (signed)
    const done = startWeight - currentWeight; // change achieved so far (signed)
    return clamp((done / total) * 100);
  }
  return clamp(client.progress ?? 0);
}

/** A client with its live adherence + progress merged over the stored values. */
export function withLiveMetrics(
  client: Client,
  completions: WorkoutCompletion[] | undefined,
  plan: ClientPlan | undefined,
  programs: Program[],
): Client {
  return {
    ...client,
    adherence: clientAdherence(client, completions, plan, programs),
    progress: clientProgress(client),
  };
}
