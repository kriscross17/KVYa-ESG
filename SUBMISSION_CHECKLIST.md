# SIH BRSR Platform — Submission Checklist

## Local setup

1. Install Node.js 20+ and Docker Desktop.
2. Start PostgreSQL: `cd backend && docker compose up -d postgres`.
3. Copy `backend/.env.example` to `backend/.env` and set a JWT secret of at least 32 characters.
4. Run `cd backend && npm install && npx prisma db push && npm run prisma:seed && npm run dev`.
5. In a second terminal, run `npm install && npm run dev` from the project root.
6. Open the Vite URL, normally `http://localhost:5173`.

## Demo credentials

- Manager: `manager@sih.local` / `SIH@2026`
- Operators: `operator1@sih.local` through `operator10@sih.local` / `SIH@2026`

## Verification

Run from the project root:

```bash
npm ci
npm run build
npm run verify
npm run simulate:judge
```

Run from `backend/`:

```bash
npm run check
```

Then test:

- Operator login
- Create draft
- Save and resume draft
- OCR scan
- Evidence upload
- Submit for review
- Manager receives the real-time update
- Manager approves/returns/rejects
- Operator corrects and resubmits a returned submission
- Offline form edit
- Reconnect and verify queued synchronization
- National map/dashboard update
- BRSR report generation

## Important prototype note

The ESG readiness score is a transparent prototype decision-support indicator. It is not an official regulatory BRSR compliance calculation.

The local evidence fallback stores evidence metadata when offline; the actual file upload requires connectivity.
