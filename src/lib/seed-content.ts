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
  { id: "ex_back_squat", name: "Barbell Back Squat", muscle: "Quads", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "back_squat", pattern: "squat",
    instructions: "Set the bar across your upper traps and unrack it, stepping back into a shoulder-width stance.\nBrace your core and sit your hips down and back, keeping your chest up and knees tracking over your toes.\nDescend until your thighs are at least parallel to the floor.\nDrive through your mid-foot to stand back up to full lockout." },
  { id: "ex_front_squat", name: "Front Squat", muscle: "Quads", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "front_squat", pattern: "squat",
    instructions: "Rest the bar across the front of your shoulders with your elbows high and fingers under the bar.\nKeep your torso tall and brace your core hard.\nSquat straight down, keeping your elbows pointed forward and chest up.\nDrive through your heels to return to standing." },
  { id: "ex_goblet_squat", name: "Goblet Squat", muscle: "Quads", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "goblet_squat", pattern: "squat",
    instructions: "Hold one dumbbell vertically against your chest, cupping the top head with both hands.\nStand with feet shoulder-width apart, toes turned slightly out.\nSit your hips down between your knees, keeping your chest tall and elbows inside your knees.\nPush through your heels to stand back up." },
  { id: "ex_leg_press", name: "Leg Press", muscle: "Quads", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "leg_press", pattern: "squat",
    instructions: "Sit in the machine with your feet shoulder-width apart on the platform.\nRelease the safeties and lower the platform until your knees reach about 90 degrees.\nKeep your lower back flat against the pad — don't let your hips round up.\nPress the platform back up without locking your knees out hard." },
  { id: "ex_wall_sit", name: "Wall Sit", muscle: "Quads", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "wall_sit", pattern: "squat",
    instructions: "Stand with your back flat against a wall and walk your feet out about two feet.\nSlide down until your hips and knees are bent to 90 degrees, thighs parallel to the floor.\nKeep your back pressed into the wall and weight in your heels.\nHold the position for the prescribed time." },
  { id: "ex_box_squat", name: "Box Squat", muscle: "Glutes", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "box_squat", pattern: "squat",
    instructions: "Set a box or bench behind you so that sitting on it puts your thighs at parallel.\nWith the bar on your back, sit your hips back and down until you lightly touch the box.\nStay tight — don't fully relax or rock on the box.\nDrive through your heels to stand back up explosively." },

  // ----- Hinge pattern -----
  { id: "ex_deadlift", name: "Conventional Deadlift", muscle: "Back", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "deadlift", pattern: "hinge",
    instructions: "Stand with mid-foot under the bar, feet hip-width apart.\nHinge down and grip the bar just outside your knees, then drop your hips and lift your chest.\nTake the slack out of the bar, brace, and drive the floor away with your legs.\nStand tall by locking your hips and knees, then lower under control." },
  { id: "ex_rdl", name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "rdl", pattern: "hinge",
    instructions: "Hold the bar at hip height with a shoulder-width grip, knees softly bent.\nPush your hips straight back, sliding the bar down the front of your thighs.\nLower until you feel a strong stretch in your hamstrings, keeping your back flat.\nDrive your hips forward to return to standing." },
  { id: "ex_kb_swing", name: "Kettlebell Swing", muscle: "Posterior", equipment: "Kettlebell", level: "Intermediate", type: "Cardio", videoThumb: "kb_swing", pattern: "hinge",
    instructions: "Stand with the kettlebell a foot in front of you, feet shoulder-width apart.\nHinge at the hips and hike the bell back between your legs.\nSnap your hips forward explosively to float the bell up to chest height.\nLet it swing back down and immediately load the next rep — power comes from the hips, not the arms." },
  { id: "ex_hip_thrust", name: "Barbell Hip Thrust", muscle: "Glutes", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "hip_thrust", pattern: "hinge",
    instructions: "Sit on the floor with your upper back against a bench and the bar over your hips.\nPlant your feet flat, shins vertical at the top.\nDrive through your heels and squeeze your glutes to lift your hips to full extension.\nPause at the top, then lower under control without resting on the floor." },
  { id: "ex_good_morning", name: "Good Morning", muscle: "Hamstrings", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "good_morning", pattern: "hinge",
    instructions: "Set the bar on your upper back as for a squat, feet hip-width apart.\nSoften your knees and brace your core.\nHinge at the hips, pushing them back as your torso lowers toward parallel.\nKeep your back flat throughout, then drive your hips forward to stand tall." },
  { id: "ex_back_extension", name: "Back Extension", muscle: "Lower back", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "back_extension", pattern: "hinge",
    instructions: "Set up in a back-extension bench with your hips on the pad and ankles secured.\nCross your arms over your chest and let your torso bend down toward the floor.\nSqueeze your glutes and hamstrings to raise your torso until it's in line with your legs.\nAvoid hyperextending — stop at a straight line and lower under control." },

  // ----- Push pattern (horizontal/chest) -----
  { id: "ex_bench_press", name: "Barbell Bench Press", muscle: "Chest", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "bench_press", pattern: "push",
    instructions: "Lie on the bench with your eyes under the bar and feet flat on the floor.\nGrip slightly wider than shoulder-width and unrack the bar over your chest.\nLower the bar to your mid-chest with elbows tucked to about 45 degrees.\nPress the bar back up over your shoulders until your arms lock out." },
  { id: "ex_incline_db_press", name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "incline_db_press", pattern: "push",
    instructions: "Set a bench to about a 30-degree incline and sit back with a dumbbell in each hand.\nStart with the dumbbells at the sides of your upper chest, elbows under your wrists.\nPress the weights up and slightly together until your arms are extended.\nLower under control back to the stretched position." },
  { id: "ex_pushup", name: "Push-Up", muscle: "Chest", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "pushup", pattern: "push",
    instructions: "Start in a plank with hands slightly wider than your shoulders.\nKeep your body in a straight line from head to heels, core braced.\nBend your elbows to lower your chest toward the floor.\nPress back up to full arm extension without letting your hips sag." },
  { id: "ex_chest_fly", name: "Cable Chest Fly", muscle: "Chest", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "chest_fly", pattern: "push",
    instructions: "Set both pulleys to chest height and grab a handle in each hand.\nStep forward into a staggered stance with a slight bend in your elbows.\nWith arms wide, sweep your hands together in front of your chest in a hugging arc.\nSqueeze your chest at the middle, then return slowly to the stretched position." },
  { id: "ex_dips", name: "Chest Dips", muscle: "Chest", equipment: "Bodyweight", level: "Intermediate", type: "Strength", videoThumb: "dips", pattern: "push",
    instructions: "Grip parallel bars and support yourself with arms locked out.\nLean your torso slightly forward to bias the chest.\nLower yourself by bending your elbows until your shoulders are just below your elbows.\nPress back up to the top under control." },
  { id: "ex_machine_chest_press", name: "Machine Chest Press", muscle: "Chest", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "machine_chest_press", pattern: "push",
    instructions: "Adjust the seat so the handles line up with your mid-chest.\nSit back against the pad and grip the handles.\nPress forward until your arms are nearly straight, keeping your shoulders down.\nReturn slowly until your hands are back at chest level." },

  // ----- Pull pattern (back/row) -----
  { id: "ex_pullup", name: "Pull-Up", muscle: "Back", equipment: "Bodyweight", level: "Intermediate", type: "Strength", videoThumb: "pullup", pattern: "pull",
    instructions: "Hang from a bar with an overhand grip slightly wider than shoulder-width.\nStart from a full hang with shoulders engaged, not loose.\nPull your elbows down and back to bring your chin over the bar.\nLower under control to a full hang on every rep." },
  { id: "ex_lat_pulldown", name: "Lat Pulldown", muscle: "Back", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "lat_pulldown", pattern: "pull",
    instructions: "Secure your thighs under the pad and grab the bar wider than shoulder-width.\nSit tall with a slight lean back and chest up.\nPull the bar down to your upper chest by driving your elbows down.\nControl the bar back up until your arms are fully extended." },
  { id: "ex_bent_row", name: "Barbell Bent-Over Row", muscle: "Back", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "bent_row", pattern: "pull",
    instructions: "Hold the bar with an overhand grip and hinge forward to about 45 degrees, back flat.\nLet the bar hang at arm's length below your chest.\nRow the bar to your lower ribcage by pulling your elbows back.\nSqueeze your shoulder blades, then lower under control." },
  { id: "ex_db_row", name: "One-Arm Dumbbell Row", muscle: "Back", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "db_row", pattern: "pull",
    instructions: "Place one knee and the same-side hand on a bench, back flat and parallel to the floor.\nHold a dumbbell in the free hand, arm hanging straight down.\nRow the dumbbell to your hip, keeping your elbow close to your body.\nLower under control to a full stretch and repeat." },
  { id: "ex_seated_cable_row", name: "Seated Cable Row", muscle: "Back", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "seated_cable_row", pattern: "pull",
    instructions: "Sit tall with your feet on the platform and a slight bend in your knees.\nGrab the handle and sit upright with your arms extended.\nPull the handle to your stomach, driving your elbows straight back.\nSqueeze your shoulder blades together, then extend your arms back out slowly." },
  { id: "ex_face_pull", name: "Face Pull", muscle: "Rear delts", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "face_pull", pattern: "pull",
    instructions: "Set a rope at upper-chest height and grab an end in each hand, thumbs back.\nStep back so there's tension and arms are extended.\nPull the rope toward your face, separating your hands as your elbows flare out and up.\nSqueeze your rear delts, then return slowly." },

  // ----- Press pattern (overhead/shoulders) -----
  { id: "ex_ohp", name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell", level: "Intermediate", type: "Strength", videoThumb: "ohp", pattern: "press",
    instructions: "Hold the bar at shoulder height with hands just outside shoulder-width, elbows under the bar.\nBrace your core and squeeze your glutes to protect your lower back.\nPress the bar straight overhead, moving your head back slightly to clear it.\nLock out with the bar over your mid-foot, then lower to your shoulders." },
  { id: "ex_db_shoulder_press", name: "Seated Dumbbell Shoulder Press", muscle: "Shoulders", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "db_shoulder_press", pattern: "press",
    instructions: "Sit on an upright bench with a dumbbell in each hand at shoulder height.\nKeep your wrists stacked over your elbows and core braced.\nPress the dumbbells overhead until your arms are extended.\nLower under control back to shoulder height." },
  { id: "ex_lateral_raise", name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "lateral_raise", pattern: "press",
    instructions: "Stand with a dumbbell in each hand at your sides, slight bend in the elbows.\nLead with your elbows and raise the dumbbells out to the sides.\nStop when your arms reach shoulder height, hands no higher than elbows.\nLower slowly back to your sides without swinging." },
  { id: "ex_arnold_press", name: "Arnold Press", muscle: "Shoulders", equipment: "Dumbbell", level: "Intermediate", type: "Strength", videoThumb: "arnold_press", pattern: "press",
    instructions: "Start seated with dumbbells in front of your shoulders, palms facing you.\nAs you press up, rotate your palms to face forward.\nFinish with arms extended overhead and palms forward.\nReverse the rotation as you lower back to the start." },
  { id: "ex_push_press", name: "Push Press", muscle: "Shoulders", equipment: "Barbell", level: "Advanced", type: "Strength", videoThumb: "push_press", pattern: "press",
    instructions: "Start with the bar racked on your shoulders, feet hip-width apart.\nDip a few inches by bending your knees, keeping your torso upright.\nDrive explosively through your legs and press the bar overhead.\nLock out overhead, then lower the bar back to your shoulders." },

  // ----- Lunge pattern -----
  { id: "ex_db_lunge", name: "Walking Dumbbell Lunge", muscle: "Glutes", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "db_lunge", pattern: "lunge",
    instructions: "Hold a dumbbell in each hand at your sides, standing tall.\nStep forward into a lunge, lowering until both knees reach about 90 degrees.\nDrive through your front heel to bring your back leg forward into the next step.\nKeep your torso upright and continue walking forward." },
  { id: "ex_bulgarian_split", name: "Bulgarian Split Squat", muscle: "Quads", equipment: "Dumbbell", level: "Intermediate", type: "Strength", videoThumb: "bulgarian_split", pattern: "lunge",
    instructions: "Place the top of one foot on a bench behind you, holding dumbbells at your sides.\nHop the front foot far enough forward that your knee stays over your ankle.\nLower straight down until your back knee nearly touches the floor.\nDrive through your front heel to stand back up." },
  { id: "ex_step_up", name: "Dumbbell Step-Up", muscle: "Glutes", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "step_up", pattern: "lunge",
    instructions: "Stand facing a box or bench, dumbbells at your sides.\nPlant your whole front foot on the box.\nDrive through that heel to stand fully on top, avoiding a push off the back foot.\nStep back down under control and repeat, alternating legs." },
  { id: "ex_reverse_lunge", name: "Reverse Lunge", muscle: "Glutes", equipment: "Bodyweight", level: "Beginner", type: "Strength", videoThumb: "reverse_lunge", pattern: "lunge",
    instructions: "Stand tall with feet hip-width apart.\nStep one foot back and lower until both knees reach 90 degrees.\nKeep your front shin vertical and torso upright.\nPush through your front heel to return to standing, then alternate legs." },

  // ----- Curl pattern (arms / isolation) -----
  { id: "ex_bicep_curl", name: "Dumbbell Bicep Curl", muscle: "Biceps", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "bicep_curl", pattern: "curl",
    instructions: "Stand with a dumbbell in each hand, arms at your sides and palms facing forward.\nKeep your elbows pinned to your sides.\nCurl the weights up toward your shoulders by flexing your biceps.\nLower slowly to full extension without swinging." },
  { id: "ex_hammer_curl", name: "Hammer Curl", muscle: "Biceps", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "hammer_curl", pattern: "curl",
    instructions: "Hold dumbbells at your sides with palms facing each other (neutral grip).\nKeep your elbows tight to your body.\nCurl the weights up while keeping your palms facing inward the whole time.\nLower under control back to your sides." },
  { id: "ex_barbell_curl", name: "Barbell Curl", muscle: "Biceps", equipment: "Barbell", level: "Beginner", type: "Strength", videoThumb: "barbell_curl", pattern: "curl",
    instructions: "Hold a barbell with a shoulder-width underhand grip, arms extended.\nKeep your elbows fixed at your sides and chest up.\nCurl the bar up toward your shoulders by flexing your biceps.\nLower the bar slowly to full extension." },
  { id: "ex_tricep_pushdown", name: "Tricep Pushdown", muscle: "Triceps", equipment: "Cable", level: "Beginner", type: "Strength", videoThumb: "tricep_pushdown", pattern: "curl",
    instructions: "Attach a bar or rope to a high pulley and grip it with elbows at your sides.\nKeep your upper arms locked against your torso.\nPush the attachment down until your arms are fully extended.\nSqueeze your triceps, then return slowly to the start." },
  { id: "ex_overhead_tri_ext", name: "Overhead Tricep Extension", muscle: "Triceps", equipment: "Dumbbell", level: "Beginner", type: "Strength", videoThumb: "overhead_tri_ext", pattern: "curl",
    instructions: "Hold one dumbbell overhead with both hands, arms extended.\nKeep your elbows pointed forward and close to your head.\nLower the weight behind your head by bending only at the elbows.\nExtend back to the top by squeezing your triceps." },
  { id: "ex_leg_curl", name: "Seated Leg Curl", muscle: "Hamstrings", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "leg_curl", pattern: "curl",
    instructions: "Sit in the machine with the pad above your ankles and thighs secured.\nKeep your back against the seat and hands on the handles.\nCurl your heels down and under by contracting your hamstrings.\nReturn slowly until your legs are nearly straight." },
  { id: "ex_leg_extension", name: "Leg Extension", muscle: "Quads", equipment: "Machine", level: "Beginner", type: "Strength", videoThumb: "leg_extension", pattern: "curl",
    instructions: "Sit with your shins behind the pad and knees aligned with the machine's pivot.\nHold the handles and sit back against the pad.\nExtend your knees to straighten your legs, squeezing your quads at the top.\nLower under control without letting the weight stack slam." },

  // ----- Core pattern -----
  { id: "ex_plank", name: "Plank", muscle: "Core", equipment: "Bodyweight", level: "Beginner", type: "Core", videoThumb: "plank", pattern: "core",
    instructions: "Set your forearms on the floor with elbows under your shoulders.\nExtend your legs back and rise onto your toes.\nSqueeze your glutes and brace your abs so your body forms a straight line.\nHold the position without letting your hips sag or pike up." },
  { id: "ex_crunch", name: "Crunch", muscle: "Core", equipment: "Bodyweight", level: "Beginner", type: "Core", videoThumb: "crunch", pattern: "core",
    instructions: "Lie on your back with knees bent and feet flat on the floor.\nPlace your hands lightly behind your head without pulling on your neck.\nCurl your shoulder blades off the floor by contracting your abs.\nLower slowly back down with control." },
  { id: "ex_hanging_leg_raise", name: "Hanging Leg Raise", muscle: "Core", equipment: "Bodyweight", level: "Intermediate", type: "Core", videoThumb: "hanging_leg_raise", pattern: "core",
    instructions: "Hang from a pull-up bar with an overhand grip, body still.\nWithout swinging, raise your legs by curling your pelvis up.\nLift until your thighs are at least parallel to the floor.\nLower slowly and avoid using momentum." },
  { id: "ex_russian_twist", name: "Russian Twist", muscle: "Obliques", equipment: "Bodyweight", level: "Beginner", type: "Core", videoThumb: "russian_twist", pattern: "core",
    instructions: "Sit on the floor with knees bent and lean back to about 45 degrees.\nClasp your hands together or hold a weight in front of your chest.\nRotate your torso to one side, then to the other, tapping near the floor.\nKeep your core braced and move under control." },
  { id: "ex_hollow_hold", name: "Hollow Body Hold", muscle: "Core", equipment: "Bodyweight", level: "Intermediate", type: "Core", videoThumb: "hollow_hold", pattern: "core",
    instructions: "Lie on your back and press your lower back flat into the floor.\nExtend your arms overhead and your legs out straight.\nLift your shoulders and legs a few inches off the floor into a shallow banana shape.\nHold while keeping your lower back glued down." },
  { id: "ex_cable_crunch", name: "Cable Crunch", muscle: "Core", equipment: "Cable", level: "Beginner", type: "Core", videoThumb: "cable_crunch", pattern: "core",
    instructions: "Kneel below a high pulley and hold a rope at the sides of your head.\nKeep your hips fixed and hinge only at the spine.\nCrunch down by contracting your abs, bringing your elbows toward your thighs.\nReturn slowly to the upright stretched position." },

  // ----- Cardio pattern -----
  { id: "ex_treadmill_intervals", name: "Treadmill Intervals", muscle: "Full body", equipment: "Cardio", level: "Beginner", type: "Cardio", videoThumb: "treadmill_intervals", pattern: "cardio",
    instructions: "Warm up with a few minutes of easy jogging.\nIncrease the speed (or incline) to a hard effort for the work interval.\nReturn to an easy walk or jog for the recovery interval.\nRepeat the work/recovery cycle for the prescribed number of rounds." },
  { id: "ex_rowing_erg", name: "Rowing Erg", muscle: "Full body", equipment: "Cardio", level: "Beginner", type: "Cardio", videoThumb: "rowing_erg", pattern: "cardio",
    instructions: "Strap in and start compressed at the catch with shins vertical.\nDrive with your legs first, then swing your torso back and finally pull the handle to your ribs.\nReverse the order on the recovery: arms, torso, then legs.\nKeep a smooth one-count drive and two-count recovery rhythm." },
  { id: "ex_burpee", name: "Burpee", muscle: "Full body", equipment: "Bodyweight", level: "Intermediate", type: "Cardio", videoThumb: "burpee", pattern: "cardio",
    instructions: "From standing, squat down and place your hands on the floor.\nKick your feet back into a plank and lower your chest to the floor.\nPress up and hop your feet back toward your hands.\nExplode up into a jump with hands overhead, then repeat." },
  { id: "ex_mountain_climber", name: "Mountain Climbers", muscle: "Full body", equipment: "Bodyweight", level: "Beginner", type: "Cardio", videoThumb: "mountain_climber", pattern: "cardio",
    instructions: "Start in a high plank with hands under your shoulders.\nKeep your hips level and core tight.\nDrive one knee toward your chest, then switch legs quickly.\nContinue alternating as fast as you can control." },
  { id: "ex_jump_rope", name: "Jump Rope", muscle: "Calves", equipment: "Cardio", level: "Beginner", type: "Cardio", videoThumb: "jump_rope", pattern: "cardio",
    instructions: "Hold the handles with your elbows close to your sides.\nTurn the rope using your wrists, not big arm circles.\nJump just an inch or two off the floor, landing softly on the balls of your feet.\nKeep a steady, relaxed rhythm." },
  { id: "ex_assault_bike", name: "Assault Bike Sprints", muscle: "Full body", equipment: "Cardio", level: "Intermediate", type: "Cardio", videoThumb: "assault_bike", pattern: "cardio",
    instructions: "Sit so your knees have a slight bend at the bottom of the pedal stroke.\nGrip the moving handles and push/pull with your arms while driving your legs.\nSprint at maximum effort for the work interval.\nPedal easy during the recovery, then repeat." },
  { id: "ex_box_jump", name: "Box Jump", muscle: "Quads", equipment: "Bodyweight", level: "Intermediate", type: "Cardio", videoThumb: "box_jump", pattern: "cardio",
    instructions: "Stand a foot away from a sturdy box, feet shoulder-width apart.\nDip into a quarter squat and swing your arms back.\nExplode up and forward, landing softly on top with both feet and knees bent.\nStand tall, then step (don't jump) back down to reset." },

  // ----- Mobility pattern -----
  { id: "ex_hip_flow", name: "Hip Mobility Flow", muscle: "Hips", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "hip_flow", pattern: "mobility",
    instructions: "Start in a deep lunge with both hands inside your front foot.\nGently rock your hips forward to open the front of your back hip.\nRotate your front knee out and in to mobilize the hip socket.\nMove slowly through the range and breathe; switch sides after the prescribed time." },
  { id: "ex_thoracic_stretch", name: "Thoracic Spine Stretch", muscle: "Upper back", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "thoracic_stretch", pattern: "mobility",
    instructions: "Kneel and rest your forearms on a bench or the floor.\nKeep your lower back flat and sink your chest toward the floor.\nReach one arm through and under, then rotate it up toward the ceiling.\nFollow your hand with your eyes and return slowly; alternate sides." },
  { id: "ex_foam_roll", name: "Foam Roll Quads", muscle: "Quads", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "foam_roll", pattern: "mobility",
    instructions: "Lie face down with a foam roller under the front of one thigh.\nSupport yourself on your forearms and keep your core engaged.\nRoll slowly from above the knee to the top of the thigh.\nPause and breathe on tender spots, then switch legs." },
  { id: "ex_world_greatest_stretch", name: "World's Greatest Stretch", muscle: "Full body", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "world_greatest_stretch", pattern: "mobility",
    instructions: "Step into a deep lunge and place both hands on the floor inside your front foot.\nDrop your back knee slightly and sink your hips to feel the stretch.\nRotate your inside arm up to the ceiling, opening your chest.\nReturn your hand down, push back to a hamstring stretch, then switch sides." },
  { id: "ex_cat_cow", name: "Cat-Cow Flow", muscle: "Spine", equipment: "Bodyweight", level: "Beginner", type: "Mobility", videoThumb: "cat_cow", pattern: "mobility",
    instructions: "Start on all fours with hands under shoulders and knees under hips.\nInhale as you drop your belly and lift your chest and tailbone (cow).\nExhale as you round your spine and tuck your chin and tailbone (cat).\nMove slowly with your breath through the full range." },
];

