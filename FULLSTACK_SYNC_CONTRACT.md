# Frontend ↔ Backend Sync Contract

## Shared master data

Both sides use `dummy-data/post-offices-140.json` as the synthetic office master dataset.

- Frontend: `src/data/constants.js`
- Backend seed: `backend/prisma/seed.js`

## Submission field mapping

| Frontend | API / Database |
|---|---|
| `postOffice` | `Office.name` / `officeId` |
| `reportingPeriod` | `Submission.reportingPeriod` |
| `status: Draft` | `DRAFT` |
| `status: Pending Review` | `PENDING_REVIEW` |
| `status: Approved` | `APPROVED` |
| `status: Rejected` | `REJECTED` |
| `status: Returned for Correction` | `RETURNED` |
| `buildingData.electricityConsumptionKwh` | `BuildingData.electricityConsumption` |
| `buildingData.waterUsageKl` | `BuildingData.waterUsage` |
| `buildingData.wasteGeneratedKg` | `BuildingData.wasteGenerated` |
| `buildingData.renewableEnergyKwh` | `BuildingData.renewableEnergy` |
| `operationalData.digitalTransactionsPercent` | `OperationalData.digitalTransactionsPct` |
| `operationalData.totalEmployees` | `OperationalData.totalEmployees` |
| `operationalData.femaleEmployees` | `OperationalData.femaleEmployees` |
| `operationalData.grievancesResolved` | `OperationalData.grievancesResolved` |
| `operationalData.grievancesTotal` | `OperationalData.grievancesTotal` |

## Workflow contract

`DRAFT → PENDING_REVIEW → APPROVED`

`DRAFT → PENDING_REVIEW → RETURNED → PENDING_REVIEW → APPROVED`

`PENDING_REVIEW → REJECTED`

Operators can edit only `DRAFT` and `RETURNED`. Managers can perform review actions only on `PENDING_REVIEW`.

## Offline contract

Offline operations are queued as `UPSERT_SUBMISSION` records. Each operation has a unique operation ID. The backend stores processed operation IDs in `SyncOperation`, making retries idempotent for the same user.

## Real-time contract

Backend emits authenticated SSE `submission.updated` events. The frontend treats these as invalidation events and refreshes submissions from the API. This avoids sending a second, potentially stale copy of the entire dataset over the live channel.

## ESG contract

The backend `calculateEsg()` returns `score` and `overall` with identical values. The frontend uses the same transparent formula for its local preview. The score is explicitly a prototype decision-support indicator, not an official BRSR compliance score.
