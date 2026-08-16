# Verification results

Executed in the audit environment on 16 Aug 2026.

## Passed

- Deterministic full-stack verification — PASS
- Judge workflow simulation — PASS
- Frontend/backend ESG integration simulation — PASS
- Backend Node test suite — 7/7 PASS
- `node --check` for backend source, Prisma seed and audit scripts — PASS
- Frontend/backend relative-import scan — PASS (53 source JS/JSX files)
- Root package-lock dependency consistency — PASS
- 140-office JSON/CSV row-for-row comparison — PASS
- 140-office master validation — PASS
- Sample submission input: Mumbai Head Post Office-style synthetic record / FY 2025-26 — validation PASS; ESG 72/100; 0 risks
- Workflow simulation: submit → approve/return → resubmit — PASS
- Invalid metrics rejected — PASS
- Fractional integer rejection — PASS
- Incomplete submission rejection — PASS
- Boundary-value acceptance — PASS
- Unauthorized state transition rejection — PASS
- Claim/provenance scan: no unsupported claim that the synthetic office dataset is an official/live India Post master — PASS

## Not executed here

- `npm run build` could not execute because the audit sandbox cannot reliably install the project's npm dependencies.
- Live PostgreSQL + HTTP/browser integration could not execute because Docker is unavailable in the audit environment.

Run these environment-dependent checks locally before submission:

```bash
npm ci
npm run build
npm run verify
npm run simulate:judge
npm run simulate:integration
```

Then start PostgreSQL/backend and exercise the two-browser Operator → Manager workflow.
