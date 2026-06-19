// Extended data layer for the deeper FFKC feature set:
// Super Admin, Traffic-Light auditing, Kanban, AI Co-Pilot, biometrics,
// resource library, automation, billing tiers and security.

/* ----------------------------- Compliance ----------------------------- */

export type Light = "green" | "yellow" | "red";

export interface ComplianceRow {
  clientId: string;
  workout: number;
  diet: number;
  habits: number;
  trend: "up" | "down" | "flat";
  light: Light;
  note: string;
}

export const complianceRates = { workout: 88, diet: 81, habits: 76 };

export const complianceRows: ComplianceRow[] = [
  { clientId: "c1", workout: 94, diet: 90, habits: 88, trend: "up", light: "green", note: "Crushing it — consider progressing load." },
  { clientId: "c2", workout: 88, diet: 72, habits: 80, trend: "up", light: "green", note: "Strong adherence, diet logging slipping midweek." },
  { clientId: "c3", workout: 91, diet: 84, habits: 70, trend: "flat", light: "yellow", note: "Habit streaks dropping — nudge on sleep." },
  { clientId: "c4", workout: 12, diet: 0, habits: 5, trend: "down", light: "red", note: "Never completed onboarding workout." },
  { clientId: "c5", workout: 96, diet: 93, habits: 95, trend: "up", light: "green", note: "Model client. Request a testimonial." },
  { clientId: "c6", workout: 41, diet: 38, habits: 30, trend: "down", light: "red", note: "Inactive 3 weeks — schedule a re-engagement call." },
  { clientId: "c7", workout: 90, diet: 66, habits: 72, trend: "down", light: "yellow", note: "Training great, nutrition off-plan on weekends." },
  { clientId: "c8", workout: 79, diet: 70, habits: 64, trend: "flat", light: "yellow", note: "Plateauing — review program variables." },
];

/* ------------------------------- Kanban ------------------------------- */

export interface KanbanCard {
  id: string;
  title: string;
  clientId?: string;
  tag: string;
  due: string;
}
export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export const kanbanColumns: KanbanColumn[] = [
  {
    id: "onboarding", title: "Onboarding queue",
    cards: [
      { id: "k1", title: "Welcome call + intake form", clientId: "c4", tag: "New", due: "Today" },
      { id: "k2", title: "Build starter program", clientId: "c4", tag: "Program", due: "Tomorrow" },
    ],
  },
  {
    id: "formcheck", title: "Form check reviews",
    cards: [
      { id: "k3", title: "Squat depth review", clientId: "c1", tag: "Video", due: "Today" },
      { id: "k4", title: "Deadlift setup feedback", clientId: "c7", tag: "Video", due: "Today" },
      { id: "k5", title: "Bench arch check", clientId: "c8", tag: "Video", due: "Wed" },
    ],
  },
  {
    id: "support", title: "Support inquiries",
    cards: [
      { id: "k6", title: "Macro questions — vacation week", clientId: "c2", tag: "Nutrition", due: "Today" },
      { id: "k7", title: "Reschedule Thursday session", clientId: "c5", tag: "Schedule", due: "Tomorrow" },
    ],
  },
  {
    id: "done", title: "Completed",
    cards: [
      { id: "k8", title: "Monthly check-in: Maya", clientId: "c1", tag: "Review", due: "Done" },
    ],
  },
];

/* ----------------------------- AI Co-Pilot ---------------------------- */

export interface AISuggestion {
  id: string;
  clientId: string;
  type: "Program" | "Nutrition" | "Recovery" | "Message";
  title: string;
  rationale: string;
  draft: string;
  confidence: number;
  status: "pending" | "approved" | "dismissed";
}

