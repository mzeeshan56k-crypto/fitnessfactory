// Pre-built content library: exercises (with animation patterns), workouts,
// program templates and coach forms. Populated fully by the seed-content build.
import type { Exercise, Workout, Program } from "@/lib/data";
import type { CoachForm } from "@/lib/store";

/* -------------------------------------------------------------------------- */
/*  Exercises                                                                  */
/*  Every exercise sets a `pattern` from the valid list used by the animated   */
/*  graphic: squat | hinge | push | pull | press | lunge | core | curl |       */
/*  cardio | mobility. `video` is intentionally left undefined.                */
/* -------------------------------------------------------------------------- */

export const seedExercises: Exercise[] = [
  // ----- Squat pattern -----
  { id: "ex_back_squat", name: "Barbell Back Squat", muscle: "Quads", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "back_squat", pattern: "squat" },
  { id: "ex_front_squat", name: "Front Squat", muscle: "Quads", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "front_squat", pattern: "squat" },
  { id: "ex_goblet_squat", name: "Goblet Squat", muscle: "Quads", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "goblet_squat", pattern: "squat" },
  { id: "ex_leg_press", name: "Leg Press", muscle: "Quads", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "leg_press", pattern: "squat" },
  { id: "ex_wall_sit", name: "Wall Sit", muscle: "Quads", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "wall_sit", pattern: "squat" },
  { id: "ex_box_squat", name: "Box Squat", muscle: "Glutes", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "box_squat", pattern: "squat" },

  // ----- Hinge pattern -----
  { id: "ex_deadlift", name: "Conventional Deadlift", muscle: "Back", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "deadlift", pattern: "hinge" },
  { id: "ex_rdl", name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "rdl", pattern: "hinge" },
  { id: "ex_kb_swing", name: "Kettlebell Swing", muscle: "Posterior", equipment: "Kettlebell", level: "Intermediate", type: "Cardio", videoThumb: "kb_swing", pattern: "hinge" },
  { id: "ex_hip_thrust", name: "Barbell Hip Thrust", muscle: "Glutes", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "hip_thrust", pattern: "hinge" },
  { id: "ex_good_morning", name: "Good Morning", muscle: "Hamstrings", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "good_morning", pattern: "hinge" },
  { id: "ex_back_extension", name: "Back Extension", muscle: "Lower back", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "back_extension", pattern: "hinge" },

  // ----- Push pattern (horizontal/chest) -----
  { id: "ex_bench_press", name: "Barbell Bench Press", muscle: "Chest", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "bench_press", pattern: "push" },
  { id: "ex_incline_db_press", name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "incline_db_press", pattern: "push" },
  { id: "ex_pushup", name: "Push-Up", muscle: "Chest", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "pushup", pattern: "push" },
  { id: "ex_chest_fly", name: "Cable Chest Fly", muscle: "Chest", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "chest_fly", pattern: "push" },
  { id: "ex_dips", name: "Chest Dips", muscle: "Chest", equipment: "Bodyweight", level: "Intermediate", type: "Strength", videoThumb: "dips", pattern: "push" },
  { id: "ex_machine_chest_press", name: "Machine Chest Press", muscle: "Chest", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "machine_chest_press", pattern: "push" },

  // ----- Pull pattern (back/row) -----
  { id: "ex_pullup", name: "Pull-Up", muscle: "Back", equipment: "Bodyweight", level: "Intermediate", type: "Strength", videoThumb: "pullup", pattern: "pull" },
  { id: "ex_lat_pulldown", name: "Lat Pulldown", muscle: "Back", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "lat_pulldown", pattern: "pull" },
  { id: "ex_bent_row", name: "Barbell Bent-Over Row", muscle: "Back", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "bent_row", pattern: "pull" },
  { id: "ex_db_row", name: "One-Arm Dumbbell Row", muscle: "Back", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "db_row", pattern: "pull" },
  { id: "ex_seated_cable_row", name: "Seated Cable Row", muscle: "Back", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "seated_cable_row", pattern: "pull" },
  { id: "ex_face_pull", name: "Face Pull", muscle: "Rear delts", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "face_pull", pattern: "pull" },

  // ----- Press pattern (overhead/shoulders) -----
  { id: "ex_ohp", name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "ohp", pattern: "press" },
  { id: "ex_db_shoulder_press", name: "Seated Dumbbell Shoulder Press", muscle: "Shoulders", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "db_shoulder_press", pattern: "press" },
  { id: "ex_lateral_raise", name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "lateral_raise", pattern: "press" },
  { id: "ex_arnold_press", name: "Arnold Press", muscle: "Shoulders", equipment: "Dumbbell", level: "Intermediate", type: "Strength", videoThumb: "arnold_press", pattern: "press" },
  { id: "ex_push_press", name: "Push Press", muscle: "Shoulders", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "push_press", pattern: "press" },

  // ----- Lunge pattern -----
  { id: "ex_db_lunge", name: "Walking Dumbbell Lunge", muscle: "Glutes", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "db_lunge", pattern: "lunge" },
  { id: "ex_bulgarian_split", name: "Bulgarian Split Squat", muscle: "Quads", equipment: "Dumbbell", level: "Intermediate", type: "Strength", videoThumb: "bulgarian_split", pattern: "lunge" },
  { id: "ex_step_up", name: "Dumbbell Step-Up", muscle: "Glutes", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "step_up", pattern: "lunge" },
  { id: "ex_reverse_lunge", name: "Reverse Lunge", muscle: "Glutes", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "reverse_lunge", pattern: "lunge" },

  // ----- Curl pattern (arms / isolation) -----
  { id: "ex_bicep_curl", name: "Dumbbell Bicep Curl", muscle: "Biceps", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "bicep_curl", pattern: "curl" },
  { id: "ex_hammer_curl", name: "Hammer Curl", muscle: "Biceps", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "hammer_curl", pattern: "curl" },
  { id: "ex_barbell_curl", name: "Barbell Curl", muscle: "Biceps", equipment: "Barbell", level: "Beginner", type: "Strength", videoThumb: "barbell_curl", pattern: "curl" },
  { id: "ex_tricep_pushdown", name: "Tricep Pushdown", muscle: "Triceps", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "tricep_pushdown", pattern: "curl" },
  { id: "ex_overhead_tri_ext", name: "Overhead Tricep Extension", muscle: "Triceps", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "overhead_tri_ext", pattern: "curl" },
  { id: "ex_leg_curl", name: "Seated Leg Curl", muscle: "Hamstrings", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "leg_curl", pattern: "curl" },
  { id: "ex_leg_extension", name: "Leg Extension", muscle: "Quads", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "leg_extension", pattern: "curl" },

  // ----- Core pattern -----
  { id: "ex_plank", name: "Plank", muscle: "Core", equipment: "Bodyweight", level: "Beginner", type: "Core", videoThumb: "plank", pattern: "core" },
  { id: "ex_crunch", name: "Crunch", muscle: "Core", equipment: "Bodyweight", level: "Beginner", type: "Core", videoThumb: "crunch", pattern: "core" },
  { id: "ex_hanging_leg_raise", name: "Hanging Leg Raise", muscle: "Core", equipment: "Bodyweight", level: "Intermediate", type: "Core", videoThumb: "hanging_leg_raise", pattern: "core" },
  { id: "ex_russian_twist", name: "Russian Twist", muscle: "Obliques", equipment: "Bodyweight", level: "Beginner", type: "Core", videoThumb: "russian_twist", pattern: "core" },
  { id: "ex_hollow_hold", name: "Hollow Body Hold", muscle: "Core", equipment: "Bodyweight", level: "Intermediate", type: "Core", videoThumb: "hollow_hold", pattern: "core" },
  { id: "ex_cable_crunch", name: "Cable Crunch", muscle: "Core", equipment: "Cable", level: "Beginner", type: "Core", videoThumb: "cable_crunch", pattern: "core" },

  // ----- Cardio pattern -----
  { id: "ex_treadmill_intervals", name: "Treadmill Intervals", muscle: "Full body", equipment: "Cardio", level: "Beginner", type: "Cardio", videoThumb: "treadmill_intervals", pattern: "cardio" },
  { id: "ex_rowing_erg", name: "Rowing Erg", muscle: "Full body", equipment: "Cardio", level: "Beginner", type: "Cardio", videoThumb: "rowing_erg", pattern: "cardio" },
  { id: "ex_burpee", name: "Burpee", muscle: "Full body", equipment: "Bodyweight", level: "Intermediate", type: "Cardio", videoThumb: "burpee", pattern: "cardio" },
  { id: "ex_mountain_climber", name: "Mountain Climbers", muscle: "Full body", equipment: "Bodyweight", level: "Beginner", type: "Cardio", videoThumb: "mountain_climber", pattern: "cardio" },
  { id: "ex_jump_rope", name: "Jump Rope", muscle: "Calves", equipment: "Cardio", level: "Beginner", type: "Cardio", videoThumb: "jump_rope", pattern: "cardio" },
  { id: "ex_assault_bike", name: "Assault Bike Sprints", muscle: "Full body", equipment: "Cardio", level: "Intermediate", type: "Cardio", videoThumb: "assault_bike", pattern: "cardio" },
  { id: "ex_box_jump", name: "Box Jump", muscle: "Quads", equipment: "Bodyweight", level: "Intermediate", type: "Cardio", videoThumb: "box_jump", pattern: "cardio" },

  // ----- Mobility pattern -----
  { id: "ex_hip_flow", name: "Hip Mobility Flow", muscle: "Hips", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "hip_flow", pattern: "mobility" },
  { id: "ex_thoracic_stretch", name: "Thoracic Spine Stretch", muscle: "Upper back", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "thoracic_stretch", pattern: "mobility" },
  { id: "ex_foam_roll", name: "Foam Roll Quads", muscle: "Quads", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "foam_roll", pattern: "mobility" },
  { id: "ex_world_greatest_stretch", name: "World's Greatest Stretch", muscle: "Full body", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "world_greatest_stretch", pattern: "mobility" },
  { id: "ex_cat_cow", name: "Cat-Cow Flow", muscle: "Spine", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "cat_cow", pattern: "mobility" },
];

