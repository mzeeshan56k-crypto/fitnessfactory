// Centralized data types and illustrative content for the Fitness Factory KC
// platform. Client rosters, conversations and appointments start empty — they
// fill in as the coach adds real clients. In production this is backed by a
// database + API.

export type ClientStatus = "active" | "pending" | "inactive";

export interface Client {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: ClientStatus;
  program: string;
  goal: string;
  progress: number; // 0-100 toward current goal
  lastActive: string;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  adherence: number; // % workouts completed
  joinedAt: string;
  phone: string;
  tags: string[];
  coachEmail?: string; // the trainer this client is assigned to
  coachName?: string; // the assigned trainer's display name (shown to the member)
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  type: "Strength" | "Cardio" | "Mobility" | "Core";
  videoThumb: string;
  video?: string;
  instructions?: string; // written how-to / coaching cues for the movement
  pattern?: string; // movement pattern for the animated graphic
}

export interface WorkoutSet {
  reps: string;
  weight: string;
  rest: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  muscle: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  exercises: WorkoutExercise[];
  instructions?: string; // trainer instructions shown to the client
}

export interface Program {
  id: string;
  name: string;
  weeks: number;
  workoutsPerWeek: number;
  focus: string;
  clientsAssigned: number;
  color: string;
  workoutIds?: string[]; // the workouts this program delivers
  instructions?: string; // trainer notes about this phase shown to the client
}

export interface MealPlan {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: { name: string; items: string[]; kcal: number }[];
  tag: string;
}

export interface Message {
  id: string;
  fromClient: boolean;
  text: string;
  time: string;
}

export interface Conversation {
  clientId: string;
  unread: number;
  messages: Message[];
}

export interface Appointment {
  id: string;
  title: string;
  clientId: string;
  day: number; // 0=Mon
  start: string;
  end: string;
  type: "session" | "check-in" | "consult" | "class";
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  weekly: boolean[];
}

// Coach documentation, persisted in the shared workspace (keyed by client id).
export interface ClientNote {
  author: string;
  time: string;
  text: string;
}

export interface FormReview {
  id: string;
  date: string;
  exercise: string;
  faults: string[];
  notes: string;
  weaknessSummary: string[];
  videoName?: string;
}

// What a coach has assigned to a specific client.
export interface ClientPlan {
  workoutIds: string[];
  programId?: string;
  mealPlanId?: string;
  formIds?: string[]; // forms the client should fill out
}

// A logged training session the member completed (coach reviews these).
export interface WorkoutCompletion {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string; // ISO
  setsLogged: number;
  volume: number;
  avgRpe: number;
}

// A progress photo (image stored in Blob; only the URL lives in the workspace).
export interface ProgressPhoto {
  id: string;
  label: string;
  date: string; // ISO
  url: string;
}

// A member's nutrition diary (their own daily logging).
export interface FoodEntry {
  id: string;
  name: string;
  kcal: number;
}
export interface NutritionLog {
  water: number;
  foodLog: FoodEntry[];
  logged: string[]; // names of assigned plan meals checked off
}

// A logged bodyweight entry (member logs these; coach sees the trend).
export interface WeightEntry {
  date: string; // ISO
  weight: number;
}

// Client roster starts empty — coaches add their own real clients.
export const clients: Client[] = [];

export const exercises: Exercise[] = [
  { id: "e1", name: "Barbell Back Squat", muscle: "Quads", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "squat" },
  { id: "e2", name: "Bench Press", muscle: "Chest", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "bench" },
  { id: "e3", name: "Deadlift", muscle: "Back", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "deadlift" },
  { id: "e4", name: "Pull-Up", muscle: "Back", equipment: "Bodyweight", level: "Intermediate", type: "Strength", videoThumb: "pullup" },
  { id: "e5", name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "ohp" },
  { id: "e6", name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "rdl" },
  { id: "e7", name: "Dumbbell Lunge", muscle: "Glutes", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "lunge" },
  { id: "e8", name: "Plank", muscle: "Core", equipment: "Bodyweight", level: "Beginner", type: "Core", videoThumb: "plank" },
  { id: "e9", name: "Kettlebell Swing", muscle: "Posterior", equipment: "Kettlebell", level: "Intermediate", type: "Cardio", videoThumb: "swing" },
  { id: "e10", name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "incline" },
  { id: "e11", name: "Lat Pulldown", muscle: "Back", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "pulldown" },
  { id: "e12", name: "Leg Press", muscle: "Quads", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "legpress" },
  { id: "e13", name: "Bicep Curl", muscle: "Biceps", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "curl" },
  { id: "e14", name: "Tricep Pushdown", muscle: "Triceps", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "pushdown" },
  { id: "e15", name: "Treadmill Intervals", muscle: "Full body", equipment: "Cardio", level: "Beginner", type: "Cardio", videoThumb: "run" },
  { id: "e16", name: "Hip Mobility Flow", muscle: "Hips", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "mobility" },
];