export const aiSuggestions: AISuggestion[] = [
  {
    id: "s1", clientId: "c1", type: "Program",
    title: "Progress bench press +5 lb",
    rationale: "Logged RPE ≤ 7 on all top sets for 2 weeks with full rep completion.",
    draft: "Increase Bench Press working weight from 155 → 160 lb. Keep 3×6 @ RPE 8 target.",
    confidence: 92, status: "pending",
  },
  {
    id: "s2", clientId: "c7", type: "Nutrition",
    title: "Adjust weekend macro split",
    rationale: "Diet compliance drops to 48% on Sat/Sun vs 90% weekdays.",
    draft: "Introduce a flexible weekend template: +30g carbs, refeed structure to improve adherence.",
    confidence: 84, status: "pending",
  },
  {
    id: "s3", clientId: "c6", type: "Message",
    title: "Re-engagement outreach",
    rationale: "No activity in 21 days, habit streak broken, at-risk (red) flag.",
    draft: "Hey Noah — missed seeing you this month! Let's hop on a quick 15-min call to reset your plan. What day works?",
    confidence: 88, status: "pending",
  },
  {
    id: "s4", clientId: "c3", type: "Recovery",
    title: "Insert deload week",
    rationale: "Sleep quality down 18% and reported RPE rising on steady-state runs.",
    draft: "Schedule a deload: reduce running volume 40% next week, add 2 mobility sessions.",
    confidence: 79, status: "pending",
  },
];

/* ------------------------- Biometrics & Labs -------------------------- */

export interface SleepNight {
  day: string;
  rem: number;
  deep: number;
  light: number;
  awake: number;
}
export const sleepData: SleepNight[] = [
  { day: "Mon", rem: 1.6, deep: 1.4, light: 4.2, awake: 0.4 },
  { day: "Tue", rem: 1.8, deep: 1.6, light: 4.0, awake: 0.3 },
  { day: "Wed", rem: 1.4, deep: 1.1, light: 3.8, awake: 0.6 },
  { day: "Thu", rem: 2.0, deep: 1.7, light: 4.1, awake: 0.2 },
  { day: "Fri", rem: 1.7, deep: 1.3, light: 3.6, awake: 0.5 },
  { day: "Sat", rem: 2.1, deep: 1.8, light: 4.4, awake: 0.3 },
  { day: "Sun", rem: 1.9, deep: 1.5, light: 4.3, awake: 0.4 },
];

// Recovery / volume heatmap — muscle groups x last 7 days (0-4 intensity)
export const recoveryMuscles = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];
export const recoveryHeatmap: number[][] = [
  [4, 1, 0, 2, 0, 3, 1],
  [0, 3, 1, 0, 4, 1, 2],
  [2, 0, 4, 1, 0, 3, 0],
  [3, 1, 0, 4, 1, 0, 2],
  [1, 4, 1, 0, 3, 1, 0],
  [2, 2, 2, 1, 2, 2, 3],
];

export interface LabMarker {
  name: string;
  value: string;
  range: string;
  status: "optimal" | "normal" | "watch";
}
export const bloodwork: LabMarker[] = [
  { name: "Total Testosterone", value: "612 ng/dL", range: "300–900", status: "optimal" },
  { name: "Vitamin D", value: "28 ng/mL", range: "30–80", status: "watch" },
  { name: "HbA1c", value: "5.1 %", range: "<5.7", status: "optimal" },
  { name: "LDL Cholesterol", value: "118 mg/dL", range: "<130", status: "normal" },
  { name: "hs-CRP", value: "0.8 mg/L", range: "<1.0", status: "optimal" },
  { name: "Ferritin", value: "210 ng/mL", range: "30–400", status: "normal" },
];

/* --------------------------- Resource library ------------------------- */

export interface Course {
  id: string;
  title: string;
  lessons: number;
  durationMin: number;
  progress: number;
  category: string;
  color: string;
}
export const courses: Course[] = [
  { id: "co1", title: "Foundations of Strength Training", lessons: 12, durationMin: 145, progress: 75, category: "Training", color: "from-brand-500 to-brand-700" },
  { id: "co2", title: "Nutrition for Body Recomposition", lessons: 9, durationMin: 98, progress: 40, category: "Nutrition", color: "from-accent-400 to-accent-600" },
  { id: "co3", title: "Mobility & Injury Prevention", lessons: 8, durationMin: 76, progress: 100, category: "Recovery", color: "from-purple-500 to-indigo-600" },
  { id: "co4", title: "Mindset & Habit Mastery", lessons: 10, durationMin: 112, progress: 20, category: "Lifestyle", color: "from-amber-400 to-orange-500" },
];

export interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  type: "Video" | "Article" | "Quiz";
  video?: string; // YouTube/Vimeo or direct file URL
}
// Lessons keyed by course id. Video lessons use embeddable YouTube sources.
export const courseLessons: Record<string, Lesson[]> = {
  co1: [
    { id: "l1", title: "Welcome & training principles", durationMin: 8, type: "Video", video: "https://www.youtube.com/watch?v=Kvy_-Ah_y4Q" },
    { id: "l2", title: "Mastering the squat", durationMin: 14, type: "Video", video: "https://www.youtube.com/watch?v=ultWZbUMPL8" },
    { id: "l3", title: "Hinge patterns & deadlifts", durationMin: 16, type: "Video", video: "https://www.youtube.com/watch?v=op9kVnSso6Q" },
    { id: "l4", title: "Progressive overload explained", durationMin: 11, type: "Article" },
    { id: "l5", title: "Building your first split", durationMin: 18, type: "Video", video: "https://www.youtube.com/watch?v=eMjyvIQbn9M" },
    { id: "l6", title: "Knowledge check", durationMin: 5, type: "Quiz" },
  ],
  co2: [
    { id: "l1", title: "Energy balance basics", durationMin: 10, type: "Video", video: "https://www.youtube.com/watch?v=vtWp45Negac" },
    { id: "l2", title: "Setting macro targets", durationMin: 13, type: "Video", video: "https://www.youtube.com/watch?v=lcVgddoLrS8" },
    { id: "l3", title: "Meal timing myths", durationMin: 9, type: "Article" },
    { id: "l4", title: "Flexible dieting in practice", durationMin: 15, type: "Video", video: "https://www.youtube.com/watch?v=AdqrTg_hpEQ" },
  ],
  co3: [
    { id: "l1", title: "Mobility vs flexibility", durationMin: 7, type: "Video", video: "https://www.youtube.com/watch?v=dHA1lkgrhSY" },
    { id: "l2", title: "Daily hip routine", durationMin: 12, type: "Video", video: "https://www.youtube.com/watch?v=Wp4BlxcFTkE" },
    { id: "l3", title: "Shoulder health", durationMin: 10, type: "Video", video: "https://www.youtube.com/watch?v=3VL9o8hEzBc" },
  ],
  co4: [
    { id: "l1", title: "The habit loop", durationMin: 9, type: "Video", video: "https://www.youtube.com/watch?v=OMbsGBlpP30" },
    { id: "l2", title: "Identity-based habits", durationMin: 11, type: "Article" },
    { id: "l3", title: "Beating motivation dips", durationMin: 14, type: "Video", video: "https://www.youtube.com/watch?v=H14bBuluwB8" },
  ],
};

/* ----------------------- Challenges & leaderboard --------------------- */

export interface Challenge {
  id: string;
  name: string;
  desc: string;
  metric: string;
  daysLeft: number;
  participants: number;
  joined: boolean;
  color: string;
}
export const challenges: Challenge[] = [
  { id: "ch1", name: "30-Day Step Streak", desc: "Hit 10,000 steps every day for 30 days.", metric: "Steps", daysLeft: 12, participants: 184, joined: true, color: "from-brand-500 to-brand-700" },
  { id: "ch2", name: "Summer Shred", desc: "Log 20 workouts this month.", metric: "Workouts", daysLeft: 18, participants: 312, joined: false, color: "from-accent-400 to-accent-600" },
  { id: "ch3", name: "Hydration Hero", desc: "Drink 3L of water daily for 2 weeks.", metric: "Hydration", daysLeft: 6, participants: 97, joined: false, color: "from-teal-500 to-emerald-600" },
];

