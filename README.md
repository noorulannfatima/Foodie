# Foodie

A multi-role food delivery app built with **React Native (Expo)** and a **Node.js / Express / MongoDB** API. Customers browse restaurants and place orders; restaurants manage menus and incoming orders; delivery partners accept and fulfill deliveries.

## Features

| Role | Capabilities |
|------|----------------|
| **Customer** | Sign up / log in, browse home & search, view restaurant menus, cart, checkout (Safepay or cash on delivery), order history, live order tracking |
| **Restaurant** | Sign up / log in, dashboard, menu CRUD, order list & status updates, store profile |
| **Delivery** | Sign up / log in, go online/offline, view order requests, accept orders, update delivery status, earnings & profile |

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Mobile app** | React Native 0.81, Expo 54, Expo Router, TypeScript, Zustand |
| **API** | Node.js, Express 5, TypeScript, Mongoose, JWT |
| **Payments** | [Safepay](https://getsafepay.com) (hosted checkout + webhooks), cash on delivery |
| **Database** | MongoDB |

## Project structure

```
Foodie/
├── frontend/          # Expo app (Expo Router, Atomic Design components)
├── backend/           # Express API + Mongoose models
├── CLAUDE.md          # Contributor / AI guide (architecture, conventions)
└── project_tree.md    # Full file tree reference
```

## Prerequisites

- **Node.js** ≥ 18 and npm
- **MongoDB** connection string
- **Expo Go** or iOS Simulator / Android Emulator
- **Safepay** sandbox keys (optional; required for online payments)

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, Safepay keys
npm run dev            # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start              # Metro — press i (iOS) or a (Android)
```

The app resolves the API host from Metro’s LAN IP when possible, so physical devices on the same network can reach your machine. Android emulators use `10.0.2.2`; iOS simulator uses `localhost`. See `frontend/services/api/baseUrl.ts`.

### Environment variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Auth token signing secret |
| `PORT` | API port (default `5000`) |
| `SAFEPAY_*` | Payment gateway (sandbox for development) |

Never commit `backend/.env`.

## API overview

| Prefix | Auth | Description |
|--------|------|-------------|
| `/auth/:role/signup` · `/login` | Public | Customer, restaurant, delivery registration |
| `/auth/verify` | JWT | Validate session |
| `/api/customer/*` | JWT (customer) | Home, search, cart, orders, tracking |
| `/restaurant/*` | JWT (restaurant) | Dashboard, profile, menu, orders |
| `/api/delivery/*` | JWT (delivery) | Profile, online status, order flow |
| `/api/payments/*` | JWT (customer) | Safepay initiate/verify, COD confirm |
| `/payments/safepay/webhook` | Signature | Safepay payment webhooks (raw body) |

## Project status

### Implemented

**Backend**

- Role-based auth (signup, login, JWT verify)
- Customer: home feed, restaurant detail, search, cart, order lifecycle (create, list, detail, cancel, rate, reorder, track)
- Restaurant: dashboard, profile, menu management, order status updates
- Delivery: profile, preferences, online toggle, order requests/history, accept & status updates
- Payments: Safepay flow + COD confirmation + webhook handling

**Frontend**

- Auth flows for all three roles with persisted session (`authStore`)
- Customer: home, search, restaurant detail, cart + checkout (Safepay deep link + COD), order history, order tracking (5s polling)
- Restaurant & delivery tabs wired to their APIs via Zustand / direct API calls
- Large UI component library (atoms → organisms)
- Dark mode support (`appThemeStore`)

### In progress / partial

- **Order history & tracking screens** — wired to API; cancel / rate / reorder exist on the API but are not yet exposed in the UI
- **Checkout** — Safepay + COD work end-to-end when backend and keys are configured
- **Restaurant menu images** — image picker UI exists; images are not uploaded to cloud storage (no upload API)
- **API clients** — `auth.api` uses shared Axios `apiClient`; customer, restaurant, and delivery modules use separate `fetch` helpers (should be consolidated onto `baseUrl.ts`)

### Not started (UI stubs or placeholders)

- `ForgotPasswordForm`, `DeliveryMap`, `ReviewsList`, `ReviewModal`, `SocialButton` — placeholder components only
- Forgot password shows “coming soon” on login screens
- Social login buttons (Google / Apple) are decorative
- Delivery dashboard map is a gradient mock, not `expo-maps`
- Loyalty points card shows hardcoded `0 pts` (model supports loyalty on the backend)
- Premium member badge is cosmetic only

---

## What’s left to do

Use this as a backlog. Items are grouped by priority area.

### Customer experience

- [ ] **Customer profile API** — `personal-information` saves locally only; add `PATCH /api/customer/profile` (name, phone, avatar) and wire the screen
- [ ] **Saved addresses** — User model has `savedAddresses`; add CRUD routes + UI (profile / checkout address picker)
- [ ] **Order actions in UI** — Wire `cancelOrder`, `rateOrder`, and `reorder` on order history / detail screens (API already exists)
- [ ] **Full order detail screen** — Beyond tracking: line items, pricing breakdown, payment status, reorder CTA
- [ ] **Reviews** — Implement `ReviewModal` / `ReviewsList` and connect to `rateOrder` + restaurant reviews
- [ ] **Loyalty program** — Earn/redeem points on checkout; reflect balance in profile card
- [ ] **Payment methods page** — Persist defaults via backend or align with Safepay-only + COD (remove fake card storage)
- [ ] **Forgot password** — Backend reset flow + `ForgotPasswordForm`

### Restaurant & delivery

- [ ] **Image upload service** — S3 / Cloudinary (or similar) for logos, menu photos, and store gallery
- [ ] **Real-time map tracking** — Integrate `expo-maps` / live driver location on customer tracking and delivery dashboard
- [ ] **Push notifications** — Order status changes for customer, restaurant, and delivery (model has notification prefs)
- [ ] **Delivery session timer** — Replace placeholder “5h 20m” online label with real session tracking

### Platform & quality

- [ ] **Unify API client** — Single Axios instance + `baseUrl.ts` for all modules; remove duplicate `fetch` + host logic
- [ ] **Database seed script** — Sample restaurants, menus, and test users for local development
- [ ] **Tests** — API integration tests and critical frontend flows (auth, checkout)
- [ ] **CI** — Lint, typecheck, and test pipeline
- [ ] **Production config** — Environment docs, Safepay production keys, app store build profiles

### Nice to have

- [ ] OAuth (Google / Apple) sign-in
- [ ] WebSockets or SSE for order updates (replace polling on track screen)
- [ ] Admin / ops dashboard
- [ ] Promo codes and discounts

---

## Scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm start` | Expo Metro (clears cache) |
| `npm run ios` | iOS simulator |
| `npm run android` | Android emulator |
| `npm run web` | Web target |

## Path alias (frontend)

`@/` maps to `frontend/` (see `babel.config.js` and `tsconfig.json`).

```ts
import { Button } from '@/components/atoms';
```

## Further reading

- **[project_tree.md](./project_tree.md)** — Complete repository file tree

## License

Private / unlicensed — add a license file if you plan to open-source or distribute.