export const programs: Program[] = [
  { id: "p1", name: "12-Week Hypertrophy", weeks: 12, workoutsPerWeek: 5, focus: "Muscle gain", clientsAssigned: 14, color: "from-brand-500 to-brand-700" },
  { id: "p2", name: "Fat Loss Accelerator", weeks: 8, workoutsPerWeek: 4, focus: "Fat loss", clientsAssigned: 22, color: "from-accent-400 to-accent-600" },
  { id: "p3", name: "Powerlifting Block", weeks: 10, workoutsPerWeek: 4, focus: "Strength", clientsAssigned: 9, color: "from-ink-700 to-ink-50" },
  { id: "p4", name: "Beginner Foundations", weeks: 6, workoutsPerWeek: 3, focus: "Habit building", clientsAssigned: 31, color: "from-brand-400 to-accent-500" },
];

export const workouts: Workout[] = [
  {
    id: "w1", name: "Upper Body Push", category: "Strength", durationMin: 55, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "e2", name: "Bench Press", muscle: "Chest", sets: [{ reps: "8", weight: "135 lb", rest: "90s" }, { reps: "8", weight: "145 lb", rest: "90s" }, { reps: "6", weight: "155 lb", rest: "120s" }] },
      { exerciseId: "e5", name: "Overhead Press", muscle: "Shoulders", sets: [{ reps: "10", weight: "75 lb", rest: "75s" }, { reps: "10", weight: "75 lb", rest: "75s" }] },
      { exerciseId: "e14", name: "Tricep Pushdown", muscle: "Triceps", sets: [{ reps: "12", weight: "50 lb", rest: "60s" }, { reps: "12", weight: "50 lb", rest: "60s" }] },
    ],
  },
  {
    id: "w2", name: "Lower Body Power", category: "Strength", durationMin: 60, difficulty: "Advanced",
    exercises: [
      { exerciseId: "e1", name: "Barbell Back Squat", muscle: "Quads", sets: [{ reps: "5", weight: "185 lb", rest: "180s" }, { reps: "5", weight: "205 lb", rest: "180s" }, { reps: "3", weight: "225 lb", rest: "180s" }] },
      { exerciseId: "e6", name: "Romanian Deadlift", muscle: "Hamstrings", sets: [{ reps: "8", weight: "155 lb", rest: "120s" }, { reps: "8", weight: "155 lb", rest: "120s" }] },
      { exerciseId: "e7", name: "Dumbbell Lunge", muscle: "Glutes", sets: [{ reps: "12", weight: "40 lb", rest: "75s" }] },
    ],
  },
  {
    id: "w3", name: "Conditioning Circuit", category: "Cardio", durationMin: 35, difficulty: "Beginner",
    exercises: [
      { exerciseId: "e9", name: "Kettlebell Swing", muscle: "Posterior", sets: [{ reps: "20", weight: "35 lb", rest: "30s" }] },
      { exerciseId: "e15", name: "Treadmill Intervals", muscle: "Full body", sets: [{ reps: "8 rounds", weight: "—", rest: "60s" }] },
      { exerciseId: "e8", name: "Plank", muscle: "Core", sets: [{ reps: "60s", weight: "—", rest: "45s" }] },
    ],
  },
];