export interface LeaderRow {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  you?: boolean;
}
export const leaderboard: LeaderRow[] = [
  { rank: 1, name: "Emma Wilson", avatar: "EW", points: 2840 },
  { rank: 2, name: "Maya Chen", avatar: "MC", points: 2710, you: true },
  { rank: 3, name: "Ava Thompson", avatar: "AT", points: 2655 },
  { rank: 4, name: "Sofia Reyes", avatar: "SR", points: 2480 },
  { rank: 5, name: "James Okafor", avatar: "JO", points: 2390 },
  { rank: 6, name: "Daniel Garcia", avatar: "DG", points: 2105 },
];

/* --------------------------- Check-in form ---------------------------- */

export interface CheckinQuestion {
  id: string;
  label: string;
  type: "scale" | "number" | "text";
  unit?: string;
}
export const checkinQuestions: CheckinQuestion[] = [
  { id: "weight", label: "Current body weight", type: "number", unit: "lb" },
  { id: "energy", label: "Energy levels this week", type: "scale" },
  { id: "sleep", label: "Sleep quality", type: "scale" },
  { id: "hunger", label: "Hunger / cravings", type: "scale" },
  { id: "adherence", label: "Plan adherence", type: "scale" },
  { id: "notes", label: "Anything you want your coach to know?", type: "text" },
];

export interface MediaItem {
  id: string;
  title: string;
  type: "Form check" | "Masterclass";
  date: string;
  status: "Reviewed" | "Pending";
}
export const mediaVault: MediaItem[] = [
  { id: "mv1", title: "Back squat — set 3", type: "Form check", date: "Jun 15", status: "Reviewed" },
  { id: "mv2", title: "Conventional deadlift", type: "Form check", date: "Jun 14", status: "Pending" },
  { id: "mv3", title: "Overhead press warmup", type: "Form check", date: "Jun 12", status: "Reviewed" },
];

/* ----------------------------- Scheduling ----------------------------- */

export const availability = [
  { day: "Monday", enabled: true, start: "07:00", end: "18:00" },
  { day: "Tuesday", enabled: true, start: "07:00", end: "18:00" },
  { day: "Wednesday", enabled: true, start: "09:00", end: "15:00" },
  { day: "Thursday", enabled: true, start: "07:00", end: "18:00" },
  { day: "Friday", enabled: true, start: "07:00", end: "14:00" },
  { day: "Saturday", enabled: false, start: "08:00", end: "12:00" },
  { day: "Sunday", enabled: false, start: "08:00", end: "12:00" },
];

export interface BookingSlot {
  id: string;
  day: string;
  time: string;
  type: string;
  open: boolean;
}
export const bookingSlots: BookingSlot[] = [
  { id: "b1", day: "Mon Jun 22", time: "08:00", type: "1:1 Coaching", open: true },
  { id: "b2", day: "Mon Jun 22", time: "10:30", type: "1:1 Coaching", open: true },
  { id: "b3", day: "Tue Jun 23", time: "17:00", type: "1:1 Coaching", open: true },
  { id: "b4", day: "Wed Jun 24", time: "07:00", type: "Group HIIT", open: true },
  { id: "b5", day: "Thu Jun 25", time: "18:00", type: "1:1 Coaching", open: false },
  { id: "b6", day: "Fri Jun 26", time: "07:30", type: "Group Mobility", open: true },
];

export const bookingRequests = [
  { id: "br1", clientId: "c2", slot: "Tue Jun 23 · 17:00", type: "1:1 Coaching", status: "pending" },
  { id: "br2", clientId: "c5", slot: "Wed Jun 24 · 07:00", type: "Group HIIT", status: "pending" },
];

/* ------------------------- Super Admin domain ------------------------- */

export interface TrainerRow {
  id: string;
  name: string;
  avatar: string;
  clients: number;
  status: "active" | "trial" | "suspended";
  tier: "Basic" | "Pro" | "Elite";
  mrr: number;
  rating: number;
}
export const trainers: TrainerRow[] = [
  { id: "t1", name: "Alex Coach", avatar: "AC", clients: 42, status: "active", tier: "Pro", mrr: 8450, rating: 4.9 },
  { id: "t2", name: "Jordan Blake", avatar: "JB", clients: 88, status: "active", tier: "Elite", mrr: 14200, rating: 4.8 },
  { id: "t3", name: "Priya Nair", avatar: "PN", clients: 31, status: "active", tier: "Pro", mrr: 6100, rating: 5.0 },
  { id: "t4", name: "Marcus Lee", avatar: "ML", clients: 12, status: "trial", tier: "Basic", mrr: 0, rating: 4.6 },
  { id: "t5", name: "Sara Demir", avatar: "SD", clients: 64, status: "active", tier: "Elite", mrr: 11800, rating: 4.9 },
  { id: "t6", name: "Tom Fisher", avatar: "TF", clients: 5, status: "suspended", tier: "Basic", mrr: 0, rating: 3.9 },
];

