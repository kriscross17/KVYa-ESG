# SIH BRSR Backend

Node.js + Express + Prisma + PostgreSQL backend for the India Post BRSR/ESG prototype.

## Quick start

1. Copy `.env.example` to `.env` and set a JWT secret of at least 32 characters.
2. Start PostgreSQL with `docker compose up -d postgres` or use another PostgreSQL instance.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npx prisma db push` for local/demo schema setup.
6. Run `npm run prisma:seed` to load the 140 synthetic offices, 140 operator accounts, and demo submissions.
7. Run `npm run dev`.

The API listens on `http://localhost:4000` by default.

## Demo accounts

All seeded accounts use password `SIH@2026`.

- Manager: `manager@sih.local`
- Admin: `admin@sih.local`
- Operators: `operator1@sih.local` through `operator140@sih.local`

Each operator is assigned to exactly one seeded office.

## Shared dummy office data

The seed reads `../dummy-data/post-offices-140.json` from the project root. The frontend uses the same JSON file for its office selector/map fallback. This keeps office names, states and coordinates aligned between frontend and backend.

The records are synthetic and marked `dummy: true`; they are not official India Post data.

## Main API areas

- `/api/auth/*` authentication
- `/api/offices/*` office master data
- `/api/submissions/*` submission lifecycle
- `/api/evidence/*` evidence and OCR metadata
- `/api/esg/*` ESG/network analysis
- `/api/reports/*` approved-report data
- `/api/sync` offline synchronization
- `/api/events` authenticated Server-Sent Events
- `/api/health` database/API health check
