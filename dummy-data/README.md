# India Post demo office master data

This folder contains the 140-office synthetic dataset used by both the React frontend and the backend seed.

## What is realistic

- Office names use common Indian postal-office naming patterns (GPO/HO/SO-style names).
- PIN codes are six-digit values used for demonstration; the records are synthetic and are not a verified copy of the current India Post office master.
- States, districts and postal regions are aligned to Indian geography for demo purposes.
- Coordinates are approximate city-centre coordinates intended for the prototype map; they are **not survey-grade office coordinates**.

## Important

These records are marked `dummy: true` and must not be presented as an authoritative live India Post office master. Before production deployment, replace this file with the current verified Department of Posts / India Post master data or an approved government data feed.

The official India Post Pincode List and the Government of India's All India Pincode Directory are the appropriate sources to use for that production replacement.