export interface PlatformUser {
  id: string;
  name: string;
  avatar: string;
  role: "Client" | "Coach" | "Staff" | "Admin";
  email: string;
  status: "active" | "suspended" | "invited";
  mfa: boolean;
}
export const platformUsers: PlatformUser[] = [
  { id: "u1", name: "Alex Coach", avatar: "AC", role: "Coach", email: "alex@ffkc.app", status: "active", mfa: true },
  { id: "u2", name: "Jordan Blake", avatar: "JB", role: "Coach", email: "jordan@ffkc.app", status: "active", mfa: true },
  { id: "u3", name: "Maya Chen", avatar: "MC", role: "Client", email: "maya@email.com", status: "active", mfa: false },
  { id: "u4", name: "Riley Ops", avatar: "RO", role: "Staff", email: "riley@ffkc.app", status: "active", mfa: true },
  { id: "u5", name: "James Okafor", avatar: "JO", role: "Client", email: "james@email.com", status: "active", mfa: false },
  { id: "u6", name: "Tom Fisher", avatar: "TF", role: "Coach", email: "tom@ffkc.app", status: "suspended", mfa: false },
  { id: "u7", name: "Dana Root", avatar: "DR", role: "Admin", email: "dana@ffkc.app", status: "active", mfa: true },
  { id: "u8", name: "New Invitee", avatar: "NI", role: "Staff", email: "pending@ffkc.app", status: "invited", mfa: false },
];

export const rolePermissions = [
  { role: "Client", perms: ["View own plan", "Log workouts & meals", "Message coach", "Book sessions"] },
  { role: "Coach", perms: ["Manage own clients", "Build programs", "View revenue", "Approve AI drafts"] },
  { role: "Staff", perms: ["Handle support queue", "View schedules", "Limited client access"] },
  { role: "Admin", perms: ["Full platform access", "Billing & IAM", "Security controls", "Broadcasts"] },
];

export interface BillingTier {
  name: "Basic" | "Pro" | "Elite";
  price: number;
  subscribers: number;
  features: string[];
  color: string;
}
export const billingTiers: BillingTier[] = [
  { name: "Basic", price: 19, subscribers: 1240, color: "from-ink-500 to-ink-700", features: ["Up to 5 clients", "Core builder", "Messaging"] },
  { name: "Pro", price: 49, subscribers: 3110, color: "from-brand-500 to-brand-700", features: ["Up to 50 clients", "AI Co-Pilot", "Payments", "Scheduling"] },
  { name: "Elite", price: 129, subscribers: 720, color: "from-accent-500 to-accent-700", features: ["Unlimited", "Branded app", "Team seats", "Priority support"] },
];

export const adminKpis = {
  trainers: 5070,
  clients: 184320,
  mrr: 412800,
  workoutsToday: 28940,
};

export const enrollmentTrend = [
  { month: "Jan", trainers: 3800, clients: 142000 },
  { month: "Feb", trainers: 4100, clients: 151000 },
  { month: "Mar", trainers: 4350, clients: 160500 },
  { month: "Apr", trainers: 4620, clients: 168900 },
  { month: "May", trainers: 4850, clients: 177200 },
  { month: "Jun", trainers: 5070, clients: 184320 },
];

/* --------------------------- Communications --------------------------- */