/* -------------------------------------------------------------------------- */
/*  Workouts — every exerciseId below references an id defined above.          */
/* -------------------------------------------------------------------------- */

export const seedWorkouts: Workout[] = [
  // ===== Full body / general fitness =====
  {
    id: "wk_full_body_a", name: "Full Body A", category: "Full Body", durationMin: 50, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_goblet_squat", name: "Goblet Squat", muscle: "Quads", sets: [{ reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_bench_press", name: "Barbell Bench Press", muscle: "Chest", sets: [{ reps: "8", weight: "—", rest: "90s" }, { reps: "8", weight: "—", rest: "90s" }, { reps: "8", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_db_row", name: "One-Arm Dumbbell Row", muscle: "Back", sets: [{ reps: "10", weight: "—", rest: "60s" }, { reps: "10", weight: "—", rest: "60s" }, { reps: "10", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_plank", name: "Plank", muscle: "Core", sets: [{ reps: "30s", weight: "BW", rest: "45s" }, { reps: "30s", weight: "BW", rest: "45s" }] },
    ],
  },
  {
    id: "wk_full_body_b", name: "Full Body B", category: "Full Body", durationMin: 50, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_rdl", name: "Romanian Deadlift", muscle: "Hamstrings", sets: [{ reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_db_shoulder_press", name: "Seated Dumbbell Shoulder Press", muscle: "Shoulders", sets: [{ reps: "10", weight: "—", rest: "75s" }, { reps: "10", weight: "—", rest: "75s" }, { reps: "10", weight: "—", rest: "75s" }] },
      { exerciseId: "ex_lat_pulldown", name: "Lat Pulldown", muscle: "Back", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_reverse_lunge", name: "Reverse Lunge", muscle: "Glutes", sets: [{ reps: "12", weight: "BW", rest: "60s" }, { reps: "12", weight: "BW", rest: "60s" }] },
    ],
  },
  {
    id: "wk_full_body_express", name: "30-Minute Full Body Express", category: "Full Body", durationMin: 30, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_goblet_squat", name: "Goblet Squat", muscle: "Quads", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_pushup", name: "Push-Up", muscle: "Chest", sets: [{ reps: "12", weight: "BW", rest: "60s" }, { reps: "12", weight: "BW", rest: "60s" }] },
      { exerciseId: "ex_db_row", name: "One-Arm Dumbbell Row", muscle: "Back", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_plank", name: "Plank", muscle: "Core", sets: [{ reps: "30s", weight: "BW", rest: "45s" }, { reps: "30s", weight: "BW", rest: "45s" }] },
    ],
  },

  // ===== Hypertrophy split: Push / Pull / Legs / Upper / Lower =====
  {
    id: "wk_push_day", name: "Push Day (Hypertrophy)", category: "Hypertrophy", durationMin: 60, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "ex_bench_press", name: "Barbell Bench Press", muscle: "Chest", sets: [{ reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }, { reps: "8", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_incline_db_press", name: "Incline Dumbbell Press", muscle: "Chest", sets: [{ reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }] },
      { exerciseId: "ex_db_shoulder_press", name: "Seated Dumbbell Shoulder Press", muscle: "Shoulders", sets: [{ reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }] },
      { exerciseId: "ex_lateral_raise", name: "Lateral Raise", muscle: "Shoulders", sets: [{ reps: "15", weight: "—", rest: "45s" }, { reps: "15", weight: "—", rest: "45s" }] },
      { exerciseId: "ex_tricep_pushdown", name: "Tricep Pushdown", muscle: "Triceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
    ],
  },
  {
    id: "wk_pull_day", name: "Pull Day (Hypertrophy)", category: "Hypertrophy", durationMin: 60, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "ex_lat_pulldown", name: "Lat Pulldown", muscle: "Back", sets: [{ reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }] },
      { exerciseId: "ex_bent_row", name: "Barbell Bent-Over Row", muscle: "Back", sets: [{ reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_seated_cable_row", name: "Seated Cable Row", muscle: "Back", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_face_pull", name: "Face Pull", muscle: "Rear delts", sets: [{ reps: "15", weight: "—", rest: "45s" }, { reps: "15", weight: "—", rest: "45s" }] },
      { exerciseId: "ex_bicep_curl", name: "Dumbbell Bicep Curl", muscle: "Biceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
    ],
  },
  {
    id: "wk_leg_day", name: "Leg Day (Hypertrophy)", category: "Hypertrophy", durationMin: 65, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "ex_back_squat", name: "Barbell Back Squat", muscle: "Quads", sets: [{ reps: "10", weight: "—", rest: "120s" }, { reps: "10", weight: "—", rest: "120s" }, { reps: "8", weight: "—", rest: "120s" }] },
      { exerciseId: "ex_rdl", name: "Romanian Deadlift", muscle: "Hamstrings", sets: [{ reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_leg_press", name: "Leg Press", muscle: "Quads", sets: [{ reps: "12", weight: "—", rest: "90s" }, { reps: "12", weight: "—", rest: "90s" }, { reps: "12", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_leg_curl", name: "Seated Leg Curl", muscle: "Hamstrings", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
    ],
  },
  {
    id: "wk_upper_hypertrophy", name: "Upper Body Hypertrophy", category: "Hypertrophy", durationMin: 60, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "ex_incline_db_press", name: "Incline Dumbbell Press", muscle: "Chest", sets: [{ reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_db_row", name: "One-Arm Dumbbell Row", muscle: "Back", sets: [{ reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }] },
      { exerciseId: "ex_arnold_press", name: "Arnold Press", muscle: "Shoulders", sets: [{ reps: "12", weight: "—", rest: "75s" }, { reps: "12", weight: "—", rest: "75s" }] },
      { exerciseId: "ex_hammer_curl", name: "Hammer Curl", muscle: "Biceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_overhead_tri_ext", name: "Overhead Tricep Extension", muscle: "Triceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
    ],
  },
  {
    id: "wk_lower_hypertrophy", name: "Lower Body Hypertrophy", category: "Hypertrophy", durationMin: 60, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "ex_front_squat", name: "Front Squat", muscle: "Quads", sets: [{ reps: "10", weight: "—", rest: "120s" }, { reps: "10", weight: "—", rest: "120s" }, { reps: "10", weight: "—", rest: "120s" }] },
      { exerciseId: "ex_hip_thrust", name: "Barbell Hip Thrust", muscle: "Glutes", sets: [{ reps: "12", weight: "—", rest: "90s" }, { reps: "12", weight: "—", rest: "90s" }, { reps: "12", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_bulgarian_split", name: "Bulgarian Split Squat", muscle: "Quads", sets: [{ reps: "10", weight: "—", rest: "75s" }, { reps: "10", weight: "—", rest: "75s" }] },
      { exerciseId: "ex_leg_extension", name: "Leg Extension", muscle: "Quads", sets: [{ reps: "15", weight: "—", rest: "60s" }, { reps: "15", weight: "—", rest: "60s" }] },
    ],
  },

  // ===== Strength: low-rep compounds =====
  {
    id: "wk_strength_squat", name: "5x5 Strength — Squat Focus", category: "Strength", durationMin: 55, difficulty: "Advanced",
    exercises: [
      { exerciseId: "ex_back_squat", name: "Barbell Back Squat", muscle: "Quads", sets: [{ reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }] },
      { exerciseId: "ex_bench_press", name: "Barbell Bench Press", muscle: "Chest", sets: [{ reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }] },
      { exerciseId: "ex_bent_row", name: "Barbell Bent-Over Row", muscle: "Back", sets: [{ reps: "5", weight: "—", rest: "90s" }, { reps: "5", weight: "—", rest: "90s" }, { reps: "5", weight: "—", rest: "90s" }] },
    ],
  },
  {
    id: "wk_strength_deadlift", name: "5x5 Strength — Deadlift Focus", category: "Strength", durationMin: 55, difficulty: "Advanced",
    exercises: [
      { exerciseId: "ex_deadlift", name: "Conventional Deadlift", muscle: "Back", sets: [{ reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }] },
      { exerciseId: "ex_ohp", name: "Overhead Press", muscle: "Shoulders", sets: [{ reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }] },
      { exerciseId: "ex_pullup", name: "Pull-Up", muscle: "Back", sets: [{ reps: "5", weight: "BW", rest: "90s" }, { reps: "5", weight: "BW", rest: "90s" }, { reps: "5", weight: "BW", rest: "90s" }] },
    ],
  },
  {
    id: "wk_strength_upper", name: "Heavy Upper Strength", category: "Strength", durationMin: 55, difficulty: "Advanced",
    exercises: [
      { exerciseId: "ex_bench_press", name: "Barbell Bench Press", muscle: "Chest", sets: [{ reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }, { reps: "3", weight: "—", rest: "2min" }] },
      { exerciseId: "ex_push_press", name: "Push Press", muscle: "Shoulders", sets: [{ reps: "5", weight: "—", rest: "2min" }, { reps: "5", weight: "—", rest: "2min" }] },
      { exerciseId: "ex_bent_row", name: "Barbell Bent-Over Row", muscle: "Back", sets: [{ reps: "5", weight: "—", rest: "90s" }, { reps: "5", weight: "—", rest: "90s" }, { reps: "5", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_barbell_curl", name: "Barbell Curl", muscle: "Biceps", sets: [{ reps: "8", weight: "—", rest: "60s" }, { reps: "8", weight: "—", rest: "60s" }] },
    ],
  },

  // ===== Fat loss: circuits / conditioning =====
  {
    id: "wk_fat_loss_circuit", name: "Fat Loss Full-Body Circuit", category: "Conditioning", durationMin: 40, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "ex_goblet_squat", name: "Goblet Squat", muscle: "Quads", sets: [{ reps: "15", weight: "—", rest: "30s" }, { reps: "15", weight: "—", rest: "30s" }, { reps: "15", weight: "—", rest: "30s" }] },
      { exerciseId: "ex_kb_swing", name: "Kettlebell Swing", muscle: "Posterior", sets: [{ reps: "20", weight: "—", rest: "30s" }, { reps: "20", weight: "—", rest: "30s" }, { reps: "20", weight: "—", rest: "30s" }] },
      { exerciseId: "ex_pushup", name: "Push-Up", muscle: "Chest", sets: [{ reps: "12", weight: "BW", rest: "30s" }, { reps: "12", weight: "BW", rest: "30s" }, { reps: "12", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_mountain_climber", name: "Mountain Climbers", muscle: "Full body", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
    ],
  },
  {
    id: "wk_hiit_blast", name: "HIIT Fat Burner", category: "Conditioning", durationMin: 25, difficulty: "Intermediate",
    exercises: [
      { exerciseId: "ex_burpee", name: "Burpee", muscle: "Full body", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_jump_rope", name: "Jump Rope", muscle: "Calves", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_box_jump", name: "Box Jump", muscle: "Quads", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_russian_twist", name: "Russian Twist", muscle: "Obliques", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
    ],
  },
  {
    id: "wk_metcon", name: "Metabolic Conditioning", category: "Conditioning", durationMin: 35, difficulty: "Advanced",
    exercises: [
      { exerciseId: "ex_assault_bike", name: "Assault Bike Sprints", muscle: "Full body", sets: [{ reps: "30s", weight: "—", rest: "60s" }, { reps: "30s", weight: "—", rest: "60s" }, { reps: "30s", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_kb_swing", name: "Kettlebell Swing", muscle: "Posterior", sets: [{ reps: "20", weight: "—", rest: "45s" }, { reps: "20", weight: "—", rest: "45s" }, { reps: "20", weight: "—", rest: "45s" }] },
      { exerciseId: "ex_burpee", name: "Burpee", muscle: "Full body", sets: [{ reps: "10", weight: "BW", rest: "60s" }, { reps: "10", weight: "BW", rest: "60s" }, { reps: "10", weight: "BW", rest: "60s" }] },
    ],
  },

  // ===== Endurance / conditioning steady =====
  {
    id: "wk_endurance_row", name: "Endurance Row & Core", category: "Endurance", durationMin: 45, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_rowing_erg", name: "Rowing Erg", muscle: "Full body", sets: [{ reps: "5min", weight: "—", rest: "90s" }, { reps: "5min", weight: "—", rest: "90s" }, { reps: "5min", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_plank", name: "Plank", muscle: "Core", sets: [{ reps: "45s", weight: "BW", rest: "45s" }, { reps: "45s", weight: "BW", rest: "45s" }] },
      { exerciseId: "ex_hollow_hold", name: "Hollow Body Hold", muscle: "Core", sets: [{ reps: "30s", weight: "BW", rest: "45s" }, { reps: "30s", weight: "BW", rest: "45s" }] },
    ],
  },
  {
    id: "wk_endurance_run", name: "Cardio Endurance Builder", category: "Endurance", durationMin: 40, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_treadmill_intervals", name: "Treadmill Intervals", muscle: "Full body", sets: [{ reps: "8 rounds", weight: "—", rest: "60s" }, { reps: "8 rounds", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_jump_rope", name: "Jump Rope", muscle: "Calves", sets: [{ reps: "60s", weight: "BW", rest: "60s" }, { reps: "60s", weight: "BW", rest: "60s" }, { reps: "60s", weight: "BW", rest: "60s" }] },
    ],
  },

  // ===== Core / accessory =====
  {
    id: "wk_core_crusher", name: "Core Crusher", category: "Core", durationMin: 25, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_plank", name: "Plank", muscle: "Core", sets: [{ reps: "45s", weight: "BW", rest: "45s" }, { reps: "45s", weight: "BW", rest: "45s" }, { reps: "45s", weight: "BW", rest: "45s" }] },
      { exerciseId: "ex_crunch", name: "Crunch", muscle: "Core", sets: [{ reps: "20", weight: "BW", rest: "45s" }, { reps: "20", weight: "BW", rest: "45s" }, { reps: "20", weight: "BW", rest: "45s" }] },
      { exerciseId: "ex_russian_twist", name: "Russian Twist", muscle: "Obliques", sets: [{ reps: "20", weight: "BW", rest: "45s" }, { reps: "20", weight: "BW", rest: "45s" }] },
      { exerciseId: "ex_hanging_leg_raise", name: "Hanging Leg Raise", muscle: "Core", sets: [{ reps: "12", weight: "BW", rest: "60s" }, { reps: "12", weight: "BW", rest: "60s" }] },
    ],
  },

  // ===== Arm specialization =====
  {
    id: "wk_arms_blast", name: "Arms Blast", category: "Hypertrophy", durationMin: 40, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_barbell_curl", name: "Barbell Curl", muscle: "Biceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_hammer_curl", name: "Hammer Curl", muscle: "Biceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_tricep_pushdown", name: "Tricep Pushdown", muscle: "Triceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_overhead_tri_ext", name: "Overhead Tricep Extension", muscle: "Triceps", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
    ],
  },

  // ===== Mobility / recovery =====
  {
    id: "wk_mobility_reset", name: "Mobility & Recovery Reset", category: "Mobility", durationMin: 30, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_cat_cow", name: "Cat-Cow Flow", muscle: "Spine", sets: [{ reps: "60s", weight: "BW", rest: "30s" }, { reps: "60s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_hip_flow", name: "Hip Mobility Flow", muscle: "Hips", sets: [{ reps: "60s", weight: "BW", rest: "30s" }, { reps: "60s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_world_greatest_stretch", name: "World's Greatest Stretch", muscle: "Full body", sets: [{ reps: "45s", weight: "BW", rest: "30s" }, { reps: "45s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_foam_roll", name: "Foam Roll Quads", muscle: "Quads", sets: [{ reps: "60s", weight: "BW", rest: "30s" }, { reps: "60s", weight: "BW", rest: "30s" }] },
    ],
  },

  // ===== Beginner intro =====
  {
    id: "wk_beginner_intro", name: "Beginner Intro Session", category: "Full Body", durationMin: 35, difficulty: "Beginner",
    exercises: [
      { exerciseId: "ex_wall_sit", name: "Wall Sit", muscle: "Quads", sets: [{ reps: "30s", weight: "BW", rest: "60s" }, { reps: "30s", weight: "BW", rest: "60s" }] },
      { exerciseId: "ex_machine_chest_press", name: "Machine Chest Press", muscle: "Chest", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_seated_cable_row", name: "Seated Cable Row", muscle: "Back", sets: [{ reps: "12", weight: "—", rest: "60s" }, { reps: "12", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_crunch", name: "Crunch", muscle: "Core", sets: [{ reps: "15", weight: "BW", rest: "45s" }, { reps: "15", weight: "BW", rest: "45s" }] },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Program templates                                                          */
/* -------------------------------------------------------------------------- */

export const seedPrograms: Program[] = [
  { id: "pg_fat_loss_8wk", name: "8-Week Fat Loss", weeks: 8, workoutsPerWeek: 4, focus: "Fat loss", clientsAssigned: 0, color: "from-accent-400 to-accent-600", workoutIds: ["wk_fat_loss_circuit", "wk_hiit_blast", "wk_metcon", "wk_full_body_express"] },
  { id: "pg_hypertrophy_12wk", name: "12-Week Hypertrophy", weeks: 12, workoutsPerWeek: 5, focus: "Muscle gain", clientsAssigned: 0, color: "from-brand-500 to-brand-700", workoutIds: ["wk_push_day", "wk_pull_day", "wk_leg_day", "wk_upper_hypertrophy", "wk_lower_hypertrophy"] },
  { id: "pg_strength_5x5", name: "5x5 Strength Foundations", weeks: 10, workoutsPerWeek: 3, focus: "Strength", clientsAssigned: 0, color: "from-purple-500 to-indigo-600", workoutIds: ["wk_strength_squat", "wk_strength_deadlift", "wk_strength_upper"] },
  { id: "pg_beginner_full_body", name: "Beginner Full-Body", weeks: 6, workoutsPerWeek: 3, focus: "General fitness", clientsAssigned: 0, color: "from-amber-400 to-orange-500", workoutIds: ["wk_full_body_a", "wk_full_body_b", "wk_beginner_intro"] },
  { id: "pg_conditioning_endurance", name: "Conditioning & Endurance", weeks: 8, workoutsPerWeek: 4, focus: "Endurance", clientsAssigned: 0, color: "from-sky-500 to-blue-600", workoutIds: ["wk_endurance_row", "wk_endurance_run", "wk_metcon", "wk_hiit_blast"] },
];

/* -------------------------------------------------------------------------- */
/*  Coach forms                                                                */
/* -------------------------------------------------------------------------- */

export const prebuiltForms: CoachForm[] = [
  {
    id: "form_intake", name: "New Client Intake",
    description: "Collect baseline info from a new client before building their plan.",
    fields: [
      { id: "f1", label: "Primary goal", type: "choice", options: ["Lose fat", "Build muscle", "Get stronger", "Improve endurance", "General health"], required: true },
      { id: "f2", label: "Training experience (years)", type: "number", required: true },
      { id: "f3", label: "Days per week available to train", type: "number", required: true },
      { id: "f4", label: "Do you have access to a gym?", type: "yesno", required: true },
      { id: "f5", label: "Any injuries or limitations we should know about?", type: "long" },
      { id: "f6", label: "What has worked or not worked for you in the past?", type: "long" },
    ],
  },
  {
    id: "form_weekly", name: "Weekly Check-In",
    description: "Track weekly progress, adherence and recovery.",
    fields: [
      { id: "f1", label: "Current body weight (lb)", type: "number", required: true },
      { id: "f2", label: "Workouts completed this week", type: "number", required: true },
      { id: "f3", label: "Energy levels", type: "scale" },
      { id: "f4", label: "Sleep quality", type: "scale" },
      { id: "f5", label: "Nutrition adherence", type: "scale" },
      { id: "f6", label: "Wins or struggles this week", type: "long" },
    ],
  },
  {
    id: "form_monthly", name: "Monthly Progress Review",
    description: "A deeper monthly review of results, measurements and goals.",
    fields: [
      { id: "f1", label: "Current body weight (lb)", type: "number", required: true },
      { id: "f2", label: "Waist measurement (in)", type: "number" },
      { id: "f3", label: "How satisfied are you with your progress?", type: "scale", required: true },
      { id: "f4", label: "Did you hit your goals this month?", type: "yesno", required: true },
      { id: "f5", label: "Biggest win this month", type: "short" },
      { id: "f6", label: "What would you like to focus on next month?", type: "long" },
    ],
  },
  {
    id: "form_nutrition", name: "Nutrition & Lifestyle Questionnaire",
    description: "Understand eating habits, lifestyle and daily routine.",
    fields: [
      { id: "f1", label: "Typical daily eating pattern", type: "long", required: true },
      { id: "f2", label: "Dietary preference", type: "choice", options: ["No restrictions", "Vegetarian", "Vegan", "Pescatarian", "Keto / low-carb", "Other"], required: true },
      { id: "f3", label: "Any food allergies or intolerances?", type: "short" },
      { id: "f4", label: "Glasses of water per day", type: "number" },
      { id: "f5", label: "Average hours of sleep per night", type: "number" },
      { id: "f6", label: "Stress level day-to-day", type: "scale" },
      { id: "f7", label: "Do you drink alcohol regularly?", type: "yesno" },
    ],
  },
  {
    id: "form_readiness", name: "Injury & Readiness Screen",
    description: "Screen for injuries and daily readiness before a session.",
    fields: [
      { id: "f1", label: "Are you currently free of pain or injury?", type: "yesno", required: true },
      { id: "f2", label: "If not, where is the pain or limitation?", type: "short" },
      { id: "f3", label: "Overall readiness to train today", type: "scale", required: true },
      { id: "f4", label: "Muscle soreness level", type: "scale" },
      { id: "f5", label: "Hours slept last night", type: "number" },
      { id: "f6", label: "Anything else your coach should know today?", type: "long" },
    ],
  },
];
