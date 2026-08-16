# FINAL AUDIT — SIH BRSR Full Stack

Audit date: 2026-08-16

## Static checks

- 0 plain JavaScript syntax errors (`node --check`)
- 0 broken relative imports (53 JS/JSX source files scanned)
- Root package.json/package-lock.json dependency sets match
- 140 office records validated
- JSON/CSV row counts match
- Office names and office codes are unique
- PIN codes are six digits
- Coordinates fall within India bounds
- No `.env` secrets or `node_modules` are bundled

## Automated tests

- Backend Node test suite: 7/7 PASS
- Shared office verification: PASS
- Judge workflow simulation: PASS
- Frontend/backend ESG integration simulation: PASS
- Invalid metric rejection: PASS
- Fractional integer rejection: PASS
- Incomplete submission rejection: PASS
- Boundary-value acceptance: PASS
- Unauthorized workflow transition rejection: PASS

## Security/workflow hardening

- Operator access is restricted to their own submissions.
- Network endpoints are Manager/Admin only.
- Manager review actions cannot overwrite operator ESG data.
- Evidence uploads require Operator/Admin role, allowed MIME type, file-size limit and file-signature validation.
- Login attempts are rate limited in-process.
- JWT secret is required at startup and must be at least 32 characters.
- Docker Compose secrets are environment-driven.

## Hallucination / provenance review

- Synthetic office data is explicitly labeled as demo data and is not presented as an official or current India Post master.
- Removed wording that could imply a manager approval is an official regulatory acceptance. Approval is described as an internal workflow state.
- The ESG score is explicitly labeled as a prototype decision-support indicator, not an official BRSR/SEBI compliance calculation.
- The map is labeled as a live-synchronized view only when the backend is configured; local/demo mode is labeled accordingly.
- No claim of successful production build or live PostgreSQL/browser integration is made for the sandbox audit; those checks remain explicitly listed as local verification steps.

## Known environment limitation

A real production Vite build and live PostgreSQL/browser integration cannot be executed in this sandbox because npm dependency downloads are unavailable/intermittent. The deterministic tests and source-level checks above pass. Run `npm ci && npm run build` locally before submission and perform the two-browser workflow against PostgreSQL.

## Data provenance

The 140 office records are synthetic demo records. They are not an authoritative live India Post master. Production deployment should replace them with a current verified Department of Posts / India Post dataset or approved government feed.
