# Foodie

A multi-role food delivery app built with **React Native (Expo)** and a **Node.js / Express / MongoDB** API. Customers browse restaurants and place orders, restaurants manage menus, orders and payouts, riders pick up and deliver orders, and admins manage restaurants and settle payouts.

## Features

| Role | Capabilities |
|------|----------------|
| **Customer** | Sign up / log in / reset password, home feed & search, restaurant menus and dish detail pages, dish reviews, cart with suggestions, checkout (Safepay or cash on delivery), saved addresses, order history, live order tracking, cancel / reorder / review orders, push notifications, notification preferences |
| **Restaurant** | Sign up / log in, dashboard, open/closed status, menu CRUD with Cloudinary image upload and item availability, order list & status updates with the assigned rider, reviews, payout summary & history, payout account, push notifications, store profile |
| **Delivery (rider)** | Sign up / log in, go online/offline, order requests, accept or release an order before pickup, per-stage customer details and contact, cash collection confirmation for COD, cancellation notices, delivery history, earnings, reviews, profile & preferences |
| **Admin** | Overview dashboard, restaurant management, per-restaurant commission rate and payout account, generate payouts and mark them paid / failed |

All money is shown in whole Pakistani rupees (PKR) through a shared `formatCurrency` helper on both backend and frontend. The UI supports English, Spanish, French and Urdu, plus light and dark themes.

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Mobile app** | React Native 0.81, Expo 54, Expo Router, TypeScript, Zustand, TanStack Query, Axios |
| **API** | Node.js, Express 5, TypeScript, Mongoose 9, JWT, bcrypt |
| **Payments** | [Safepay](https://getsafepay.com) (hosted checkout + webhooks), cash on delivery |
| **Media** | [Cloudinary](https://cloudinary.com) image uploads |
| **Notifications** | Expo push notifications (`expo-notifications`) |
| **Database** | MongoDB |
| **Testing** | Jest (backend integration tests) |

## Project structure

```
Foodie/
├── frontend/                 # Expo app
│   ├── app/                  # Expo Router routes: (auth), (customer), (restaurant), (delivery), (admin)
│   ├── components/           # Atomic Design: atoms → molecules → organisms → pages
│   ├── constants/            # Theme and per-role translated strings
│   ├── hooks/                # Shared hooks (active order polling, pull-to-refresh, ...)
│   ├── services/             # API clients, Safepay, push notifications
│   ├── stores/               # Zustand stores (auth, cart, theme, language, preferences, ...)
│   └── utils/                # Currency formatting, persisted storage
└── backend/                  # Express API
    ├── src/
    │   ├── controllers/      # Route handlers per role / feature
    │   ├── middleware/       # JWT auth and role guards
    │   ├── models/           # Mongoose models
    │   ├── routes/           # Route definitions
    │   ├── services/         # Safepay, Cloudinary, push, payouts, ratings, order rollback
    │   └── scripts/          # Admin creation, seeding and maintenance scripts
    └── tests/                # Jest tests
```

## Prerequisites

- **Node.js** ≥ 18 and npm
- **MongoDB** connection string
- **Expo Go**, a development build, or an iOS Simulator / Android Emulator
- **Safepay** sandbox keys (optional; required for online payments)
- **Cloudinary** account (optional; required for image uploads)

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:5000
```

Create an admin account to sign in to the admin app:

```bash
npm run create:admin -- <email> <password> <name>
```

### 2. Frontend

```bash
cd frontend
npm install
npm start              # Metro — press i (iOS) or a (Android)
```

The app resolves the API host from Metro’s LAN IP when possible, so physical devices on the same network can reach your machine. Android emulators use `10.0.2.2`; the iOS simulator uses `localhost`. See `frontend/services/api/baseUrl.ts`.

### Environment variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Auth token signing secret |
| `PORT` | API port (default `5000`) |
| `SAFEPAY_ENVIRONMENT`, `SAFEPAY_BASE_URL`, `SAFEPAY_API_KEY`, `SAFEPAY_SECRET_KEY`, `SAFEPAY_WEBHOOK_SECRET` | Payment gateway (sandbox for development) |
| `SAFEPAY_REDIRECT_URL`, `SAFEPAY_CANCEL_URL` | Deep links the app opens after hosted checkout |
| `SAFEPAY_FEE_RATE` | Safepay’s cut on online orders, charged to the restaurant in payouts |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | Image uploads |
| `EXPO_ACCESS_TOKEN` | Optional; Expo push service access token |

Never commit `backend/.env`.

## API overview

| Prefix | Auth | Description |
|--------|------|-------------|
| `/auth/:role/signup` · `/login` | Public | Customer, restaurant, delivery registration and login |
| `/auth/:role/forgot-password` · `/reset-password` | Public | 6-digit reset code flow |
| `/auth/verify` | JWT | Validate session |
| `/api/customer/*` | JWT (customer) | Home, search, restaurants & dishes, dish reviews, cart & suggestions, addresses, preferences, push token, orders (create, active, detail, cancel, rollback, review, reorder, track) |
| `/restaurant/*` | JWT (restaurant) | Dashboard, profile, open status, menu, orders, reviews, payouts, notification preferences, push token |
| `/api/delivery/*` | JWT (delivery) | Profile, preferences, online status, order requests / active / history, accept, release, status updates, cancellation acknowledgement, reviews |
| `/api/admin/*` | JWT (admin) | Overview, restaurants, commission, payout accounts, payout generation and settlement |
| `/api/payments/*` | JWT (customer) | Safepay initiate/verify, COD confirm |
| `/payments/safepay/webhook` | Signature | Safepay payment webhooks (raw body) |
| `/upload/image` | JWT | Upload an image to Cloudinary |

## Payouts

Foodie collects online payments; for cash orders the restaurant keeps the cash. Commission (set per restaurant by an admin) is owed on every order, and the Safepay fee is deducted on online orders. A restaurant with mostly cash orders can therefore end up with a negative net balance. Admins generate payouts for a period and mark each one paid or failed; restaurants see their summary and history in the app.

## Project status

### Implemented

- Role-based auth for customers, restaurants, riders and admins, with a password reset code flow
- Full order lifecycle: checkout, payment (Safepay or COD), restaurant status updates, rider assignment, pickup, delivery, cancellation and rollback of failed payments
- Rider flow with per-stage customer visibility, release before pickup, and mandatory cash confirmation before completing a COD delivery
- Reviews for dishes and riders, with ratings derived from the review collection
- Saved customer addresses and preferences
- Restaurant payouts with commission and payment fees, managed from the admin app
- Cloudinary image uploads for menus and stores
- Push notifications for order status changes
- Multi-language UI (English, Spanish, French, Urdu) and dark mode
- Backend Jest test suite covering orders, delivery, reviews, payouts, addresses and admin

### Not started / placeholders

- `DeliveryMap` and `SocialButton` are placeholder components
- Order tracking and the rider dashboard poll the API instead of showing a live map
- Forgot-password codes are logged on the server; no email or SMS is sent yet
- `customer.api` and `restaurant.api` still use their own `fetch` helpers instead of the shared Axios `client`

---

## What’s left to do

- [ ] **Live map tracking** — `expo-maps` with rider location on customer tracking and the rider dashboard
- [ ] **Password reset delivery** — Send reset codes by email or SMS
- [ ] **Unify API client** — Move all modules onto the shared Axios client and `baseUrl.ts`
- [ ] **Loyalty program** — Earn/redeem points on checkout
- [ ] **Real-time updates** — WebSockets or SSE instead of polling
- [ ] **Frontend tests and CI** — Critical flows (auth, checkout) plus a lint, typecheck and test pipeline
- [ ] **Multi-currency** — Currently PKR only
- [ ] **Production config** — Safepay production keys, app store build profiles
- [ ] OAuth (Google / Apple) sign-in
- [ ] Promo codes and discounts

---

## Scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm test` | Run the Jest test suite |
| `npm run create:admin -- <email> <password> <name>` | Create an admin account |
| `npm run seed:pizzaperfetto` | Seed the Pizza Perfetto menu (with Cloudinary images), orders and reviews |
| `npm run seed:beefhouse` | Seed sample orders, a rider and reviews for the existing Beef House restaurant |
| `npm run recalculate:ratings` | Rebuild restaurant and rider ratings from reviews |
| `npm run migrate:images` | Move existing images to Cloudinary |

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

## License

Private / unlicensed — add a license file if you plan to open-source or distribute.
