Update File: README.md
IRL Challenges
Location-based gaming platform to create, join, and complete real-world challenges at verified venues. Mobile-first PWA. Real-time chat. Mutual result confirmation. Admin dashboard.
Quick start
# 1) Install
npm install

# 2) Configure env
cp .env.example .env   # then edit values

# 3) Migrate DB (Drizzle -> Postgres/Supabase)
npm run db:generate
npm run db:push

# 4) Dev
npm run dev            # runs server and client in watch mode

# 5) Build and start
npm run build
npm start
Tech stack
Client: React + TypeScript, Vite, Tailwind, shadcn/ui, Wouter, React Query
Server: Node.js, Express, WebSockets, pino
Data: Drizzle ORM, PostgreSQL (Supabase)
PWA: Service worker, manifest, install prompt
Testing: Playwright or Cypress
Environment variables
Create .env from .env.example.
Required
DATABASE_URL Postgres connection string
NODE_ENV development or production
PORT server port, default 3000
SESSION_SECRET or JWT_SECRET secret for auth
Scripts
{
  "dev": "tsx watch server/index.ts",
  "build": "tsc -p . && vite build",
  "start": "node dist/server/index.js",
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "test": "playwright test"
}
Project structure
client/                # React app
  src/                 # UI, pages, hooks, components
  index.html
  public/              # manifest.webmanifest, icons, sw.js

server/
  index.ts             # Express bootstrap
  routes.ts            # HTTP routes
  storage.ts           # Data access via Drizzle
  db.ts                # Drizzle + PG setup
  ws.ts                # WebSocket handlers

shared/
  schema.ts            # Drizzle models and Zod schemas

drizzle/               # Migrations (commit this)
Core features
Challenge lifecycle: open -> full -> in_progress -> completed or disputed or cancelled
Result reporting: host and opponent each submit, finalize on match, dispute on conflict
GPS check-in: 100 m radius validation
Real-time chat per challenge
Roles: user, venue_admin, super_admin
Admin dashboard: users, venues, analytics, exports
API overview
GET /health liveness probe
POST /api/report-result body: { challenge_id, user_id, reported_outcome }
Outcomes: host_won, opponent_won, draw, cancelled
Auth required; user may report only for self unless super_admin
POST /api/check-in GPS venue check-in
GET /api/challenges, GET /api/challenges/:id, POST /api/challenges
GET /api/venues and nearby queries
POST /api/referrals/claim referral code claim
GET /og/ch/:id.png dynamic Open Graph image
Result reporting flow
Player A posts outcome.
Status becomes in_progress if only one report exists.
Player B posts outcome.
If outcomes match -> completed with finalOutcome.
If outcomes differ -> disputed for admin review.
Idempotent and transaction safe.
PWA
client/public/manifest.webmanifest
client/public/sw.js
Network-first for /api/*
Stale-while-revalidate for static
Installable on mobile. Offline shell supported.
Security
Helmet, CORS allowlist, rate limiting
Session or token auth with HttpOnly cookies when applicable
Least-privilege DB role in production
Input validation with Zod across writes
pino logs with request id and latency
Migrations
Edit shared/schema.ts
npm run db:generate to create SQL
npm run db:push to apply
Commit drizzle/ migrations
Testing
E2E: open home, join challenge, report result, verify status
Accessibility: modal focus trap, keyboard navigation
Unit: API client schemas and error paths
Deployment
Replit Deploy
Run command: npm run build && npm start
Health endpoint: /health
Secrets: DATABASE_URL, NODE_ENV=production, PORT=3000, SESSION_SECRET
Static served from client/public with caching
Logs in Replit console
Monitoring
Uptime ping /health
Optional Sentry for errors, PostHog for analytics
Track activation, join, report, retention
License
See LICENSE. Use requires written approval if you adopt the permission-required license.
*** End Patch
