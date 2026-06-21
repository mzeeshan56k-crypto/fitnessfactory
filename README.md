# Fitness Factory KC — Coaching Platform

A private coaching platform for a single gym, with real accounts and roles
(**Owner / Admin / Coach / Member**), server-side data, per-client program
assignment, and email invitations.

- **Owner/Coach** builds the library, adds clients, assigns programs/workouts/
  nutrition, tracks progress, and messages members.
- **Members** log in to see only what's assigned to them and log their training.
- **Owner/Admin** oversees every client (Coach app) and every login (Admin).

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Upstash KV, and an
`/api/ai` proxy for OpenAI / Claude / Gemini.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # then set AUTH_SECRET (see step 1 below)
npm run dev                     # http://localhost:3000
```

The first account you create becomes the **gym owner**. Locally, with no KV
configured, data is saved to a `.ffkc-dev-store.json` file so you can test the
full flow without any cloud setup.

---

## Environment variables — step by step

You need **3 required** variables to run in production, plus **2 optional** ones
to send invitation emails automatically. Add them in **Vercel → your project →
Settings → Environment Variables** (and to `.env.local` for local testing).

### 1. `AUTH_SECRET`  — *required*

Signs login sessions. Generate a random value:

```bash
openssl rand -base64 32
```

Copy the output and add it:

```
AUTH_SECRET=<the-generated-string>
```

### 2 & 3. `KV_REST_API_URL` and `KV_REST_API_TOKEN`  — *required in production*

These connect the app to its database (Upstash Redis, a.k.a. Vercel KV). Easiest
way on Vercel:

1. Open your project on Vercel → **Storage** tab → **Create Database**.
2. Choose **KV** (Upstash Redis) → give it a name → **Create**.
3. Click **Connect to Project** and select this project.
4. Vercel automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your
   environment — you don't need to paste them by hand.
5. **Redeploy** so the app picks them up.

> Prefer Upstash directly? Create a Redis database at
> [upstash.com](https://upstash.com), then add its REST URL/token as either the
> `KV_REST_API_URL` / `KV_REST_API_TOKEN` names above, or
> `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (both are supported).

### 4 & 5. `RESEND_API_KEY` and `INVITE_FROM_EMAIL`  — *optional (email invites)*

These let the app **email** invitation links automatically. Without them,
invitations still work — the app shows a **copyable link** you can send yourself.

1. Create a free account at [resend.com](https://resend.com).
2. **API Keys → Create API Key** → copy it:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   ```
3. (Recommended) In Resend, **add and verify your domain**, then set a sender
   address on that domain:
   ```
   INVITE_FROM_EMAIL=invites@yourgym.com
   ```
   If you skip this, the app falls back to Resend's shared `onboarding@resend.dev`
   sender, which is fine for testing.

### 6. `BLOB_READ_WRITE_TOKEN`  — *optional (progress photos)*

Stores progress-photo images. On Vercel: **Storage → Create → Blob**, connect it
to the project, and this variable is injected automatically. Without it, photos
still work (stored inline), but a Blob store is recommended for real image
hosting.

### Summary

| Variable | Required | Where it comes from |
|---|---|---|
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `KV_REST_API_URL` | ✅ (prod) | Vercel Storage → KV (auto-added) |
| `KV_REST_API_TOKEN` | ✅ (prod) | Vercel Storage → KV (auto-added) |
| `RESEND_API_KEY` | optional | resend.com → API Keys |
| `INVITE_FROM_EMAIL` | optional | a sender on your verified Resend domain |
| `BLOB_READ_WRITE_TOKEN` | optional | Vercel Storage → Blob (auto-added) |

---

## Deploy to Vercel

1. Push the repo to GitHub and **import** it at
   [vercel.com/new](https://vercel.com/new).
2. Add a **KV** database (steps 2–3 above) — this injects the KV variables.
3. Add `AUTH_SECRET` (and optionally `RESEND_API_KEY` / `INVITE_FROM_EMAIL`).
4. **Deploy**, open the site, and create the **owner** account.

---

## How it works

### Creating a client (and giving them a login)

1. **Coach app → Clients → Add client** — enter name + **email**, keep
   **“Invite to the app”** checked → **Add client**.
2. The client gets an email with a join link (or copy the link shown). Their
   account is linked to that exact client record.
3. They open the link, **set a password**, and land in their member portal.
4. The Clients list shows their status: **No login → Invited → Has login**.
   You can re-invite from the client’s profile any time.

> Invite **coaches/admins/staff** the same way from **Admin → Identity & Access**.

### Assigning training

Open a client → **Training** tab → assign a **Program**, a **Nutrition plan**,
and **add/remove workouts** from your library. The member sees only what’s
assigned.

### Owner oversight (Admin)

- **Coach app (`/dashboard`)** — see every client and drill into their progress,
  assignments, notes, check-ins and messages.
- **Admin → Identity & Access** — see **every login account**; invite, suspend,
  reactivate or remove anyone. Suspended users are locked out immediately.

Switch between the Coach app and Admin from the top-right menu (owner/admin only).

### AI Copilot

Optional. Each coach connects their own OpenAI / Claude / Gemini key in
**Settings → AI Copilot**; it powers the “Ask AI” assistant, meal-plan and
form-check generation. Nothing AI-related runs until a key is added.

---

For a deeper feature/architecture rundown see **[HANDOVER.md](./HANDOVER.md)**.
