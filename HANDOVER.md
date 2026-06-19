# Fitness Factory KC — Coaching Platform (Handover)

A private, **login-first** coaching SaaS for a single gym. No public marketing
site — visitors land on a sign-in screen and enter one of three portals:

| Portal | Path | For |
|---|---|---|
| **Coach** | `/dashboard` | Gym owner / trainers |
| **Member** | `/client` | Gym clients |
| **Admin** | `/admin` | Gym & platform settings |

`/` redirects straight to `/login`.

---

## 1. Run locally

```bash
npm install
npm run dev          # http://localhost:3000  → redirects to /login
```

Production build:

```bash
npm run build && npm start
```

Requires Node 18.18+ (Node 20+ recommended). No env vars needed to run the demo.

---

## 2. Sign in

The demo has no backend auth yet, so **any email/password works** — pick a role
(Coach / Member / Admin) on the login screen and you're in. Wiring real
authentication is the first production step (see §5).

---

## 3. Feature summary

- **Coach:** client CRM, program & workout builder, 58-exercise library with
  animated demos, nutrition plans, calendar, kanban workflow, form builder,
  **Form Check** (AI faults + muscle-weakness summary), **Recovery planner**
  (off-day suggestions), **Strength progression** explorer, auto-update toggles,
  messaging, announcements, team management, settings.
- **Member:** today dashboard, workout player (RPE/RIR, rest timer, animated
  demos), nutrition diary (AI meal generator seeded from client data, macro
  tabs, recipes, supplements), progress + **side-by-side photo compare**,
  biometrics, **recovery & rest-day suggestions**, challenges, achievements,
  community feed, check-ins, course library, coach chat.
- **Admin:** platform dashboard, IAM, billing tiers, communications, automation,
  global library, security.
- **AI Copilot:** "Ask AI" (⌘K) in every top bar + Settings → AI Copilot to
  connect **OpenAI / Claude / Gemini** with your own key.
- **Pre-built content:** Settings → Data → **Load starter content** populates the
  exercise library, 20 workouts, 5 programs and 5 forms. **Load example data**
  fills everything with demo clients.

Data persists per browser via `localStorage` (no database yet).

---

## 4. Deploy to Vercel

1. Push this repo to GitHub (see §6 to publish as a fresh standalone repo).
2. [vercel.com/new](https://vercel.com/new) → import the repo → **Deploy**
   (Next.js auto-detected, zero config). No env vars required.

---

## 5. Production roadmap

1. **Auth & roles** — NextAuth/Clerk/Supabase so Coach/Member/Admin are real
   accounts; protect `/dashboard`, `/client`, `/admin`.
2. **Database** — Postgres/Supabase; the typed shapes in `src/lib/store.tsx`
   map directly to your schema.
3. **File storage** — S3 / Supabase Storage for photos & form-check videos.
4. **Payments** — Stripe for member billing.
5. **AI** — already provider-ready; just supply keys server-side per tenant.

---

## 6. Publish as a new standalone GitHub repo

This project is self-contained. To carry it to its own repo with fresh history:

```bash
# from a clean copy of this project (no node_modules / .next / .git)
rm -rf node_modules .next .git
git init && git add -A
git commit -m "Fitness Factory KC coaching platform"
git branch -M main
git remote add origin https://github.com/<you>/<new-repo>.git
git push -u origin main
```

---

## 7. Tech

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts · lucide-react.
`/api/ai` is an edge route proxying OpenAI/Anthropic/Gemini.

```
src/
  app/        login, dashboard (coach), client (member), admin, api/ai
  components/ dashboard/ client/ admin/ ui/
  lib/        store.tsx (state+persistence), seed-content.ts, ai.ts, data.ts…
```
