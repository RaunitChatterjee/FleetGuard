# FleetGuard Dashboard (Frontend)

A live security operations console for the FleetGuard fleet telematics
platform. Built with React + Vite, styled as a dark graphite/amber SOC
instrument panel, and connected directly to the FastAPI backend in
`../backend` — no mock data, no invented endpoints.

## Run it

```bash
cd frontend
npm install
npm run dev
```

The dev server runs at `http://127.0.0.1:5173` by default and expects the
backend at `http://127.0.0.1:8000`. To point at a different backend host,
copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

The backend must be running first — see `../backend/README` or the root
project instructions. CORS is enabled on the backend
(`backend/app/main.py`) so the dev server can call it directly.

## What it does

- **Overview** — fleet-wide stats, a live telemetry grid plotting real
  device GPS positions, recent attack activity, and threat-type
  distribution, all pulled from `/api/stats`, `/api/devices`,
  `/api/telemetry/{device_id}` and `/api/alerts`.
- **Alerts** — the full alert feed with severity, MITRE ATT&CK mapping,
  and a working **Acknowledge** action wired to
  `PATCH /api/alerts/{id}/acknowledge`.
- **Fleet** — device roster and per-device telemetry detail (speed
  history, position, firmware, open alerts).

Data refreshes on a short poll interval per panel; the header shows a
live link-status indicator that reflects real API reachability.

## Notes

- Nothing here is faked: if a device hasn't sent telemetry yet, it
  doesn't appear on the map (it isn't given a fabricated position), and
  the UI says so explicitly.
- `device.status` from the backend is currently always `"normal"` (the
  backend doesn't yet compute a live risk state) — the UI reflects that
  honestly rather than inventing a derived status.
