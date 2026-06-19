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

Authentication is real. The **first account created becomes the gym owner**
(the login screen shows a one-time setup form). Everyone else joins by
invitation — Admin → Identity & Access → **Invite user**, which emails a join
link (or gives you a shareable link to send). Roles: **Owner / Admin / Coach /
Member**, each scoped to the portals they're allowed to use.

Passwords are hashed (bcrypt) and sessions are signed JWT cookies. Set
`AUTH_SECRET` and a KV store before going live (see §4).

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

All data is stored server-side in KV (Upstash Redis), shared across devices and
scoped by role — members only ever receive their own data.

---

## 4. Deploy to Vercel

1. Push this repo to GitHub (see §6 to publish as a fresh standalone repo).
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. In the project **Storage** tab, create a **KV (Upstash Redis)** database —
   `KV_REST_API_URL` and `KV_REST_API_TOKEN` are injected automatically.
4. Add environment variables, then **Deploy**:

   | Variable | Required | Purpose |
   |---|---|---|
   | `AUTH_SECRET` | ✅ | Signs sessions — `openssl rand -base64 32` |
   | `KV_REST_API_URL` / `KV_REST_API_TOKEN` | ✅ | Data storage (auto-set by Vercel KV) |
   | `RESEND_API_KEY` | optional | Sends invite emails ([resend.com](https://resend.com)) |
   | `INVITE_FROM_EMAIL` | optional | From-address for invites |

5. Open the site and create the owner account.

---

## 5. What's live vs. next

**Live now:** real auth + roles (`src/lib/auth`, `src/middleware.ts`),
server-side persistence in KV (`src/app/api/workspace`), role-scoped data for
members, email invitations (`src/app/api/invite`, Resend), and the AI Copilot
proxy (bring-your-own provider key).

**Next steps:**

1. **File storage** — S3 / Vercel Blob for progress photos & form-check videos
   (currently stored inline).
2. **Payments** — Stripe for member billing.
3. **Per-feature history** — form-check reviews and photo annotations are still
   saved per-browser; move them into the workspace for cross-device sync.
4. **Password reset** — add an email-based reset flow.

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
