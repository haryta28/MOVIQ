# Moviq — Backend Contracts

## Scope
Full-stack conversion of the Moviq OOH/vehicle-branding platform. Backend built with FastAPI + MongoDB, JWT-based auth.

## Auth
- **JWT bearer** in `Authorization: Bearer <token>` header for protected routes.
- Roles: `admin`, `agency`.
- WhatsApp bot uses **no auth** (field executives are anonymous, identified by driver phone).

### Seeded users (from `mock.currentUsers`)
| Email | Password | Role | Name |
|---|---|---|---|
| admin@moviq.in | demo1234 | admin | Deepak Bansal |
| saurav@brightads.in | demo1234 | agency (agencyId=a1) | Saurav Mehta |

## Endpoints (all prefixed `/api`)

### Auth
- `POST /api/auth/login` `{email, password}` → `{token, user}`
- `GET  /api/auth/me` → `user`

### Agencies (admin)
- `GET  /api/agencies` → `Agency[]`
- `POST /api/agencies` → `Agency`
- `GET  /api/agencies/{id}` → `Agency`

### Brands
- `GET  /api/brands` → `Brand[]`

### Campaigns
- `GET  /api/campaigns?agency_id=` → `Campaign[]`
- `POST /api/campaigns` → `Campaign` (agency creates for self)

### Tasks
- `GET  /api/tasks?agency_id=&status=&city=` → `Task[]`
- (Tasks auto-seeded per campaign)

### Users
- `GET  /api/users?role=` → `User[]` (roles: admin, agency, supervisor, field)

### Fraud Alerts
- `GET   /api/fraud-alerts` → `FraudAlert[]`
- `POST  /api/fraud-alerts/{id}/resolve` → `{ok}`

### Media Types
- `GET    /api/media-types` → `MediaType[]`
- `POST   /api/media-types` `{label, category}` → `MediaType`
- `DELETE /api/media-types/{key}` → `{ok}`

### Vehicle Submissions (WhatsApp bot)
- `POST /api/vehicle-submissions` **public** `{vehicle, driver_name, driver_phone, photos:[{label,gradient}], gps:{lat,lng}}` → `VehicleSubmission`
- `GET  /api/vehicle-submissions` (auth) → `VehicleSubmission[]`

### Analytics
- `GET /api/analytics/overview` → `{monthlyStats, cityStats, kpis}`

### Notifications
- `GET /api/notifications` → `Notification[]`

## Data models (Mongo)
- `users` — {id, email, password_hash, role, name, avatar, agency_id?, agency_name?}
- `agencies` — from `mock.agencies`
- `brands` — from `mock.brands`
- `campaigns` — from `mock.campaigns`
- `tasks` — from `mock.tasks`
- `fraud_alerts` — from `mock.fraudAlerts`
- `field_executives`, `supervisors` — from mock
- `media_types` — from `mock.mediaTypes`
- `notifications` — from `mock.notifications`
- `monthly_stats`, `city_stats` — from mock
- `vehicle_submissions` — NEW, populated by WhatsApp bot flow

## Seeding
On backend startup, if any collection is empty, seed it from the same data currently in `frontend/src/mock/mock.js`. Idempotent.

## Frontend integration
1. Create `src/api.js` axios client that reads `REACT_APP_BACKEND_URL` and attaches `Authorization` header from localStorage.
2. `AuthContext` calls `POST /api/auth/login`, stores `token` + `user` in localStorage; on refresh calls `GET /api/auth/me` to hydrate.
3. Each page replaces its `import { ... } from '../../mock/mock'` with API calls in `useEffect` and stores results in local state.
4. `mock.js` remains only for the WhatsApp bot's `MOVIQ_LOGO`-independent client-side rendering hints (nothing else).
5. Login pre-fill emails updated to real seeded credentials.

## What stays mocked / client-only
- `MOVIQ_LOGO` URL, WhatsApp bot UX (typing effect, delays, gradients for pseudo-photos).
- No real WhatsApp Business API; submission goes to our backend directly.
