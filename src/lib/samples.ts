// Optional example dataset. Loaded only when the user clicks "Load example data".
// The live app starts empty — this is here so the platform can be explored fully.

import {
  clients, exercises, workouts, programs, mealPlans, conversations, appointments,
} from "@/lib/data";
import {
  kanbanColumns, challenges, aiSuggestions, platformUsers, broadcasts,
} from "@/lib/platform";
import { seedExercises, seedWorkouts, seedPrograms, prebuiltForms } from "@/lib/seed-content";
import type { DB } from "@/lib/store";

// Merge the small demo data with the full pre-built library (de-duped by id).
const mergedExercises = [...seedExercises, ...exercises.filter((e) => !seedExercises.some((s) => s.id === e.id))];
const mergedWorkouts = [...seedWorkouts, ...workouts.filter((w) => !seedWorkouts.some((s) => s.id === w.id))];
const mergedPrograms = [...seedPrograms, ...programs.filter((p) => !seedPrograms.some((s) => s.id === p.id))];

export const sampleData: DB = {
  clients,
  exercises: mergedExercises,
  workouts: mergedWorkouts,
  programs: mergedPrograms,
  mealPlans,
  conversations,
  appointments,
  kanban: kanbanColumns,
  challenges,
  aiSuggestions,
  users: platformUsers,
  broadcasts: broadcasts.map((b) => ({ ...b })),
  checkins: [],
  forms: prebuiltForms,
  settings: {
    trainerName: "Alex Coach",
    trainerEmail: "alex@ffkc.app",
    businessName: "FitForge Coaching",
    brandColor: "#1b82f5",
  },
  currentClientId: clients[0]?.id ?? null,
  seeded: true,
};