export const mealPlans: MealPlan[] = [
  {
    id: "m1", name: "High Protein — Cutting", calories: 1850, protein: 180, carbs: 150, fat: 55, tag: "Fat loss",
    meals: [
      { name: "Breakfast", items: ["Egg white omelette", "Oats & berries", "Black coffee"], kcal: 430 },
      { name: "Lunch", items: ["Grilled chicken", "Quinoa", "Mixed greens"], kcal: 560 },
      { name: "Snack", items: ["Greek yogurt", "Almonds"], kcal: 280 },
      { name: "Dinner", items: ["Baked salmon", "Sweet potato", "Broccoli"], kcal: 580 },
    ],
  },
  {
    id: "m2", name: "Lean Bulk", calories: 2900, protein: 210, carbs: 320, fat: 80, tag: "Muscle gain",
    meals: [
      { name: "Breakfast", items: ["4 eggs", "Whole grain toast", "Avocado"], kcal: 680 },
      { name: "Lunch", items: ["Lean beef", "Jasmine rice", "Veggies"], kcal: 820 },
      { name: "Snack", items: ["Protein shake", "Banana", "Peanut butter"], kcal: 520 },
      { name: "Dinner", items: ["Chicken thigh", "Pasta", "Side salad"], kcal: 880 },
    ],
  },
  {
    id: "m3", name: "Balanced Maintenance", calories: 2200, protein: 150, carbs: 230, fat: 70, tag: "Maintenance",
    meals: [
      { name: "Breakfast", items: ["Greek yogurt bowl", "Granola", "Fruit"], kcal: 480 },
      { name: "Lunch", items: ["Turkey wrap", "Side salad"], kcal: 620 },
      { name: "Snack", items: ["Apple", "String cheese"], kcal: 220 },
      { name: "Dinner", items: ["Stir-fry tofu", "Brown rice"], kcal: 660 },
    ],
  },
];

// Conversations and the calendar start empty — they populate as the coach
// messages real clients and books sessions.
export const conversations: Conversation[] = [];

export const appointments: Appointment[] = [];

// Habit templates a client can build streaks on — start with no logged days.
export const habits: Habit[] = [
  { id: "h1", name: "10k steps", icon: "footprints", streak: 0, weekly: [false, false, false, false, false, false, false] },
  { id: "h2", name: "Drink 3L water", icon: "droplet", streak: 0, weekly: [false, false, false, false, false, false, false] },
  { id: "h3", name: "8h sleep", icon: "moon", streak: 0, weekly: [false, false, false, false, false, false, false] },
  { id: "h4", name: "Log meals", icon: "utensils", streak: 0, weekly: [false, false, false, false, false, false, false] },
];

// Progress chart data for a client
export const weightTrend = [
  { week: "W1", weight: 214, target: 210 },
  { week: "W2", weight: 210, target: 206 },
  { week: "W3", weight: 207, target: 202 },
  { week: "W4", weight: 205, target: 199 },
  { week: "W5", weight: 201, target: 196 },
  { week: "W6", weight: 198, target: 192 },
  { week: "W7", weight: 195, target: 189 },
  { week: "W8", weight: 193, target: 185 },
];

export const strengthTrend = [
  { month: "Jan", squat: 155, bench: 115, deadlift: 205 },
  { month: "Feb", squat: 175, bench: 125, deadlift: 225 },
  { month: "Mar", squat: 185, bench: 135, deadlift: 245 },
  { month: "Apr", squat: 205, bench: 145, deadlift: 275 },
  { month: "May", squat: 215, bench: 155, deadlift: 295 },
  { month: "Jun", squat: 225, bench: 160, deadlift: 315 },
];

export const activityData = [
  { day: "Mon", workouts: 8, sessions: 3 },
  { day: "Tue", workouts: 12, sessions: 4 },
  { day: "Wed", workouts: 6, sessions: 2 },
  { day: "Thu", workouts: 14, sessions: 5 },
  { day: "Fri", workouts: 10, sessions: 3 },
  { day: "Sat", workouts: 15, sessions: 1 },
  { day: "Sun", workouts: 4, sessions: 0 },
];

export const revenueData = [
  { month: "Jan", mrr: 4200 },
  { month: "Feb", mrr: 4800 },
  { month: "Mar", mrr: 5600 },
  { month: "Apr", mrr: 6100 },
  { month: "May", mrr: 7300 },
  { month: "Jun", mrr: 8450 },
];

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

export const avatarColors: Record<string, string> = {
  MC: "bg-brand-500", JO: "bg-accent-500", SR: "bg-purple-500",
  LP: "bg-amber-500", EW: "bg-rose-500", NK: "bg-ink-500",
  AT: "bg-teal-500", DG: "bg-indigo-500",
};
