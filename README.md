# India Post BRSR / ESG Platform — Full Stack

This package contains the React/Vite frontend plus a real Node.js/Express + PostgreSQL + Prisma backend.

## 1. Requirements

- Node.js 20+
- Docker Desktop (recommended for PostgreSQL)
- npm 10+

## 2. Start PostgreSQL

Open Terminal 1:

```bash
cd backend
docker compose up -d postgres
```

## 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Change `JWT_SECRET` in `.env` to a long random value (at least 32 characters).

Then:

```bash
npm install
npx prisma db push
npm run prisma:seed
npm run dev
```

Backend health check:

`http://localhost:4000/api/health`

## 4. Start the frontend

Open Terminal 2 in the project root:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

Because `.env.example` enables backend mode, the login screen will use the API.

## 5. Demo accounts

Manager:

`manager@sih.local` / `SIH@2026`

Operators:

`operator1@sih.local` through `operator10@sih.local` / `SIH@2026`

Each seeded operator is assigned to a different demo post office.

## 6. What is now backend-backed

- Authentication and role checks
- Central PostgreSQL storage
- Draft/submission workflow
- Manager approve/reject/return actions
- ESG/risk calculation API
- Network/map aggregation API
- Evidence upload metadata and server-side file storage
- Audit logs
- Offline sync endpoint with idempotent operation IDs
- Real-time server events using Server-Sent Events (SSE)
- Existing browser offline cache remains available as a fallback

## 7. Offline workflow

When the browser loses connectivity, the existing frontend continues using its local cache. When connectivity returns, queued changes can be synchronized through `/api/sync`. The server records processed operation IDs so retries do not create duplicates.

## 8. Useful API endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/offices`
- `GET /api/submissions`
- `GET /api/submissions/:id`
- `POST /api/submissions`
- `PUT /api/submissions/:id`
- `POST /api/evidence`
- `GET /api/evidence/:submissionId`
- `GET /api/esg/network`
- `GET /api/reports/network`
- `POST /api/sync`
- `GET /api/events`

## 9. Run backend with Docker

For a convenient local backend container:

```bash
cd backend
docker compose up --build
```

Then initialize the schema and demo data from a second terminal:

```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
```

The API will be available at `http://localhost:4000`. Change the example `JWT_SECRET` in `docker-compose.yml` before any non-demo use.

## 9. Verification checklist

After setup, verify these before your SIH demo:

```bash
# backend
cd backend
npm run check

# frontend (from project root)
npm run build
```

Then test the workflow with two browser windows: Operator submits → Manager sees the update → Manager approves/returns → Operator resubmits. Also test one submission while the browser is offline and confirm the queued operation is synchronized after reconnecting.

## 10. Production notes

This is an SIH prototype, not a production government deployment. Before production: use HTTPS, private object storage for evidence, short-lived access tokens/secure refresh tokens, stronger account provisioning, rate limiting, malware scanning for uploads, database backups, secret rotation, monitoring, and a managed PostgreSQL service.

## Dummy post-office dataset

The `dummy-data/` folder contains **140 synthetic post-office records** in both JSON and CSV formats. The same JSON file is used by the frontend office selector/map fallback and by the backend Prisma seed script, keeping the two sides on a shared office-data source.

These are presentation/testing records only and are explicitly marked `dummy: true`; they are not official India Post data.

## Full-stack demo data

The backend seed loads all **140 synthetic offices** from `dummy-data/post-offices-140.json`, creates one operator account per office, and creates demo submissions across the network. This makes the national map and manager dashboard useful immediately after seeding.

## Final audit and deployment

The repository includes `FINAL_AUDIT.md`, `FULLSTACK_SYNC_CONTRACT.md`, `SUBMISSION_CHECKLIST.md`, and `DEPLOYMENT.md`.

Run the deterministic checks before submission:

```bash
npm run verify
```

Backend tests are also available directly:

```bash
cd backend
npm test
```

The frontend/backend use the same `dummy-data/post-offices-140.json` office master for the prototype. The dataset is explicitly synthetic and should be replaced with verified Department of Posts data before production use.


## Ultimate audit (2026-08-16)

This package includes the latest pre-submission hardening pass.

### Added/fixed in this pass

- Server-side submission completeness validation before Submit/Resubmit.
- Whole-number enforcement for employee, community-program and grievance counts.
- Operator submission access is owner-scoped; operators cannot edit another operator's submission in the same office.
- Network ESG/report endpoints are restricted to Manager/Admin roles.
- Manager review actions cannot silently modify operator-entered ESG data.
- Evidence uploads require Operator/Admin role, allowed MIME type, 10 MB maximum, and matching file signatures.
- Frontend local imports use explicit extensions for more predictable ESM tooling.
- Frontend/backend ESG calculation contract is covered by an integration simulation.
- Added a deployment-ready frontend Dockerfile + Nginx SPA configuration.
- Docker Compose secrets are supplied through environment variables rather than committed credentials.
- Added boundary, incomplete-data, fractional-integer, workflow and frontend/backend consistency simulations.

### Verification commands

```bash
npm ci
npm run build
npm run verify
npm run simulate:judge
npm run simulate:integration
```

Backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm test
npm run prisma:seed
npm start
```

`dummy-data/post-offices-140.json` remains synthetic demo data. For production, replace it with the current verified Department of Posts / India Post master or an approved government data feed.
