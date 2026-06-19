# Fitness Factory KC — Coaching Platform

A private, **login-first** coaching SaaS for a single gym. No public marketing
site: visitors land on a sign-in screen and enter the **Coach**, **Member** or
**Admin** portal.

```bash
npm install
npm run dev     # http://localhost:3000 → /login  (any email/password; pick a role)
```

- **Build:** `npm run build && npm start`
- **Deploy:** import the repo at [vercel.com/new](https://vercel.com/new) → Deploy (zero config)

Full feature list, sign-in notes, the production roadmap, and **how to publish
this as a fresh standalone GitHub repo** are in **[HANDOVER.md](./HANDOVER.md)**.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts and an
`/api/ai` proxy for OpenAI / Claude / Gemini.
