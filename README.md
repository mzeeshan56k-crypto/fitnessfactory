# Fitness Factory KC — Coaching Platform

A private, **login-first** coaching platform for a single gym. Real accounts and
roles (**Owner / Admin / Coach / Member**), server-side data, and email
invitations. Visitors land on a sign-in screen and enter the portal their role
allows.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in AUTH_SECRET (see below)
npm run dev                  # http://localhost:3000 → /login
```

The **first account you create becomes the gym owner**. Everyone else joins by
invitation (Admin → Identity & Access → Invite user). Locally, with no KV set,
data is stored in a `.ffkc-dev-store.json` file so you can test the full flow.

- **Build:** `npm run build && npm start`

## Deploy to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. In the project **Storage** tab, create a **KV (Upstash Redis)** database —
   Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. Add the remaining environment variables (see below) and **Deploy**.
4. Open the site and create the owner account.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | ✅ | Signs login sessions. Generate: `openssl rand -base64 32` |
| `KV_REST_API_URL` | ✅ (prod) | Data storage (Vercel KV / Upstash) |
| `KV_REST_API_TOKEN` | ✅ (prod) | Data storage token |
| `RESEND_API_KEY` | optional | Sends invitation emails ([resend.com](https://resend.com)) |
| `INVITE_FROM_EMAIL` | optional | From-address for invitations |

Without `RESEND_API_KEY`, invitations still work — the admin is given a
shareable join link to send manually.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Upstash
KV, and an `/api/ai` proxy for OpenAI / Claude / Gemini.