/* -------------------------------------------------------------------------- */
/*  Workouts — every exerciseId below references an id defined above.          */
/* -------------------------------------------------------------------------- */

export const seedWorkouts: Workout[] = [
  // ===== Full body / general fitness =====
  {
    id: "wk_full_body_a", name: "Full Body A", category: "Full Body", durationMin: 50, difficulty: "Beginner",
    format: "Standard",
    instructions: "Warm up for 5 minutes before you start.\nMove through each exercise in order, resting as prescribed between sets.\nFocus on controlled reps and full range of motion over heavy weight.",
    exercises: [
      { exerciseId: "ex_goblet_squat", name: "Goblet Squat", muscle: "Quads", notes: "Keep your chest tall and sit between your knees.", sets: [{ reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }, { reps: "10", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_bench_press", name: "Barbell Bench Press", muscle: "Chest", notes: "Tuck your elbows to about 45 degrees.", sets: [{ reps: "8", weight: "—", rest: "90s" }, { reps: "8", weight: "—", rest: "90s" }, { reps: "8", weight: "—", rest: "90s" }] },
      { exerciseId: "ex_db_row", name: "One-Arm Dumbbell Row", muscle: "Back", notes: "Pull to your hip, not your shoulder.", sets: [{ reps: "10", weight: "—", rest: "60s" }, { reps: "10", weight: "—", rest: "60s" }, { reps: "10", weight: "—", rest: "60s" }] },
      { exerciseId: "ex_plank", name: "Plank", muscle: "Core", notes: "Squeeze your glutes — no sagging hips.", sets: [{ reps: "30s", weight: "BW", rest: "45s" }, { reps: "30s", weight: "BW", rest: "45s" }] },
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
    format: "Interval workout",
    instructions: "Work hard for each 30-second interval, then rest 30 seconds.\nMove with intent but never sacrifice form for speed.\nIt's only 25 minutes — control every rep and push the pace.",
    exercises: [
      { exerciseId: "ex_burpee", name: "Burpee", muscle: "Full body", notes: "Chest to floor, then explode up.", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_jump_rope", name: "Jump Rope", muscle: "Calves", notes: "Small wrist turns, soft landings.", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_box_jump", name: "Box Jump", muscle: "Quads", notes: "Land soft, step back down to reset.", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
      { exerciseId: "ex_russian_twist", name: "Russian Twist", muscle: "Obliques", notes: "Rotate from your core, not your arms.", sets: [{ reps: "30s", weight: "BW", rest: "30s" }, { reps: "30s", weight: "BW", rest: "30s" }] },
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
    format: "Circuit",
    instructions: "Complete the exercises back-to-back as a circuit with minimal rest.\nKeep your abs braced and avoid using momentum on every movement.\nRest 60 seconds between rounds and repeat for the prescribed sets.",
    exercises: [
      { exerciseId: "ex_plank", name: "Plank", muscle: "Core", notes: "Pull your lower ribs toward your pelvis.", sets: [{ reps: "45s", weight: "BW", rest: "45s" }, { reps: "45s", weight: "BW", rest: "45s" }, { reps: "45s", weight: "BW", rest: "45s" }] },
      { exerciseId: "ex_crunch", name: "Crunch", muscle: "Core", notes: "Slow, controlled — squeeze at the top.", sets: [{ reps: "20", weight: "BW", rest: "45s" }, { reps: "20", weight: "BW", rest: "45s" }, { reps: "20", weight: "BW", rest: "45s" }] },
      { exerciseId: "ex_russian_twist", name: "Russian Twist", muscle: "Obliques", notes: "Keep your feet off the floor if you can.", sets: [{ reps: "20", weight: "BW", rest: "45s" }, { reps: "20", weight: "BW", rest: "45s" }] },
      { exerciseId: "ex_hanging_leg_raise", name: "Hanging Leg Raise", muscle: "Core", notes: "No swinging — curl your pelvis up.", sets: [{ reps: "12", weight: "BW", rest: "60s" }, { reps: "12", weight: "BW", rest: "60s" }] },
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