export const broadcasts = [
  { id: "bc1", title: "New AI meal generator is live 🎉", audience: "All trainers", sent: "2 days ago", reach: "5,070" },
  { id: "bc2", title: "Scheduled maintenance Sunday 2am UTC", audience: "All users", sent: "1 week ago", reach: "189,390" },
  { id: "bc3", title: "Summer transformation challenge", audience: "All clients", sent: "2 weeks ago", reach: "184,320" },
];

/* ---------------------------- Automation ------------------------------ */

export interface DripStep {
  day: number;
  channel: "Email" | "Push" | "SMS" | "In-app";
  title: string;
}
export interface DripCampaign {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "paused" | "draft";
  enrolled: number;
  steps: DripStep[];
}
export const dripCampaigns: DripCampaign[] = [
  {
    id: "d1", name: "New client welcome", trigger: "On purchase", status: "active", enrolled: 1820,
    steps: [
      { day: 0, channel: "Email", title: "Welcome + app download" },
      { day: 1, channel: "Push", title: "Complete your intake form" },
      { day: 3, channel: "In-app", title: "Your first workout is ready" },
      { day: 7, channel: "Email", title: "Week 1 check-in survey" },
    ],
  },
  {
    id: "d2", name: "Win-back lapsed", trigger: "14 days inactive", status: "active", enrolled: 540,
    steps: [
      { day: 0, channel: "Push", title: "We miss you 👋" },
      { day: 2, channel: "Email", title: "Here's what's new" },
      { day: 5, channel: "SMS", title: "50% off next month" },
    ],
  },
  {
    id: "d3", name: "Upsell to Elite", trigger: "Pro for 90 days", status: "paused", enrolled: 210,
    steps: [
      { day: 0, channel: "In-app", title: "Unlock the branded app" },
      { day: 3, channel: "Email", title: "Elite success stories" },
    ],
  },
];

export const integrations = [
  { id: "i1", name: "GoHighLevel", desc: "CRM & funnel sync", status: "connected", color: "bg-blue-500" },
  { id: "i2", name: "Trainerize", desc: "Migrate clients & programs", status: "connected", color: "bg-purple-500" },
  { id: "i3", name: "Zapier", desc: "5,000+ app automations", status: "connected", color: "bg-orange-500" },
  { id: "i4", name: "Stripe", desc: "Payments & billing", status: "connected", color: "bg-indigo-500" },
  { id: "i5", name: "Google Calendar", desc: "Two-way schedule sync", status: "available", color: "bg-emerald-500" },
  { id: "i6", name: "Apple Health", desc: "Steps, sleep, heart rate", status: "available", color: "bg-rose-500" },
];

/* ----------------------------- Security ------------------------------- */

export const securityControls = [
  { id: "sec1", name: "Multi-Factor Authentication (MFA)", desc: "Require a second factor for all staff & coach logins.", on: true },
  { id: "sec2", name: "End-to-end encryption", desc: "Encrypt health metrics & PII at rest and in transit.", on: true },
  { id: "sec3", name: "Zero-knowledge storage locks", desc: "Sensitive biometric data sealed with client-held keys.", on: true },
  { id: "sec4", name: "PII compliance filter", desc: "Strip sensitive fields before any external AI/API call.", on: true },
  { id: "sec5", name: "Session IP allow-listing", desc: "Restrict admin sessions to approved networks.", on: false },
];

export const auditLog = [
  { id: "al1", actor: "dana@ffkc.app", action: "Suspended coach account", target: "tom@ffkc.app", time: "10:42 AM" },
  { id: "al2", actor: "system", action: "PII filter stripped 3 fields before AI call", target: "ai-copilot", time: "10:31 AM" },
  { id: "al3", actor: "alex@ffkc.app", action: "Enabled MFA", target: "self", time: "9:58 AM" },
  { id: "al4", actor: "system", action: "Encrypted biometric upload", target: "c5/bloodwork", time: "9:40 AM" },
];

export const lightStyles: Record<Light, { dot: string; badge: string; label: string }> = {
  green: { dot: "bg-accent-500", badge: "bg-accent-500/15 text-accent-400", label: "On track" },
  yellow: { dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-400", label: "Watch" },
  red: { dot: "bg-rose-500", badge: "bg-rose-500/15 text-rose-400", label: "At risk" },
};
